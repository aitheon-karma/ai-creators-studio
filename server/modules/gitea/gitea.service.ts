import Container, { Service, Inject } from 'typedi';
import { MailerService, SendMailOptions } from '../core/mailer.service';
import * as path from 'path';
import { Transporter, TransporterService, Action, Event, param } from '@aitheon/transporter';
import { promisify } from 'util';
import { logger, User, Organization } from '@aitheon/core-server';
import { GiteaUserSchema, GiteaUser, GiteaSSH } from './gitea-user.model';
import { generate } from 'generate-password';
import * as slug from 'slug';
import * as request from 'request-promise-native';
import { environment } from '../../environment';
// import * as NodeRSA from 'node-rsa';
// import * as forge from 'node-forge';
import { Project } from '../projects/project.model';
import Db from '@aitheon/core-server/dist/config/db';
import * as sshpk from 'sshpk';

const crypto = require('crypto');
const generateKeyPair = promisify(crypto.generateKeyPair);

@Service()
@Transporter()
export class GiteaService extends TransporterService {

  mailerService: MailerService;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.mailerService = Container.get(MailerService);
  }


  @Action()
  async createUserSync(@param({ type: 'any' }) payload: { user: User, password?: string }): Promise<void> {
    return this.createUser(payload);
  }

  @Event()
  async createUser(payload: { user: User, password?: string }): Promise<void> {
    try {

      const username = payload.user._id.toString();

      const password = payload.password || generate({
        length: 20, // randomize length between 10 and 20 characters
        numbers: true,
        symbols: true,
        uppercase: true,
        excludeSimilarCharacters: false
      });
      const result = await this.addGiteaUser(payload.user, username, password);

      const { publicKey, privateKey } = await generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        }
      });
      const pemKey = sshpk.parseKey(publicKey, 'pem', { filename: payload.user.email });
      const publicKeySSH = pemKey.toString('ssh');

      const ssh = { publicKey: publicKeySSH, privateKey };
      const giteaUser = new GiteaUserSchema({ ssh, user: payload.user, username, giteaId: result.id }).save();
      await this.addGiteaSSH(username, ssh);

    } catch (err) {
      if (err.error && err.error.length > 0 && err.error[0].classification === 'EmailError') {
        payload.user.email = `${payload.user._id}@example.com`;
        return this.createUser(payload);
      }
      logger.error('[createUser]', err);
      throw err;
    }
  }

  @Event()
  async changePassword(payload: { user: User, password: string }): Promise<void> {
    try {
      await this.patchGiteaUser(payload);
    } catch (err) {
      logger.error('[changePassword]', err);
      throw err;
    }
  }

  @Event()
  async changeEmail(payload: { user: User }): Promise<void> {
    try {
      await this.patchGiteaUser(payload);
    } catch (err) {
      logger.error('[changeEmail]', err);
      throw err;
    }
  }

  async patchGiteaUser(payload: { user: User, password?: string }) {
    const giteaUser = await GiteaUserSchema.findOne({ user: payload.user._id });
    if (!giteaUser) {
      return;
    }
    const body = {
      email: payload.user.email,
      full_name: `${payload.user.profile.firstName} ${payload.user.profile.lastName}`,
      login_name: giteaUser.username
    } as any;

    if (payload.password) {
      body.password = payload.password;
    }

    await this.baseGiteaRequest(`/admin/users/${giteaUser.username}`, 'PATCH', body);
  }

  @Event()
  async createOrganization(payload: { user: string, organization: Organization }): Promise<any> {
    try {
      const giteaUser = await GiteaUserSchema.findOne({ user: payload.user });
      if (!giteaUser) {
        logger.info('[createOrganization] Not such user in gitea:', payload.user);
        return;
      }
      const username = payload.organization._id;
      const body = {
        repo_admin_change_team_access: false,
        username: username,
        full_name: payload.organization.name || username,
        visibility: 'private',
      };

      const result = await this.baseGiteaRequest(`/admin/users/${giteaUser.username}/orgs`, 'POST', body, true);
      await new GiteaUserSchema({ organization: payload.organization._id, giteaId: result.id, username }).save();

      console.log(result);
    } catch (err) {
      logger.error('[createOrganization]', err);
    }
  }

  @Event()
  async renameOrganization(payload: { user: string, organization: Organization, newDomain: string }): Promise<any> {
    try {

      // GITEA don't support user/org rename from API. Need customization of gitea code

      // const giteaUser = await GiteaUserSchema.findOne({ user: payload.user });
      // if (!giteaUser) {
      //   logger.info('[renameOrganization] Not such user in gitea:', payload.user);
      //   return;
      // }
      // const orgName = slug(payload.organization.domain);
      // const newOrgName = slug(payload.newDomain);
      // const body = {
      //   repo_admin_change_team_access: true,
      //   username: newOrgName,
      //   full_name: newOrgName,
      //   visibility: 'private',
      // };

      // const result = await this.baseGiteaRequest(`/orgs/${ orgName }`, 'PATCH', body, true);
      // console.log(result);
      // const result = await this.baseGiteaRequest(`/admin/users/${ orgName }`, 'PATCH', body);
      // const result = await this.baseGiteaRequest(`/orgs/${ orgName }`, 'PATCH', body, true);
      // console.log(result);
    } catch (err) {
      logger.error('[renameOrganization]', err);
    }
  }

  @Action()
  async addOrgMemberSync(@param({ type: 'any' }) payload: { user: string, organization: Organization }): Promise<any> {
    return this.addOrgMember(payload);
  }

  @Event()
  async addOrgMember(payload: { user: string, organization: Organization }): Promise<any> {
    try {

      const giteaOrgUser = await GiteaUserSchema.findOne({ organization: payload.organization });
      if (!giteaOrgUser) {
        logger.info('[addOrgMember] Not such org in gitea:', payload.organization);
        return;
      }
      const teams = await this.baseGiteaRequest(`/orgs/${giteaOrgUser.username}/teams`, 'GET');
      if (teams.length === 0) {
        return;
      }
      const ownerTeam = teams.find((t: any) => t.name.toLowerCase() === 'owners');
      if (!ownerTeam) {
        return;
      }
      const giteaUser = await GiteaUserSchema.findOne({ user: payload.user });
      if (!giteaUser) {
        logger.info('[addOrgMember] Not such user in gitea:', payload.user);
        return;
      }
      const result = await this.baseGiteaRequest(`/teams/${ownerTeam.id}/members/${giteaUser.username}`, 'PUT', {});
      // console.log(result);
    } catch (err) {
      logger.error('[addOrgMember]', err);
    }
  }

  @Event()
  async removeOrgMember(payload: { user: string, organization: Organization }): Promise<any> {
    try {

      const giteaOrgUser = await GiteaUserSchema.findOne({ organization: payload.organization });
      if (!giteaOrgUser) {
        logger.info('[removeOrgMember] Not such org in gitea:', payload.organization);
        return;
      }

      const teams = await this.baseGiteaRequest(`/orgs/${giteaOrgUser.username}/teams`, 'GET');
      if (teams.length === 0) {
        return;
      }
      const ownerTeam = teams.find((t: any) => t.name.toLowerCase() === 'owners');
      if (!ownerTeam) {
        return;
      }
      const giteaUser = await GiteaUserSchema.findOne({ user: payload.user });
      if (!giteaUser) {
        logger.info('[addOrgMember] Not such user in gitea:', payload.user);
        return;
      }
      const result = await this.baseGiteaRequest(`/teams/${ownerTeam.id}/members/${giteaUser.username}`, 'DELETE', {});
      // console.log(result);
    } catch (err) {
      logger.error('[renameOrganization]', err);
    }
  }

  async getBranch(branch: string, owner: string, repoName: string) {
    try {
      const url = `/repos/${owner}/${repoName}/branches/${branch}`;
      return this.baseGiteaRequest(url, 'GET', undefined, true);
    } catch (err) {
      logger.error('[getBranch]', err);
      return;
    }
  }


  findByUserId(user: string) {
    return GiteaUserSchema.findOne({ user });
  }

  findByOrgId(organization: string) {
    return GiteaUserSchema.findOne({ organization });
  }

  async searchRepository(query: string) {
    const limit = 50; // templates count exceeds standard limit (10), set to 50 for now
    const adminId = 1; // alwasy 1 as gitea require setup and dont have param as username search
    const url = `/repos/search?q=${ query }&template=true&private=true&uid=${ adminId}&limit=${limit}`;
    return this.baseGiteaRequest(url, 'GET', true);
  }

  async createRelease(tag: string, name: string, description: string, commit: string, owner: string, repoName: string) {
    const body = {
      body: description,
      draft: false,
      name,
      prerelease: false,
      tag_name: tag,
      target_commitish: commit
    };
    const url = `/repos/${owner}/${repoName}/releases`;
    return this.baseGiteaRequest(url, 'POST', body, true);
  }

  async updateRelease(releaseId: number, owner: string, repoName: string, name: string, description: string) {
    try {
      const body = {
        body: description,
        draft: false,
        name,
        prerelease: false,
      };
      const url = `/repos/${owner}/${repoName}/releases/${releaseId}`;
      return this.baseGiteaRequest(url, 'PATCH', body, true);
    } catch (err) {
      logger.error('[updateRelease]', err);
      throw err;
    }
  }

  async createRepository(name: string, description: string, username?: string, organization?: string, repo_template?: number) {
    const body = {
      auto_init: false,
      name,
      private: true,
      // readme: 'Aitheon Readme',
      description,
      repo_template
      // 'gitignores': 'string',
      // 'issue_labels': 'string',
      // 'license': 'string',
    };

    const url = `/admin/users/${username || organization}/repos`;
    // /admin/users/{username}/repos
    return this.baseGiteaRequest(url, 'POST', body);
  }

  private async addGiteaUser(user: User, username: string, password: string) {
    const body = {
      email: user.email,
      full_name: `${user.profile.firstName} ${user.profile.lastName}`.slice(0, 100),
      login_name: username,
      must_change_password: false,
      password: password,
      send_notify: false,
      source_id: 0,
      username: username,
      allow_git_hook: false,
      allow_create_organization: true
    };

    return this.baseGiteaRequest(`/admin/users`, 'POST', body);
  }

  private async addGiteaSSH(username: string, ssh: GiteaSSH) {
    const body = {
      title: 'Aitheon',
      read_only: true,
      key: ssh.publicKey
    };

    return this.baseGiteaRequest(`/admin/users/${username}/keys`, 'POST', body);
  }

  private baseGiteaRequest(url: string, method: string, body?: any, sudo?: boolean) {
    const headers = {
      Authorization: `token ${environment.gitea.token}`,
    } as any;
    if (sudo) {
      headers.Sudo = environment.gitea.sudo;
    }
    url = `${environment.gitea.uri}/api/v1${url}`;
    return request(url, {
      headers,
      body,
      json: true,
      method
    });
  }


  async seed() {
    const Users = Db.connection.collection('users');
    const aggregation = [
      // {
      //   $match: {
      //     // tslint:disable-next-line:no-null-keyword
      //     email: /.*aitheon\.com.*/i
      //   }
      // },
      {
        $lookup: {
          from: 'creators_studio__gitea_users',
          localField: '_id',
          foreignField: 'user',
          as: 'giteaUser'
        }
      },
      {
        $unwind: {
          path: '$giteaUser',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          // tslint:disable-next-line:no-null-keyword
          giteaUser: { '$eq': null }
        }
      },
      {
        $project: {
          _id: 1,
          profile: 1,
          email: 1,
          giteaUser: 1
        }
      }
    ] as any;

    const usersQuery = await Users.aggregate(aggregation);

    let totalCount = await Users.aggregate(aggregation.concat([{ '$count': 'count' }])).next();
    totalCount = totalCount.count;
    logger.debug('totalCount: ', totalCount);

    let count = 0;
    let errors = 0;
    const processUser = async (err: any, user: User) => {
      try {
        if (err) {
          logger.error('[seed]', err);
          errors++;
          logger.debug(`[seed] errors: ${errors}; count: ${ totalCount }/${count};`);
          if (await usersQuery.hasNext()) {
            usersQuery.next();
          }
        }
        if (!user) {
          logger.debug('GiteaUsers seed done');
          return;
        }
        const result = await this.createUser({ user });
        count++;
        logger.debug(`[seed] errors: ${errors}; count: ${ totalCount }/${count};`);
        if (await usersQuery.hasNext()) {
          usersQuery.next(processUser);
        }
      } catch (err) {
        errors++;
        logger.debug(`[seed] errors: ${errors}; count: ${ totalCount }/${count};`);
        logger.error('[seed] catch:', err);
        if (await usersQuery.hasNext()) {
          usersQuery.next(processUser);
        }
      }
    };
    usersQuery.next(processUser);
  }

  async fixUsers() {
    const Users = Db.connection.collection('creators_studio__gitea_users');
    const aggregation = [
      //  {
      //   $match: {
      //     // tslint:disable-next-line:no-null-keyword
      //     username: '5925ab587bb5b800150a3e16'
      //   }
      // },
    ] as any;
    const usersQuery = await Users.aggregate(aggregation);

    let totalCount = await Users.aggregate(aggregation.concat([{ '$count': 'count' }])).next();
    totalCount = totalCount.count;
    logger.debug('totalCount: ', totalCount);

    let count = 0;
    let errors = 0;
    const processUser = async (err: any, user: any) => {
      try {
        if (err) {
          logger.error('[seed]', err);
          errors++;
          logger.debug(`[seed] errors: ${errors}; count: ${ totalCount }/${count};`);
          if (await usersQuery.hasNext()) {
            usersQuery.next();
          }
        }
        if (!user) {
          logger.debug('GiteaUsers seed done');
          return;
        }

        const url = `/admin/users/${ user.username }`;
        const userGit =  await this.baseGiteaRequest(`/users/${ user.username}`, 'GET');
        if (userGit.email) {
          await this.baseGiteaRequest(url, 'PATCH', { ...userGit, 'allow_create_organization': true });
        }

        count++;
        logger.debug(`[seed] errors: ${errors}; count: ${ totalCount }/${count};`);
        if (await usersQuery.hasNext()) {
          usersQuery.next(processUser);
        }
      } catch (err) {
        errors++;
        logger.debug(`[seed] errors: ${errors}; count: ${ totalCount }/${count};`);
        logger.error('[seed] catch:', err);
        if (await usersQuery.hasNext()) {
          usersQuery.next(processUser);
        }
      }
    };
    usersQuery.next(processUser);
  }

  async seedOrganizations() {

    const Users = Db.connection.collection('users');
    const aggregation = [
      { $unwind: { path: '$roles' } },
      {
        $lookup: {
          'from': 'organizations',
          'localField': 'roles.organization',
          'foreignField': '_id',
          'as': 'organization'
        }
      },
      { $unwind: { path: '$organization' } },
      {
        $project: {
          'organization': {
            '_id': 1,
            'domain': 1,
            'name': 1
          },
          '_id': 1,
          'email': 1
        }
      }
    ] as any;
    const orgsQuery = await Users.aggregate(aggregation);

    let totalCount = await Users.aggregate(aggregation.concat([{ '$count': 'count' }])).next();
    totalCount = totalCount.count;
    logger.debug('totalCount: ', totalCount);

    let count = 0;
    let errors = 0;
    const processUser = async (err: any, user: any) => {
      try {
        if (err) {
          logger.error('[seedOrganizations]', err);
          errors++;
          logger.debug(`[seedOrganizations] errors: ${errors}; count: ${count};`);
          if (await orgsQuery.hasNext()) {
            orgsQuery.next();
          }
        }
        if (!user) {
          logger.debug('Orgs seed done');
          return;
        }

        const existOrg = await GiteaUserSchema.findOne({ organization: user.organization._id });
        if (!existOrg) {
          await this.createOrganization({ user: user, organization: user.organization });
        } else {
          await this.addOrgMember({ user: user._id.toString(), organization: user.organization });
        }
        // const result = await this.createUser({ user });


        count++;
        logger.debug(`[seedOrganizations] errors: ${errors}; count: ${ totalCount }/${count};`);
        if (await orgsQuery.hasNext()) {
          orgsQuery.next(processUser);
        }
      } catch (err) {
        errors++;
        logger.debug(`[seedOrganizations] errors: ${errors}; count: ${ totalCount }/${count};`);
        logger.error('[seedOrganizations] catch:', err);
        if (await orgsQuery.hasNext()) {
          orgsQuery.next(processUser);
        }
      }
    };
    orgsQuery.next(processUser);
  }

}
// kubectl exec -n ai-creators-studio -it ai-creators-studio-85b4fcd897-k448h -- /bin/bash
