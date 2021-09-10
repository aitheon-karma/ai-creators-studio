import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action, Event, param, boolean } from '@aitheon/transporter';
import { logger, User, Organization, Current } from '@aitheon/core-server';
import { Release, ReleaseSchema, NodeTemplateStatus } from './release.model';
import { GiteaService } from '../gitea/gitea.service';
import { environment } from '../../environment';
import * as slug from 'slug';
import { Template } from '../templates/template.model';
import { ProjectsService } from '../projects/projects.service';
import { Project, ProjectType } from '../projects/project.model';
import { ItemApi, Item } from '@aitheon/item-manager-server';
import { PricingType } from '../marketplace-settings/marketplace-settings.model';

@Service()
@Transporter()
export class ReleasesService extends TransporterService {

  buildServerTransportUri = `BUILD_SERVER${environment.production ? '' : ''}`;
  systemGraphTransportUri = `SYSTEM_GRAPH${environment.production ? '' : ''}`;
  giteaService: GiteaService;
  projectsService: ProjectsService;
  itemApi: ItemApi;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.giteaService = Container.get(GiteaService);
    this.projectsService = Container.get(ProjectsService);
    this.itemApi = new ItemApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/item-manager`);
  }

  async create(dto: Release, current: Current, skipWaitEmits?: boolean): Promise<Release> {
    try {
      const exist = await this.findByBuildId(dto.build);
      if (exist) {
        throw new Error('You already have release with this build');
      }

      const build = await this.findBuildById(dto.build, false);
      if (!build) {
        throw new Error('No build');
      }
      if (build.status != 'SUCCESS') {
        throw new Error('Build must have success status to create release');
      }
      const giteaUser = dto.organization ? await this.giteaService.findByOrgId(dto.organization) : await this.giteaService.findByUserId(dto.user) ;
      if (!giteaUser) {
        throw new Error('No git user');
      }
      dto.project = build.project;
      dto.tag = slug(dto.tag, { remove: undefined }).slice(0, 512);
      dto.nodeTemplateStatus = build.npmLibName ? NodeTemplateStatus.NOT_APPLICABLE : NodeTemplateStatus.PENDING;
      dto.npmLibName = build.npmLibName;
      dto.inputs = build.transporter ? build.transporter.inputsNode : [];
      dto.outputs = build.transporter ? build.transporter.outputsNode : [];
      dto.ticks = build.transporter ? build.transporter.ticks : [];
      dto.settingParams = build.transporter ? build.transporter.settingParams : [];
      dto.nodeChannels = build.transporter ? build.transporter.nodeChannels : [];
      dto.deviceReceiver = build.transporter ? build.transporter.deviceReceiver : false;
      dto.deviceSender = build.transporter ? build.transporter.deviceSender : false;

      dto.headCommit = build.headCommit;

      const project = await this.projectsService.findById(dto.project);

      const release =  new ReleaseSchema(dto);

      const emitChanges = async () => {
        !release.npmLibName ? await this.broker.call(`${ this.buildServerTransportUri }.BuildsService.tagUserProject`, {buildId: release.build.toString(), tag: `release-${ release._id.toString() }`, headCommit: build.headCommit}) : undefined;
        const giteaRelease = await this.giteaService.createRelease(dto.tag, dto.name, dto.description, build.headCommit, giteaUser.username, project.slug);
        release.giteaReleaseId = giteaRelease.id;
        await release.save();
        !release.npmLibName ? this.broker.emit('NodesService.createProjectNode', { project, release }, this.systemGraphTransportUri) : undefined;
        const itemResp = await this.itemApi.getByCreatorProject(dto.project, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
        if (!itemResp.body) {
          await this.saveItem(release, current);
        }
      };
      if (skipWaitEmits) {
         emitChanges();
      } else {
        await emitChanges();
      }
      return release;
    } catch (err) {
      if (err.statusCode === 409) {
        throw new Error(err.error.message);
      }
      logger.error('[ReleaseService.create]', err);
      throw err;
    }
  }

  async findByBuildId(build: string): Promise<any> {
    return ReleaseSchema.findOne({ build });
  }

  async findById(id: string): Promise<Release> {
    return ReleaseSchema.findById(id);
  }

  async latestReleaseByProjectId(projectId: string) {
    const release = await ReleaseSchema.findOne({project: projectId}).sort({'createdAt': -1});
    return release;
  }

  @Action()
  async getLatestReleaseByProjectId(@param({type: 'string'}) projectId: string) {
    return this.latestReleaseByProjectId(projectId);
  }

  @Action()
  async findByIds(@param({ type: 'any' }) ids: string[]): Promise<Release[]> {
    return ReleaseSchema.find({ _id: { $in: ids }});
  }

  async findBuilds(projectId: string): Promise<any> {
    const params = { projectId, skip: 0, limit: 20 };
    return this.broker.call(`${ this.buildServerTransportUri }.BuildsService.findByProject`, params);
  }

  async findBuildById(buildId: string, includeOutput: boolean): Promise<any> {
    const params = { buildId, includeOutput };
    return this.broker.call(`${ this.buildServerTransportUri }.BuildsService.findByIdAction`, params);
  }

  async createBuild(project: Project, template: Template, user: string, organization?: string): Promise<any> {
    const giteaUser = await this.giteaService.findByUserId(user);
    let giteaOrgUser;
    if (project.organization) {
      giteaOrgUser = await this.giteaService.findByOrgId(project.organization.toString());
    }

    const owner = giteaOrgUser ? giteaOrgUser.username : giteaUser.username;
    const branch = await this.giteaService.getBranch('master', owner, project.slug);
    if (!branch) {
      throw new Error('Cant get commit in master branch');
    }

    const gitUrl = `ssh://git@gitea.gitea.svc.cluster.local/${ owner }/${ project.slug }.git`;
    const build = {
      name: project._id,
      project,
      user,
      organization,
      type: project.projectType === ProjectType.APP_COMPONENT ? 'USER_LIB' : 'USER_SERVICE',
      gitUrl,
      headCommit: branch.commit.id,
      dockerfile: template.dockerfile
    };

    return this.broker.call(`${ this.buildServerTransportUri }.BuildsService.createUserBuild`, { build, ssh: giteaUser.ssh });
  }


  async findByUser(user: String): Promise<Release[]> {
    return ReleaseSchema.find({ user: user }).sort('-createdAt');
  }

  async findByOrg(organization: String): Promise<Release[]> {
    return ReleaseSchema.find({ user: organization }).sort('-createdAt');
  }

  @Action()
  async findByProject(@param({ type: 'string' }) projectId: string): Promise<Release[]> {
    return this._findByProject(projectId);
  }

  // todo: remove after transporter fixes
  async _findByProject(@param({ type: 'string' }) projectId: string): Promise<Release[]> {
    return ReleaseSchema.find({ project: projectId }).sort('-createdAt');
  }

  async update(release: Release): Promise<Release> {
    const giteaUser = release.organization ? await this.giteaService.findByOrgId(release.organization) : await this.giteaService.findByUserId(release.user) ;
    if (!giteaUser) {
      throw new Error('No git user');
    }

    const project = await this.projectsService.findById(release.project);
    await this.giteaService.updateRelease(release.giteaReleaseId,  giteaUser.username, project.slug, release.name, release.description);

    this.broker.emit('NodesService.updateProjectNode', release, this.systemGraphTransportUri);

    return ReleaseSchema.findByIdAndUpdate(release._id, release, { new: true });
  }

  @Event()
  async updateNodeStatus(payload: { releaseId: string, status: NodeTemplateStatus }): Promise<void> {
    return ReleaseSchema.updateOne({ _id: payload.releaseId }, { $set: { nodeTemplateStatus: payload.status }});
  }

  async saveItem(release: Release, current: Current): Promise<Item> {
    const dto = {
      name: release.name,
      appStoreName: release.name,
      type: 'NODE',
      salePrice: 0,
      sellable: false,
      description: release.description,
      pricingType: PricingType.ONE_TIME as any,
      creatorsStudioProjectId: release.project,
      images: [] as any[]
    } as Item;
    return await this.createItem(dto, current);
  }

  async createItem(item: Item, current: Current): Promise<Item> {
    const result = await this.itemApi.create(item, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    return result.body;
  }
  // async findById(projectId: string): Promise<Project> {
  //   return ProjectSchema.findById(projectId).populate('dependencies.project');
  // }

  // async archiveProject(project: Project): Promise<void> {
  //   ProjectSchema.updateOne({ _id: project._id }, { $set: { archived: true } });
  // }

  // async loadProject(project: Project, sandbox: Sandbox) {
  //   const repositoryName = project.slug;
  //   const giteaUser = await this.giteaService.findByUserId(project.organization ? (project.organization as string) : project.user);
  //   await this.broker.call(`SANDBOX_${ sandbox._id }.GitService.clone`, { username: giteaUser.username, repositoryName });
  // }
}
