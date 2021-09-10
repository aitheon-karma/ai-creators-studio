import Container, { Service } from 'typedi';
import { Transporter, TransporterService, Action, Event, param, object } from '@aitheon/transporter';
import { logger, Organization, Current } from '@aitheon/core-server';
import { GroupSchemas, Project, ProjectSchema, IProject, ProjectType, ProjectSubType } from './project.model';
import { GiteaService } from '../gitea/gitea.service';
import { SocketGroup, SocketsApi } from '@aitheon/system-graph-server';
import { PurchasedAppsApi } from '@aitheon/marketplace-server';
import { environment } from '../../environment';
import * as slug from 'slug';
import { Sandbox } from '../sandboxes/sandbox.model';
import { Template } from '../templates/template.model';
import { ReleaseSchema } from '../releases/release.model';
import { ObjectID } from 'mongodb';

type Status = { status: number; message: string };

@Service()
@Transporter()
export class ProjectsService extends TransporterService {

  socketsApi: SocketsApi;
  purchasedAppsApi: PurchasedAppsApi;
  giteaService: GiteaService;
  buildServerTransportUri = `BUILD_SERVER${environment.production ? '' : ''}`;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.giteaService = Container.get(GiteaService);
    this.socketsApi = new SocketsApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/system-graph`);
    this.purchasedAppsApi = new PurchasedAppsApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/marketplace`);
  }

  async create(dto: Project, template?: Template): Promise<Project> {
    try {
      dto.slug = slug(dto.name).toLowerCase();
      let username = '';
      let organization = '';
      if (dto.organization) {
        organization = (dto.organization as Organization)._id;
      } else {
        const giteaUser = await this.giteaService.findByUserId(dto.user);
        username = giteaUser.username;
      }
      let description = dto.summary;

      if (dto.projectType === ProjectType.APP_COMPONENT) {
        dto._id = (new ObjectID()).toHexString();
        description = JSON.stringify({_id: dto._id, slug: dto.slug, name: dto.name, description: dto.summary, type: dto.projectType });
      }

      const repository = await this.giteaService.createRepository(dto.slug, description, username, organization, template ? template.repositoryId : undefined);
      dto.repositoryId = repository.id;
      const project = await new ProjectSchema(dto).save();

      return project;
    } catch (err) {
      if (err.statusCode === 409) {
        throw new Error(err.error.message);
      }
      logger.error('[ProjectsService.create]', err);
      throw err;
    }
  }

  async findBySlugs(organizationId: String, slugs: string[]): Promise<IProject[]> {
    return ProjectSchema.find({ organization: organizationId , slug: {$in: slugs}}).lean();
  }

  async search(organizationId: String, userId: string, name?: string, projectType?: string, sortByName?: boolean, sortType?: string, sortByCreatedAt?: boolean, projectSubType?: string, showArchive: Boolean = false): Promise<Project[]> {
    const filter = organizationId ? { organization: organizationId, archived: showArchive } as any : { user: userId, archived: showArchive } as any;
    const query = {} as any;
    let result: IProject[] | Project[] | PromiseLike<Project[]> = [];
    if (name) {
      filter.name = new RegExp(name, 'i');
    }
    if (projectType) {
      filter.projectType = projectType;
    }
    if (projectSubType) {
      filter.projectSubType = projectSubType;
    }
    filter.archived = showArchive;
    if (sortType) {
      query[sortType] = sortType === 'name' ? 1 : -1;
    }
    if (sortByName) {
      result = await ProjectSchema.find(filter).sort({ name: 1 }).lean();
    } else if (sortByCreatedAt) {
      result = await ProjectSchema.find(filter).sort({ createdAt: -1 }).lean();
    } else {
      result = await ProjectSchema.find(filter).sort(query).lean();
    }

    return result;
  }

  async findByOrg(organization: string, showArchive: Boolean = false, projectType: ProjectType = undefined, projectSubType: ProjectSubType = undefined, onlyWithRelease: boolean = false): Promise<Project[]> {
    const query = { organization, archived: showArchive } as any;
    if (projectType) {
      query.projectType = projectType;
    }

    if (projectSubType) {
      query.projectSubType = projectSubType;
    }

    let projects = await ProjectSchema.find(query).lean();

    if (onlyWithRelease) {
      projects = await Promise.all(projects.map(async (project: Project) => {
        const release = await ReleaseSchema.findOne({ project: project._id }).lean();
        return !!release ? project : release;
      }));
      projects = projects.filter((p: any) => p);
    }

    return projects;
  }

  async findRecent(organizationId: String, userId: String, showArchive: Boolean = false): Promise<Project[]> {
    const query = organizationId ? { organization: organizationId, archived: showArchive } : { user: userId, archived: showArchive };
    return ProjectSchema.find(query).sort({ lastOpened: -1 }).limit(3).exec();
  }

  async getPurchased(organizationId: string, projectType: string, token: string): Promise<Project[]> {
    const query = { organization: organizationId, archived: false, projectType };
    const orgProjects = await ProjectSchema.find(query).lean() as Project[];

    const purchasedProjectsRes = await this.purchasedAppsApi.getAllByProjectType(projectType, { headers: { 'Authorization': `JWT ${token}`, 'organization-id': organizationId } });
    const purchasedProjects = purchasedProjectsRes.body as any[];
    return [...orgProjects, ...purchasedProjects];
  }

  async findByUser(userId: String, showArchive: Boolean = false): Promise<Project[]> {
    // tslint:disable-next-line:no-null-keyword
    return ProjectSchema.find({ user: userId, organization: { $eq: null }, archived: showArchive });
  }

  async update(id: string, project: Project): Promise<Project> {
    return ProjectSchema.findByIdAndUpdate(id, project, { new: true });
  }

  async updateLastLoad(projectId: string): Promise<Project> {
    return ProjectSchema.updateOne({ _id: projectId }, { $set: { lastOpened: new Date() } });
  }

  async findById(projectId: string): Promise<Project> {
    return ProjectSchema.findById(projectId)
      .populate('dependencies.project');
  }

  @Action()
  async getProjectById(@param({type: 'string'}) projectId: string) {
    return this.findById(projectId);
  }

  async updateProjectSockets(projectId: string, socketGroups: string[], generatedGroups: GroupSchemas[] = []): Promise<Project> {
    return ProjectSchema.findByIdAndUpdate(projectId, {$set: {
      socketGroups: socketGroups,
      generatedSocketGroups: JSON.stringify(generatedGroups)}
    }, { new: true });
  }

  async archiveProject(project: Project): Promise<void> {
    ProjectSchema.updateOne({ _id: project._id }, { $set: { archived: true } });
  }

  async loadProject(project: Project, sandbox: Sandbox) {
    const owner = project.organization ? await this.giteaService.findByOrgId(project.organization as string) : await this.giteaService.findByUserId(project.user);
    return await this.broker.call(`SANDBOX_${sandbox._id}.SandboxService.loadProject`, { ownerUsername: owner.username, project });
  }

  async delete(projectId: string) {
    return ProjectSchema.findByIdAndDelete(projectId);
  }

  async checkProjectName(name: string, current: Current) {
    const query: {[key: string]: any} = {};
    if (current.organization && current.organization._id) {
      query.organization = current.organization._id;
    } else {
      query.user = current.user._id;
      // tslint:disable-next-line: no-null-keyword
      query.organization = { $eq: null };
    }
    query.slug = slug(name).toLowerCase();
    return ProjectSchema.countDocuments(query);
  }

  /**
   * Process socket groups
   *
   * @param current
   * @param project
   * @param sandbox
   * @param newSocketGroups
   * @param deletedSocketGroups
   * @param stayedSocketGroups
   */
  async processSocketGroupsForSandbox(current: Current, project: Project, sandbox: Sandbox, newSocketGroups: string[], deletedSocketGroups: SocketGroup[], stayedSocketGroups: GroupSchemas[]) {
    logger.info(
      '[ProjectsService.processSocketGroupsForSandbox]',
      `Process sockets for project ${project._id} in sandbox ${sandbox._id}\n`,
      `To delete: [${deletedSocketGroups.map(del => del._id).join(', ')}]\n`,
      `To create: [${newSocketGroups.join(', ')}]`
    );
    if (deletedSocketGroups.length > 0) {
      const result = await this.deleteSocketGroupsinSandbox(project, sandbox, deletedSocketGroups);
      if (result.status !== 0) {
        throw new Error(result.message);
      }
    }

    for (const newGroup of newSocketGroups) {
      const result = await this.generateSocketGroupInSandbox(current, project, sandbox, newGroup);
      if (result.result.status !== 0) {
        throw new Error(result.result.message);
      }

      stayedSocketGroups.push(result.groupSchemas);
    }

    logger.info(
      '[ProjectsService.processSocketGroupsForSandbox]',
      `Process sockets for project ${project._id} in sandbox ${sandbox._id} finished with success`,
    );

    return stayedSocketGroups;
  }

  /**
   * Generate socket groups in sandbox
   *
   * @param current
   * @param project
   * @param sandbox
   * @param groupId
   */
  async generateSocketGroupInSandbox(current: Current, project: Project, sandbox: Sandbox, groupId: string)
    : Promise<{result: Status, groupSchemas: GroupSchemas}> {

    const socketSchemasRes = await this.socketsApi.listSocketSchemasByGroup(groupId,
      { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } }
    );
    const groupSchemas = socketSchemasRes.body as GroupSchemas;

    return this.rawGenerateSocketGroupInSandbox(project, sandbox, groupSchemas);
  }

  /**
   * Raw generate socket group in sandbox
   *
   * @param current
   * @param project
   * @param sandbox
   * @param groupSchemas
   */
  async rawGenerateSocketGroupInSandbox(project: Project, sandbox: Sandbox, groupSchemas: GroupSchemas)
    : Promise<{result: Status, groupSchemas: GroupSchemas}> {

    logger.info(
      '[ProjectsService.generateSocketGroupInSandbox]',
      `Generating sockets group ${groupSchemas.group._id.toString()} for project ${project._id} in sandbox ${sandbox._id}`
    );

    const result = await this.broker.call<Status, any>(
      `SANDBOX_${sandbox._id}.SocketsService.generateSockets`,
      { groupSchemas, project }
    );

    return { result, groupSchemas };
  }

  /**
   * Delete socket groups in sandbox
   *
   * @param project
   * @param sandbox
   * @param deletedSocketGroups
   */
  async deleteSocketGroupsinSandbox(project: Project, sandbox: Sandbox, deletedSocketGroups: SocketGroup[])
    : Promise<Status> {

    logger.info(
      '[ProjectsService.deleteSocketGroupsForSandbox] started'
    );

    return await this.broker.call<Status, any>(
      `SANDBOX_${sandbox._id}.SocketsService.deleteSockets`,
      { project,  deletedGroups: deletedSocketGroups }
    );
  }

}
