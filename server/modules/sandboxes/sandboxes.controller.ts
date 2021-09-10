import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger, getTokenFromRequest, accessTokenCheck } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { environment } from '../../environment';
import { SandboxesService } from './sandboxes.service';
import { Sandbox, SandboxSchema, SandboxStatus } from './sandbox.model';
import { ProjectsService } from '../projects/projects.service';
import { hasAccess } from '../core/auth-helper';
import { RedisService } from '../core/redis.service';
import { createHmac } from 'crypto';
import { ReleasesService } from '../releases/releases.service';
import { SandboxesLibraryService } from './sandboxes-library.service';

@Authorized()
@JsonController('/api/sandboxes')
export class SandboxesController {

  @Inject()
  sandboxesService: SandboxesService;

  @Inject()
  projectsService: ProjectsService;

  @Inject()
  redisService: RedisService;


  @Inject()
  releasesService: ReleasesService;

  @Inject()
  sandboxesLibraryService: SandboxesLibraryService;

  constructor(
  ) {
  }

  @Get('/types/list')
  @OpenAPI({ summary: 'List of sandboxes', operationId: 'typesList' })
  async typesList(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    const list = await this.sandboxesService.listSandboxTypes();
    return response.json(list);
  }

  @Post('/')
  @OpenAPI({ summary: 'Create sandbox', operationId: 'create' })
  async create(@CurrentUser() current: Current, @Body() createSandboxDto: Sandbox, @Res() response: Response, @Req() request: Request) {
    const organization = current.organization ? current.organization._id : undefined;
    const exist = await this.sandboxesService.findInUseByUser(current.user._id, organization);
    if (exist) {
      return response.status(422).json({
        message: 'You already have running sandbox',
        sandbox: exist
      });
    }

    const sandbox = await this.sandboxesService.create(createSandboxDto.type, current.user, current.token, organization);
    return response.json(sandbox);
  }

  @Delete('/:id')
  @OpenAPI({ summary: 'Terminate sandbox', operationId: 'terminate' })
  async terminate(@CurrentUser() current: Current, @Param('id') id: string, @Res() response: Response, @Req() request: Request) {
    const sandbox = await this.sandboxesService.findById(id);
    if (!sandbox) {
      return response.status(404).json({
        message: 'Sandbox not found',
        sandbox: sandbox
      });
    }
    if (sandbox.user != current.user._id || (sandbox.organization && sandbox.organization != (current.organization ? current.organization._id : undefined))) {
      return response.status(401).json({
        message: 'No access'
      });
    }

    await this.sandboxesService.terminate(sandbox);
    return response.sendStatus(204);
  }

  @Get('/search/active')
  @OpenAPI({ summary: 'Get active sandbox', operationId: 'active' })
  async active(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    const user = current.user._id;
    const organization = current.organization ? current.organization._id : undefined;

    const sandbox = await this.sandboxesService.findInUseByUser(user, organization);
    return response.json(sandbox);
  }

  @Get('/:id')
  @OpenAPI({ summary: 'Get sandbox', operationId: 'getById' })
  async getById(@CurrentUser() current: Current, @Param('id') id: string, @Res() response: Response, @Req() request: Request) {
    const sandbox = await this.sandboxesService.findById(id);
    if (!sandbox) {
      return response.status(404).json({
        message: 'Sandbox not found',
        sandbox: sandbox
      });
    }
    if (sandbox.user != current.user._id || (sandbox.organization && sandbox.organization != (current.organization ? current.organization._id : undefined))) {
      return response.status(401).json({
        message: 'No access'
      });
    }

    return response.json(sandbox);
  }


  @Get('/:id/auth')
  @OpenAPI({ summary: 'SSO', operationId: 'auth' })
  async auth(@Res() response: Response, @Param('id') id: string, @Req() request: Request) {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return response.sendStatus(204);
    }
    const hmac = createHmac('sha1', environment.sandboxAuthProxyCacheKey);
    const authCacheKey = hmac.update(token).digest('hex');
    if (await this.redisService.client.get(authCacheKey)) {
      return response.sendStatus(204);
    }

    const current = await accessTokenCheck(request, []);
    if (!current) {
      return response.sendStatus(204);
    }
    const sandbox = await this.sandboxesService.findById(id);
    if (!sandbox) {
      return response.status(404).json({
        message: 'Sandbox not found',
        sandbox: sandbox
      });
    }
    if (sandbox.user != current.user._id || (sandbox.organization && sandbox.organization != (current.organization ? current.organization._id : undefined))) {
      return response.status(401).json({
        message: 'No access to sandbox'
      });
    }

    await this.redisService.client.set(authCacheKey, 'true');
    await this.redisService.client.expire(authCacheKey, Number(environment.sandboxAuthProxyCacheSeconds));

    return response.sendStatus(204);
  }

  @Get('/:id/ping')
  @OpenAPI({ summary: 'Ping sandbox', operationId: 'ping' })
  async ping(@CurrentUser() current: Current, @Param('id') id: string, @Res() response: Response, @Req() request: Request) {
    const sandbox = await this.sandboxesService.findById(id);
    if (!sandbox) {
      return response.status(404).json({
        message: 'Sandbox not found',
        sandbox: sandbox
      });
    }
    if (sandbox.user != current.user._id || (sandbox.organization && sandbox.organization != (current.organization ? current.organization._id : undefined))) {
      return response.status(401).json({
        message: 'No access'
      });
    }

    await this.sandboxesService.updateActivity(sandbox);

    return response.json({ _id: sandbox._id, status: sandbox.status });
  }

  @Put('/:sandboxId/projects/:projectId')
  @OpenAPI({ summary: 'Load project', operationId: 'loadProject' })
  async loadProject(@Param('sandboxId') sandboxId: string, @Param('projectId') projectId: string, @CurrentUser() current: Current, @Res() response: Response) {

    const project = await this.projectsService.findById(projectId);
    if (!project) {
      return response.sendStatus(404);
    }
    const sandbox = await this.sandboxesService.findById(sandboxId);
    if (!sandbox) {
      return response.sendStatus(404);
    }

    if (!hasAccess(current.user, current.organization, project)) {
      return response.status(422).send({ message: 'No access to this project' });
    }
    if (!hasAccess(current.user, current.organization, sandbox)) {
      return response.status(422).send({ message: 'No access to this sandbox' });
    }
    const result = await this.projectsService.loadProject(project, sandbox);
    return response.sendStatus(204);
  }

  @Get('/')
  @OpenAPI({ summary: 'List sandboxes', operationId: 'list' })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    const user = current.user._id;
    const organization = current.organization ? current.organization._id : undefined;

    const sandboxes = await this.sandboxesService.findByUser(user, organization);
    return response.json(sandboxes);
  }

  @Post('/:sandboxId/install-component')
  @OpenAPI({ summary: 'Install Component Library', operationId: 'installComponentLibrary' })
  async installComponentLibrary(@Param('sandboxId') sandboxId: string, @CurrentUser() current: Current, @Body() body: any, @Res() response: Response) {

    const sandbox = await this.sandboxesService.findById(sandboxId);
    if (!sandbox || sandbox.status !== SandboxStatus.RUNNING) {
      return response.status(400).send({ message: 'Sandbox not running' });
    }

    const project = await this.projectsService.findById(body.projectId);
    if (!project) {
      return response.sendStatus(404);
    }
    const componentProject = await this.projectsService.findById(body.componentProjectId);
    if (!componentProject) {
      return response.sendStatus(404);
    }

    if (!hasAccess(current.user, current.organization, project)) {
      return response.status(422).send({ message: 'No access to this project' });
    }

    if (!hasAccess(current.user, current.organization, sandbox)) {
      return response.status(422).send({ message: 'No access to this sandbox' });
    }
    const release = await this.releasesService.findById(body.releaseId);

    if (!release || !release.npmLibName) {
      return response.status(400).send({ message: 'Npm package not found' });
    }

    this.sandboxesLibraryService.installLibrary({
      projectId: project._id.toString(),
      projectSlug: project.slug.toString(),
      libraryProjectId: componentProject._id,
      npmLibName: release.npmLibName,
      releaseId: release._id
    }, sandboxId);

    return response.sendStatus(204);
  }


  @Post('/:sandboxId/install-status')
  @OpenAPI({ summary: 'Install Component Library', operationId: 'checkLibraryInstallStatus' })
  async checkLibraryInstallStatus(@CurrentUser() current: Current, @Body() body: any, @Res() response: Response) {
    const result = await this.sandboxesLibraryService.getStatus(body.projectId, body.componentProjectId, body.releaseId);
    return response.json(result);
  }

}


@JsonController('/api/active-sandboxes')
export class SandboxesUsersController {
  @Inject()
  sandboxesService: SandboxesService;

  @Get('/')
  @OpenAPI({ summary: 'List of sandboxes', operationId: 'typesList' })
  async activeSandboxes(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    const results = await this.sandboxesService.activeSandboxes();
    let table = `<h3>Running sandboxes</h3><br/><table style="border-collapse:collapse">
    <tr>
      <th>Name</th>
      <th>Organization</th>
      <th>Sandbox Id</th>
  </tr>
    `;

    for (const sandbox of results) {
      table = table + `
    <tr>
    <td>${sandbox.user.profile.firstName} ${sandbox.user.profile.lastName}</td>
    <td>${sandbox.organization.name}</td>
    <td>${sandbox._id}</td>
  </tr>
    `;
    }
    table = table + '</table>';
    return response.send(table);
  }
}
