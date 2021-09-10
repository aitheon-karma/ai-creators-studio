import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './workspace.model';
import { Request, Response } from 'express';
import { Current } from '@aitheon/core-server';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/project.model';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@Authorized()
@JsonController('/api/workspaces')
export class WorkspacesController {

  @Inject()
  workspacesService: WorkspacesService;

  @Inject()
  projectsService: ProjectsService;

  @Get('/')
  @OpenAPI({ summary: 'List of workspaces', operationId: 'list' })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    const organizationId = current.organization ? current.organization._id : undefined;

    const workspaces = organizationId ? await this.workspacesService.findByOrg(organizationId) :
    await this.workspacesService.findByUser(current.user._id);
    return response.json(workspaces);
  }

  @Get('/recent')
  @OpenAPI({ summary: 'List of recent', operationId: 'recent' })
  async listRecent(@CurrentUser() current: Current, @Res() response: Response) {

    const organizationId = current.organization ? current.organization._id : undefined;
    const workspaces = await this.workspacesService.findRecent(organizationId, current.user._id);
    return response.json(workspaces);
  }

  @Post('/')
  @OpenAPI({ summary: 'Create workspaces', operationId: 'create' })
  async create(@CurrentUser() current: Current, @Body() body: any, @Res() response: Response) {
    const { workspace, project } = body;
    const organizationId = current.organization ? current.organization._id : undefined;
    let resultProject = {} as Project;
    if (project) {
      const projectType = project.projectType || 'APP';
      const newProject = Object.assign({}, project, { projectType: projectType, user: current.user._id, organization: organizationId });
      resultProject = await this.projectsService.create(newProject);
      workspace.projects = [resultProject._id];
    }
    workspace.createdBy = current.user;
    workspace.user = current.user._id;
    workspace.organization = current.organization._id;
    const resultWorkspace = await this.workspacesService.create(workspace);
    const result = { workspace: resultWorkspace, project: resultProject };
    return response.json(result);
  }


  @Put('/:id')
  @OpenAPI({ summary: 'Update workspace', operationId: 'update' })
  async update(@CurrentUser() current: Current, @Param('id') id: string, @Body() body: any, @Res() response: Response) {
    const { workspace, project } = body;
    const workResult = await this.workspacesService.update(workspace);
    return response.sendStatus(204);
  }

  @Post('/:id/projects/:projectId')
  @OpenAPI({ summary: 'Add project to workspace', operationId: 'addProject' })
  async addProject(@Param('id') id: string, @Param('projectId') projectId: string, @CurrentUser() current: Current, @Res() response: Response) {
    const organizationId = current.organization ? current.organization._id : undefined;
    const workspace = await this.workspacesService.findById(id);
    if (!workspace) {
      return response.sendStatus(404);
    }
    // todo: move to mongo commands
    workspace.projects.push(projectId);
    await this.workspacesService.update(workspace);
    return response.sendStatus(204);
  }

  @Delete('/:id/projects/:projectId')
  @OpenAPI({ summary: 'Delete project from workspace', operationId: 'removeProject' })
  async removeProject(@Param('id') id: string, @Param('projectId') projectId: string, @CurrentUser() current: Current, @Res() response: Response) {
    const workspace = await this.workspacesService.findById(id);
    if (!workspace) {
      return response.sendStatus(404);
    }

    // todo: move to mongo commands
    const projectIndex = workspace.projects.findIndex((p: string) => p === projectId);
    workspace.projects.splice(projectIndex, 1);
    await this.workspacesService.update(workspace);

    return response.sendStatus(204);
  }

  @Delete('/:id')
  @OpenAPI({ summary: 'Remove workspace', operationId: 'remove' })
  async remove(@Param('id') id: string, @Res() response: Response) {
    const result = await this.workspacesService.remove(id);
    return response.sendStatus(204);
  }

}
