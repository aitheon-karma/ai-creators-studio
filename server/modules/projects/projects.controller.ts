import { Get, Post, Put, Delete, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { ProjectsService } from './projects.service';
import { GroupSchemas, Project, ProjectSubType, ProjectType } from './project.model';
import { hasAccess } from '../core/auth-helper';
import { SandboxesService } from '../sandboxes/sandboxes.service';
import { TemplatesService } from '../templates/templates.service';
import { isSchemaObject, normalizeSchema } from './project.helpers';
import { Sandbox } from '../sandboxes/sandbox.model';
import { Types } from 'mongoose';
import { SocketValidator } from '@aitheon/system-graph-server';

type StatusMsg = { statusCode: number, message: string };

@Authorized()
@JsonController('/api/projects')
export class ProjectsController {

  @Inject()
  projectsService: ProjectsService;

  @Inject()
  sandboxesService: SandboxesService;

  @Inject()
  templatesService: TemplatesService;

  constructor(
  ) {
  }

  @Post('/')
  @OpenAPI({ summary: 'Create project', operationId: 'create' })
  async create(@CurrentUser() current: Current, @Body() projectDto: Project, @Res() response: Response, @Req() request: Request) {
    try {
      projectDto.user = current.user._id;
      projectDto.organization = current.organization;

      const template = await this.templatesService.find(projectDto.runtime, projectDto.projectType, projectDto.language);
      const project = await this.projectsService.create(projectDto, template);
      return response.json(project);
    } catch (err) {
      return response.status(422).send({ message: err.message });
    }
  }

  @Put('/:id')
  @OpenAPI({ summary: 'Update project', operationId: 'update' })
  async update(@Param('id') id: string, @CurrentUser() current: Current, @Body() projectBody: Project, @Res() response: Response) {

    const project = await this.projectsService.findById(id);
    if (!project) {
      return response.sendStatus(404);
    }
    if (!hasAccess(current.user, current.organization, project)) {
      return response.status(422).send({ message: 'No access to this project' });
    }
    const result = await this.projectsService.update(id, projectBody);
    return response.sendStatus(204);
  }

  private async getProjectAndSandbox(current: Current, projectId: string, sandboxId: string)
  : Promise<{ status: StatusMsg, project?: Project, sandbox?: Sandbox }> {
    const project = await this.projectsService.findById(projectId);

    if (!project) {
      return { status: { statusCode: 404, message: 'Project not found' } };
    }

    const sandbox = await this.sandboxesService.findById(sandboxId);
    if (!sandbox) {
      return { status: { statusCode: 404, message: 'Sandbox not found' } };
    }

    if (!hasAccess(current.user, current.organization, project)) {
      return { status: { statusCode: 403, message: 'No access to this project' } };
    }
    if (!hasAccess(current.user, current.organization, sandbox)) {
      return { status: { statusCode: 403, message: 'No access to this sandbox' } };
    }
    return { status: { statusCode: 200, message: '' }, project, sandbox};
  }

  private async checkProjectValidator(project: Project, validator: SocketValidator): Promise<StatusMsg> {
    if ((!project.generatedSocketGroups || project.generatedSocketGroups === '')) {
      return { statusCode: 422, message: 'No groups were added to this project' };
    }
    if (!isSchemaObject(validator)) {
      return { statusCode: 400, message: 'Invalid validator Json Schema object' };
    }
    return { statusCode: 200, message: '' };
  }

  @Post('/:projectId/sandboxes/:sandboxId/socket-groups/:groupId/:socketId/project-validators')
  @OpenAPI({ summary: 'Add project socket validator to a project and sandbox', operationId: 'addProjectValidator' })
  async addProjectValidator(
    @Param('projectId') projectId: string,
    @Param('sandboxId') sandboxId: string,
    @Param('groupId') groupId: string,
    @Param('socketId') socketId: string,
    @CurrentUser() current: Current,
    @Body() validator: any,
    @Res() response: Response
  ) {
    try {
      const { status, project, sandbox } = await this.getProjectAndSandbox(current, projectId, sandboxId);
      if (status.statusCode !== 200) {
        return response.status(status.statusCode).send({ message: status.message });
      }

      const res = await this.checkProjectValidator(project, validator);
      if (res.statusCode !== 200) {
        return response.status(res.statusCode).send({ message: res.message });
      }

      const generatedSocketGroups = JSON.parse(project.generatedSocketGroups) as GroupSchemas[];
      const groupSchemas: GroupSchemas = generatedSocketGroups.find(genGroup => genGroup.group._id.toString() === groupId);
      const socketSchemasIdx = groupSchemas ? groupSchemas.schemas.findIndex(socketSchemas => socketSchemas.schema.$id === socketId) : -1;
      if (socketSchemasIdx === -1) {
        return response.status(422).send({ message: 'The group or socket is not available for this project' });
      }
      const dupIdx = groupSchemas.schemas[socketSchemasIdx].validators.findIndex(val => val.title === validator.name);
      if (dupIdx !== -1) {
        return response.status(422).send({ message: 'Duplicate socket validator name' });
      }

      validator._id = Types.ObjectId().toHexString();
      const normSchema = normalizeSchema(socketId, validator as SocketValidator);
      groupSchemas.schemas[socketSchemasIdx].validators.push(normSchema);

      const generatedSchemasRes = await this.projectsService.rawGenerateSocketGroupInSandbox(
        project, sandbox, groupSchemas
      );
      if (generatedSchemasRes.result.status !== 0) {
        throw new Error(generatedSchemasRes.result.message);
      }

      const newProject = await this.projectsService.updateProjectSockets(projectId, project.socketGroups, generatedSocketGroups);
      return response.json(newProject);
    } catch (err) {
      logger.error('[Add project socket validator to a project and sandbox]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:projectId/sandboxes/:sandboxId/socket-groups/:groupId/:socketId/project-validators/:validatorId')
  @OpenAPI({ summary: 'Update project socket validator in a project and sandbox', operationId: 'updateProjectValidator' })
  async updateProjectValidator(
    @Param('projectId') projectId: string,
    @Param('sandboxId') sandboxId: string,
    @Param('groupId') groupId: string,
    @Param('socketId') socketId: string,
    @Param('validatorId') validatorId: string,
    @CurrentUser() current: Current,
    @Body() validator: any,
    @Res() response: Response
  ) {
    try {
      const { status, project, sandbox } = await this.getProjectAndSandbox(current, projectId, sandboxId);
      if (status.statusCode !== 200) {
        return response.status(status.statusCode).send({ message: status.message });
      }

      const res = await this.checkProjectValidator(project, validator);
      if (res.statusCode !== 200) {
        return response.status(res.statusCode).send({ message: res.message });
      }

      const generatedSocketGroups = JSON.parse(project.generatedSocketGroups) as GroupSchemas[];
      const groupSchemas: GroupSchemas = generatedSocketGroups.find(genGroup => genGroup.group._id.toString() === groupId);
      const socketSchemasIdx = groupSchemas ? groupSchemas.schemas.findIndex(socketSchemas => socketSchemas.schema.$id === socketId) : -1;
      if (socketSchemasIdx === -1) {
        return response.status(422).send({ message: 'The group or socket is not available for this project' });
      }
      const dupIdx = groupSchemas.schemas[socketSchemasIdx].validators.findIndex(val => val.title === validator.name);
      if (dupIdx !== -1) {
        return response.status(422).send({ message: 'Duplicate socket validator name' });
      }
      const targetValIdx = groupSchemas.schemas[socketSchemasIdx].validators.findIndex(val => val.$id.split(':')[1] === validatorId);
      if (targetValIdx === -1) {
        return response.status(404).send({ message: 'Project validator with such ID not found' });
      }

      const normSchema = normalizeSchema(socketId, validator as SocketValidator);
      groupSchemas.schemas[socketSchemasIdx].validators[targetValIdx] = normSchema;

      const generatedSchemasRes = await this.projectsService.rawGenerateSocketGroupInSandbox(
        project, sandbox, groupSchemas
      );
      if (generatedSchemasRes.result.status !== 0) {
        throw new Error(generatedSchemasRes.result.message);
      }

      const newProject = await this.projectsService.updateProjectSockets(projectId, project.socketGroups, generatedSocketGroups);
      return response.json(newProject);
    } catch (err) {
      logger.error('[Update project socket validator in a project and sandbox]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/:projectId/sandboxes/:sandboxId/socket-groups/:groupId/:socketId/project-validators/:validatorId')
  @OpenAPI({ summary: 'Delete project socket validator from a project and sandbox', operationId: 'deleteProjectValidator' })
  async deleteProjectValidator(
    @Param('projectId') projectId: string,
    @Param('sandboxId') sandboxId: string,
    @Param('groupId') groupId: string,
    @Param('socketId') socketId: string,
    @Param('validatorId') validatorId: string,
    @CurrentUser() current: Current,
    @Res() response: Response
  ) {
    try {
      const { status, project, sandbox } = await this.getProjectAndSandbox(current, projectId, sandboxId);
      if (status.statusCode !== 200) {
        return response.status(status.statusCode).send({ message: status.message });
      }

      if ((!project.generatedSocketGroups || project.generatedSocketGroups === '')) {
        return response.status(422).send({ message: 'No groups were added to this project' });
      }

      const generatedSocketGroups = JSON.parse(project.generatedSocketGroups) as GroupSchemas[];
      const groupSchemas: GroupSchemas = generatedSocketGroups.find(genGroup => genGroup.group._id.toString() === groupId);
      const socketSchemasIdx = groupSchemas ? groupSchemas.schemas.findIndex(socketSchemas => socketSchemas.schema.$id === socketId) : -1;
      if (socketSchemasIdx === -1) {
        return response.status(422).send({ message: 'The group or socket is not available for this project' });
      }

      const targetValIdx = groupSchemas.schemas[socketSchemasIdx].validators.findIndex(val => val.$id.split(':')[1] === validatorId);
      if (targetValIdx === -1) {
        return response.status(404).send({ message: 'Project validator with such ID not found' });
      }
      groupSchemas.schemas[socketSchemasIdx].validators.splice(targetValIdx, 1);

      const generatedSchemasRes = await this.projectsService.rawGenerateSocketGroupInSandbox(
        project, sandbox, groupSchemas
      );
      if (generatedSchemasRes.result.status !== 0) {
        throw new Error(generatedSchemasRes.result.message);
      }

      const newProject = await this.projectsService.updateProjectSockets(projectId, project.socketGroups, generatedSocketGroups);
      return response.json(newProject);
    } catch (err) {
      logger.error('[Delete project socket validator from a project and sandbox]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:projectId/sandboxes/:sandboxId/socket-groups')
  @OpenAPI({ summary: 'Add socket groups to a project and sandbox', operationId: 'addSocketGroups' })
  async addSocketGroups(
    @Param('projectId') projectId: string,
    @Param('sandboxId') sandboxId: string,
    @CurrentUser() current: Current,
    @Body() socketGroups: string[],
    @Res() response: Response
  ) {
    try {
      const { status, project, sandbox } = await this.getProjectAndSandbox(current, projectId, sandboxId);
      if (status.statusCode !== 200) {
        return response.status(status.statusCode).send({ message: status.message });
      }

      socketGroups = socketGroups.filter((val, i, arr) => arr.indexOf(val) === i);

      const generatedGroups = (!project.generatedSocketGroups || project.generatedSocketGroups === '') ? [] :
        JSON.parse(project.generatedSocketGroups) as GroupSchemas[];
      const oldProjectSocketGroups = generatedGroups.map(gg => gg.group);
      const newSocketGroups = socketGroups.filter(group => !oldProjectSocketGroups.find(og => og._id === group));
      const deletedGroups = oldProjectSocketGroups.filter(group => !socketGroups.includes(group._id));
      const stayedGroups = generatedGroups.filter(group => socketGroups.includes(group.group._id));

      if (newSocketGroups.length === 0 && deletedGroups.length === 0) {
        response.sendStatus(204);
      }

      const generatedSchemas = await this.projectsService.processSocketGroupsForSandbox(
        current,
        project,
        sandbox,
        newSocketGroups,
        deletedGroups,
        stayedGroups
      );

      const newProject = await this.projectsService.updateProjectSockets(projectId, socketGroups, generatedSchemas);
      return response.json(newProject);
    } catch (err) {
      logger.error('[Add socket groups to a project and sandbox]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Post('/check/project-name')
  @OpenAPI({ summary: 'Check project name', operationId: 'checkNameAvailability' })
  async checkProjectName(@CurrentUser() current: Current, @Body() payload: {name: string}, @Res() response: Response) {
    try {
      const count = await this.projectsService.checkProjectName(payload.name, current);
      return response.json({available: !Boolean(count), name: payload.name});
    } catch (err) {
      return response.status(400).send({message: err.message});
    }
  }


  @Get('/by/:id')
  @OpenAPI({ description: 'get project by id', operationId: 'getById' })
  async getById(@CurrentUser() current: Current, @Param('id') id: string, @Res() response: Response) {
    try {
      if (current.organization == undefined) {
        return response.status(500).json({
          message: 'Undefined organization'
        });
      }
      const result = await this.projectsService.findById(id);
      return response.json(result);
    } catch (err) {
      logger.error('[get project by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/search')
  @OpenAPI({ summary: 'Search for project', operationId: 'search' })
  async search(@CurrentUser() current: Current, @Res() response: Response, @QueryParam('name') name: string, @QueryParam('projectType') projectType: string, @QueryParam('sortByName') sortByName: boolean, @QueryParam('sortType') sortType: string, @QueryParam('sortByCreatedAt') sortByCreatedAt: boolean, @QueryParam('projectSubType') projectSubType: string, @QueryParam('showArchive') showArchive: boolean) {

    const organizationId = current.organization ? current.organization._id : undefined;
    const userId = current.user._id;
    const projects = await this.projectsService.search(organizationId, userId, name, projectType, sortByName, sortType, sortByCreatedAt, projectSubType, showArchive);
    return response.json(projects);
  }

  @Get('/list')
  @OpenAPI({ summary: 'List projects', operationId: 'list' })
  async list(
    @CurrentUser() current: Current,
    @Res() response: Response,
    @QueryParam('projectType') projectType: ProjectType,
    @QueryParam('projectSubType') projectSubType: ProjectSubType,
    @QueryParam('onlyWithRelease') onlyWithRelease: boolean,
  ) {
    const organizationId = current.organization ? current.organization._id : undefined;

    const projects = organizationId ? await this.projectsService.findByOrg(organizationId, false, projectType, projectSubType, onlyWithRelease) :
                                      await this.projectsService.findByUser(current.user._id);
    return response.json(projects);
  }

  @Get('/recent')
  @OpenAPI({ summary: 'List recent projects', operationId: 'recent' })
  async listRecent(@CurrentUser() current: Current, @Res() response: Response, @QueryParam('name') name: string, @QueryParam('projectType') projectType: string) {
    const organizationId = current.organization ? current.organization._id : undefined;
    const projects = await this.projectsService.findRecent(organizationId, current.user._id);
    return response.json(projects);
  }

  @Get('/purchased')
  @OpenAPI({ summary: 'List purchased projects', operationId: 'purchased' })
  @ResponseSchema(Project, { isArray: true })
  async purchased(@CurrentUser() current: Current, @Res() response: Response, @QueryParam('projectType') projectType: string) {
    const organizationId = current.organization ? current.organization._id : undefined;

    if (!organizationId) {
      return response.status(503).json({
        message: 'Allow only for organizations'
      });
    }

    const projects = await this.projectsService.getPurchased(organizationId, projectType, current.token);
    return response.json(projects);
  }


}
