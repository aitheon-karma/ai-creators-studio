import { Service, Inject } from 'typedi';
import { WorkspaceSchema, Workspace } from './workspace.model';

@Service()
export class WorkspacesService {


  async findAll(organizationId: String): Promise<Workspace[]> {
    return WorkspaceSchema.find({ organization: organizationId });
  }

  async findByOrg(organizationId: String): Promise<Workspace[]> {
    return WorkspaceSchema.find({ organization: organizationId }).sort({ name: 1 }).exec();
  }

  async findByUser(userId: String): Promise<Workspace[]> {
    // tslint:disable-next-line:no-null-keyword
    return WorkspaceSchema.find({ user: userId, organization: { $eq: null } }).sort({ name: 1 }).exec();
  }

  async create(workspace: Workspace): Promise<Workspace> {
    const workspaceSchema = new WorkspaceSchema(workspace);
    return workspaceSchema.save();
  }

  async update(workspace: Workspace): Promise<Workspace> {
    return WorkspaceSchema.findByIdAndUpdate(workspace._id, workspace);
  }

  async updateLastLoad(workspaceId: string): Promise<Workspace> {
    return WorkspaceSchema.updateOne({ _id: workspaceId}, { $set: { lastOpened : new Date() } });
  }

  async findById(workspaceId: string): Promise<Workspace> {
    return WorkspaceSchema.findById(workspaceId).populate('projects');
  }

  async findByName(name: string, user: string, organization: string) {
    const query = { name: { $regex : new RegExp(name, 'i') }, user: user, organization: organization };
    if (organization) {
      query.organization = organization;
    }
    return WorkspaceSchema.findOne(query).populate('projects');
  }

  async findRecent(organizationId: String, userId: String): Promise<Workspace[]> {
    const query = organizationId ? { organization: organizationId } : { user: userId };
    return WorkspaceSchema.find(query).sort({ lastOpened: -1 }).limit(5);
  }

  async remove(workspaceId: string): Promise<Workspace> {
    return WorkspaceSchema.findByIdAndRemove(workspaceId);
  }

  async cleanupProject(projectId: string): Promise<void> {
    return WorkspaceSchema.update({ projects: { $in: [projectId] }}, { $pull: { projects: projectId }});
  }

  async cleanupProjectFromAllWorkspaces(projectId: string): Promise<void> {
    return WorkspaceSchema.update({ projects: { $in: [projectId] }}, { $pull: { projects: projectId }}, { multi: true });
  }

  constructor() {
  }

}
