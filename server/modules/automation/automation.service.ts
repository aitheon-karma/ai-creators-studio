import { Current, Organization } from '@aitheon/core-server';
import { Project, ProjectType, Runtime, ProjectLanguage, IProject, ProjectSubType } from '../projects/project.model';
import * as _ from 'lodash';
import Container, { Service, Inject } from 'typedi';
import { TransporterService, Action, param, Transporter , Event } from '@aitheon/transporter';
import { RedisService } from '../core/redis.service';
import { environment } from '../../environment';
import { AutomationStatus, AutomationProject, AutomationProjectType } from './automation.model';
import { Types } from 'mongoose';
import { TemplatesService } from '../templates/templates.service';
import { ProjectsService } from '../projects/projects.service';
import { logger } from '@aitheon/core-server';
import { SandboxesService } from '../sandboxes/sandboxes.service';
import { Sandbox, SandboxStatus } from '../sandboxes/sandbox.model';
import { ReleasesService } from '../releases/releases.service';
import Db from '@aitheon/core-server/dist/config/db';
import { ObjectID } from 'mongodb';
import { Release, Visibility } from '../releases/release.model';


const AUTOMATION_REDIS_PATH = `${environment.service._id}${environment.production ? '' : ''}.AUTOMATION`;
const AUTOMATION_REDIS_EXPIRE_SECONDS = 21600;  // 6 hours
const SANDBOX_POOLING_TIME = 3000;
const BUILD_SERVER_POOLING_TIME = 5000;

const getReadableTimeStamp = () => {
  const date = new Date();
  const prettyDate = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + ' ' +
    date.getHours() + ':' + date.getMinutes();
  return prettyDate;
};

@Service()
@Transporter()
export class AutomationService extends TransporterService {


  private redisService: RedisService;
  private templatesService: TemplatesService;
  private projectsService: ProjectsService;
  private sandboxesService: SandboxesService;
  private releasesService: ReleasesService;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.redisService = Container.get(RedisService);
    this.projectsService = Container.get(ProjectsService);
    this.sandboxesService = Container.get(SandboxesService);
    this.templatesService = Container.get(TemplatesService);
    this.releasesService = Container.get(ReleasesService);
  }


  start(automationProject: AutomationProject, current: Current, project?: Project) {
    // generate new id for now.
    const automationId = (Types.ObjectId()).toHexString();
    const organization = current.organization ? current.organization._id : undefined;
    (async () => {
      try {
        if (!project) {
          this.setStatus(automationId, { currentTask: 'Creating Project', inProgress: true });
        }
        project = project ? project : await this.createProject(automationProject, current);
        let sandbox = await this.sandboxesService.findInUseByUser(current.user._id, organization);
        if (!sandbox) {
          // await this.sandboxesService.terminate(sandbox);
          // this.setStatus(automationId, { currentTask: 'Terminating existing sandbox' });
          this.setStatus(automationId, { currentTask: 'Creating sandbox' });
          sandbox = await this.createSandBox((automationProject || { sandBoxType: undefined }).sandBoxType, current, automationId);
        }
        this.setStatus(automationId, { currentTask: 'Loading project' });
        await this.projectsService.loadProject(project, sandbox);
        const url = `https://${current.organization ? current.organization.domain : ''}.${process.env.DOMAIN}${environment.service.url}/sandboxes/${sandbox._id}?automationId=${automationId}`;
        this.setStatus(automationId, { inProgress: false, completed: true, currentTask: '', redirectUrl: url });
      } catch (err) {
        this.setStatus(automationId, { inProgress: false, currentTask: '', error: true, errorMessage: err.message, _id: automationId });
        // TODO: Rollback if something went wrong;
        logger.error(`[AutomationService.start]: AutomationId: ${automationId}`, err);
      }
    })();
    return automationId;
  }


  async createSandBox(sandBoxTypeId: string, current: Current, automationId: string) {
    const sandBoxes: any[] = (await this.sandboxesService.listSandboxTypes() || [])
      .filter((s: any) => !s.disabled);
    let sandBox: Sandbox;
    if (!sandBoxes || !sandBoxes.length) {
      throw new Error('No sandbox present');
    }
    if (sandBoxTypeId) {
      sandBox = sandBoxes.find(s => s._id === sandBoxTypeId);
    }
    // pick basic sandbox
    if (!sandBox) {
      sandBox = sandBoxes.find(s => s.displayText == 'Basic');
    }
    // pick the fist one
    if (!sandBox) {
      sandBox = sandBoxes[0];
    }
    sandBox = await this.sandboxesService.create(sandBox._id,
      current.user,
      current.token,
      current.organization ? current.organization._id : undefined);
    this.setStatus(automationId, { currentTask: 'Booting up sandbox', sandBoxId: sandBox._id});
    sandBox = await this.getRunningSandbox(sandBox, automationId);
    return sandBox;
  }


  // TEMP:POOLING FOR SANDBOX STATUS:
  // TODO: Change logic to SandboxesService.updateStatus
  getRunningSandbox(sandBox: Sandbox, automationId: string): Promise<Sandbox> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const automationStatus = await this.getStatus(automationId);
        if (automationStatus.error) {
          clearInterval(interval);
          reject({ message: 'Sandbox Error' });
        }
        sandBox = await this.sandboxesService.findById(sandBox._id);
        if ([SandboxStatus.ERROR,
        SandboxStatus.SHUTTING_DOWN,
        SandboxStatus.SHUTTING_DOWN_ERROR,
        SandboxStatus.SHUTTING_DOWN_READY,
        SandboxStatus.SHUTTING_DOWN_ERROR,
        SandboxStatus.SHUTTING_DOWN].includes(sandBox.status)) {
          clearInterval(interval);
          reject({ message: 'Sandbox Error' });
        } else if (sandBox.status === SandboxStatus.RUNNING) {
          clearInterval(interval);
          resolve(sandBox);
        }

      }, SANDBOX_POOLING_TIME);
    });
  }



  async createProject(automationProject: AutomationProject, current: Current) {
    const project = automationProject.project || {} as Project;
    project.name = automationProject.name;
    project.user = current.user._id;
    if (current.organization) {
      project.organization = current.organization;
    }
    if (automationProject.type === AutomationProjectType.CODELESS) {
      // for codeless use the default settings;
      project.runtime = Runtime.AOS_CLOUD;
      project.language = ProjectLanguage.TYPESCRIPT;
      project.projectType = ProjectType.APP;
      project.projectSubType = automationProject.subType || ProjectSubType.AUTOMATION;
    } else {
      // use the settings from the template object
      if (!project.runtime || !project.projectType || !project.projectType) {
        throw new Error('Missing fields for project creation');
      }
    }
    project.meta = { initiatorService: (automationProject.service || (automationProject.meta && automationProject.meta.service)) };
    if (automationProject.meta) {
      project.meta = { ...project.meta, ...automationProject.meta };
    }
    const template = await this.templatesService.find(project.runtime, project.projectType, project.language);
    const createdProject = await this.projectsService.create(project, template);
    return createdProject;
  }



  async getStatus(key: string): Promise<any> {
    const status = await this.redisService.client.get(`${AUTOMATION_REDIS_PATH}.${key}`);
    if (!status) {
      return { error: true, errorMessage: 'Not found', _id: undefined};
    }
    return JSON.parse(status);
  }


  async setStatus(reference: string, status: any) {
    const key = `${AUTOMATION_REDIS_PATH}.${reference}`;
    let redisStatus = await this.redisService.client.get(key);
    redisStatus = { ...(JSON.parse(redisStatus) || {}), ...status, reference };
    this.redisService.client.set(key, JSON.stringify(redisStatus));
    this.redisService.client.expire(key, AUTOMATION_REDIS_EXPIRE_SECONDS);
    return redisStatus;
  }



  @Event()
  async createdGraphNode(payload: {graphNodeId: string, releaseId: string} ) {

    const {automationId, error} = await this.getStatus(payload.releaseId);
    if (!error) {
      const newStatus = {automationId, graphNodeId: payload.graphNodeId, releaseId: payload.releaseId};
      this.setStatus(newStatus.graphNodeId, newStatus);
    }
  }


  @Event()
  async graphNodeStatus(payload: {graphNodeId: string, status: string}) {
    const nodeStatus = await this.getStatus(payload.graphNodeId);
    if (nodeStatus.error && nodeStatus.errorMessage !== 'Not found') {
      return this.clearKey(payload.graphNodeId);
    } else if (nodeStatus.error ) {
      return;
    }
    const {automationId} = nodeStatus;
    if (payload.status === 'ERROR') {
      this.setStatus(automationId, {error: true, errorMessage: 'Error starting node', inProgress: false});
    } else if (payload.status === 'RUNNING') {
      this.setStatus(automationId, {error: false, currentTask: '', inProgress: false, completed: true });
    }
  }


  async quickRelease(sandboxId: string, current: Current, projectId: string, automationId: string) {
    automationId = automationId ? automationId : (Types.ObjectId()).toHexString();
    (async () => {
      try {
        const steps = ['Getting active Projects', 'Committing master branch', 'Creating build', 'Build in progress', 'Creating release' ];
        this.setStatus(automationId, { currentTask: 'Getting active Projects', inProgress: true, error: false, _id: automationId, redirectUrl: undefined, completed: false, steps, estimatedTime: '5 minutes'});
        const project = await this.getQuickReleaseProject(sandboxId, current, projectId);
        const template = await this.templatesService.find(project.runtime, project.projectType, project.language);
        this.setStatus(automationId, { currentTask: 'Committing master branch' });
        await this.commitRepo(sandboxId, project.slug);
        // await this.sandboxesService.terminate({_id: sandboxId} as any);
        this.setStatus(automationId, { currentTask: 'Creating build' });
        let build = await this.releasesService.createBuild(project, template, current.user._id, current.organization._id);
        this.setStatus(automationId, { currentTask: 'Build in progress', error: false});
        build = await this.waitForBuild(build._id, automationId);
        this.setStatus(automationId, {currentTask: 'Creating release'});
        const release =  await this.createRelease(build._id.toString(), project, automationId, current, steps);
        this.setStatus(release._id.toString(), {automationId: automationId});
        if (!project.meta) {
          this.setStatus(automationId, {currentTask: '', output: undefined, inProgress: false, completed: true, error: false});
        }
      } catch (err) {
        this.setStatus(automationId, { inProgress: false, currentTask: '', error: true, errorMessage: err.message, _id: automationId });
        logger.error(`[AutomationService.quickRelease]: AutomationId: ${automationId}`, err);
      }
    })();
    return automationId;
  }


  private async getQuickReleaseProject(sandboxId: string, current: Current, projectId: string) {
    console.log(sandboxId, projectId);
    const projects = await this.getActiveProjects(sandboxId, current);
    let project: Project;
    if (projects && projects.length) {
      if (projectId) {
        project = projects.find(p => p._id == projectId);
      }
      if (!project) {
        project = projects[0];
      }
    } else {
      throw new Error('Project not found');
    }
    return project;
  }



  async createRelease(buildId: string, project: Project, automationId: string, current: Current, steps: string[]) {
    let tag: number = 1.0;
    const lastRelease = await this.releasesService.latestReleaseByProjectId(project._id);
    if (lastRelease) {
      tag = Number(lastRelease.tag);
      this.setStatus(automationId, {currentTask: '', output: undefined, error: false, completed: true, inProgress: false});
    } else if (project.meta) {
        this.setStatus(automationId, {currentTask: 'Starting node', output: undefined, steps: [...steps, 'Starting node'] });
    }
    if (isNaN(tag)) {
      tag = 1.0;
    } else {
      tag = tag + .1;
    }
    const releasePayload: any = {
      name: `${project.name} Release ${getReadableTimeStamp()}`,
      tag: tag.toFixed(1),
      visibility: Visibility.PRODUCTION,
      description: `Release for ${project.name}`,
      build: buildId,
      organization: current.organization._id
    };
    const release = await this.releasesService.create(releasePayload, current, true);
    return release;
  }


  waitForBuild(buildId: string, automationId: string): Promise<Sandbox> {
    return new Promise((resolve, reject) => {
      let build: any;
      const interval = setInterval(async () => {
        const automationStatus = await this.getStatus(automationId);
        if (automationStatus.error) {
          clearInterval(interval);
          reject({ message: 'Sandbox Error' });
        }
        build = await  Db.connection.collection('build_server__builds').findOne({_id: new ObjectID(buildId)});
        this.setStatus(automationId, { currentTask: 'Build in progress'});
        if (build.status.toString() == 'ERROR') {
          clearInterval(interval);
          reject({ message: 'Build Error'});
        } else if (build.status.toString() == 'CANCELED') {
          clearInterval(interval);
          reject({ message: 'Build Canceled'});
        } else if (build.status .toString() == 'SUCCESS') {
          clearInterval(interval);
          resolve(build);
        }

      }, BUILD_SERVER_POOLING_TIME);
    });
  }



  async commitRepo(sandBoxId: string, projectSlug: string, branch = 'master') {
    const commitMessage = `commit ${getReadableTimeStamp()}`;
    const result = await this.broker.call<any, any>(`SANDBOX_${sandBoxId}.SandboxService.commit`, { commitMessage: commitMessage, branch, projectSlug});
    if (result.error) {
      throw new Error('Commit failed');
    }
    return result;
  }


  async getActiveProjects(sandboxId: string, current: Current): Promise<Project[]> {
    const activeProjects = await this.broker.call<any, any>(`SANDBOX_${sandboxId}.SandboxService.activeProjects`, {});
    if (!activeProjects.success) {
      throw new Error('Projects fetch errors');
    }
    if (!activeProjects.payload || !activeProjects.payload.length) {
      throw new Error('No active Projects');
    }
    const projectSlugs: string[] = activeProjects.payload;
    const projects = await this.projectsService.findBySlugs(current.organization._id, projectSlugs);
    if (!projects || !projects.length) {
      throw new Error('Project not found');
    }
   return projects;
  }


  async clearKey(key: string) {
    key = `${AUTOMATION_REDIS_PATH}.${key}`;
    await this.redisService.client.del(key);
  }

}
