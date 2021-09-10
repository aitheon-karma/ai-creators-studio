import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { environment } from '../../environment';
import { ReleasesService } from './releases.service';
import { Release } from './release.model';
import { hasAccess } from '../core/auth-helper';
import { SandboxesService } from '../sandboxes/sandboxes.service';
import { TemplatesService } from '../templates/templates.service';
import { ProjectsService } from '../projects/projects.service';

@Authorized()
@JsonController('/api')
export class ReleasesController {

  @Inject()
  releasesService: ReleasesService;

  @Inject()
  projectsService: ProjectsService;

  @Inject()
  templatesService: TemplatesService;

  constructor() {
  }

  @Post('/releases')
  @OpenAPI({ summary: 'Create release', operationId: 'create' })
  async create(@CurrentUser() current: Current, @Body() releaseDto: Release, @Res() response: Response, @Req() request: Request) {
    try {
      releaseDto.user = current.user._id;
      releaseDto.organization = current.organization ? current.organization._id : undefined;

      if (!releaseDto.organization) {
        return response.status(422).send({ message: 'Release allowed only under organizations' });
      }

      const release = await this.releasesService.create(releaseDto, current);
      return response.json(release);
    } catch (err) {
      return response.status(422).send({ message: err.message });
    }
  }

  @Put('/releases/:releaseId')
  @OpenAPI({ summary: 'Update release', operationId: 'update' })
  async update(@CurrentUser() current: Current, @Param('releaseId') releaseId: string, @Body() releaseDto: Release, @Res() response: Response, @Req() request: Request) {
    try {
      const exist = await this.releasesService.findById(releaseDto._id);
      if (!exist) {
        return response.sendStatus(404);
      }
      if (!hasAccess(current.user, current.organization, exist)) {
        return response.status(422).send({ message: 'No access to this release' });
      }
      exist.name = releaseDto.name;
      exist.description = releaseDto.description;
      exist.visibility = releaseDto.visibility;
      const release = await this.releasesService.update(exist);
      return response.json(release);
    } catch (err) {
      return response.status(422).send({ message: err.message });
    }
  }

  @Get('/projects/:projectId/releases')
  @OpenAPI({ summary: 'List releases', operationId: 'listByProject' })
  async listByProject(@CurrentUser() current: Current, @Res() response: Response, @Param('projectId') projectId: string) {
    const releases = await this.releasesService._findByProject(projectId);
    return response.json(releases);
  }

  @Get('/projects/:projectId/builds')
  @OpenAPI({ summary: 'List project builds', operationId: 'listBuilds' })
  async listBuilds(@CurrentUser() current: Current, @Param('projectId') projectId: string, @Res() response: Response) {
    const builds = await this.releasesService.findBuilds(projectId);
    return response.json(builds);
  }

  @Get('/projects/:projectId/builds/:buildId')
  @OpenAPI({ summary: 'Build details', operationId: 'getBuild' })
  async getBuild(@CurrentUser() current: Current, @Param('projectId') projectId: string, @Param('buildId') buildId: string, @Res() response: Response) {
    const build = await this.releasesService.findBuildById(buildId, true);
    if (!build.project) {
      return response.status(422).send({ message: 'Build dont have project' });
    }
    const project = await this.projectsService.findById(build.project);
    if (!project) {
      return response.sendStatus(404);
    }
    if (!hasAccess(current.user, current.organization, project)) {
      return response.status(422).send({ message: 'No access to this project' });
    }

    return response.json(build);
  }

  @Post('/projects/:projectId/builds')
  @OpenAPI({ summary: 'List of builds', operationId: 'createBuild' })
  async createBuild(@CurrentUser() current: Current, @Param('projectId') projectId: string, @Res() response: Response) {
    const organizationId = current.organization ? current.organization._id : undefined;
    const project = await this.projectsService.findById(projectId);
    if (!project) {
      return response.sendStatus(404);
    }
    if (!hasAccess(current.user, current.organization, project)) {
      return response.status(422).send({ message: 'No access to this project' });
    }

    const template = await this.templatesService.find(project.runtime, project.projectType, project.language);
    if (!template) {
      return response.status(422).send({ message: 'Project dont have template to build' });
    }

    const build = await this.releasesService.createBuild(project, template, current.user._id, organizationId);
    return response.json(build);
  }

}
