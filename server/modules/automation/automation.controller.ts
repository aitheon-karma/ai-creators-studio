import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger, getTokenFromRequest, accessTokenCheck } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { environment } from '../../environment';
import { AutomationProject } from './automation.model';
import { AutomationService } from './automation.service';
import { ProjectsService } from '../projects/projects.service';
import { IProject } from '../projects/project.model';
import { SandboxesService } from '../sandboxes/sandboxes.service';


@Authorized()
@JsonController('/api/automation')
export class AutomationController {

  @Inject()
  automationService: AutomationService;


  @Inject()
  projectService: ProjectsService;


  @Inject()
  sandboxesService: SandboxesService;



  @Post('/create')
  @OpenAPI({ summary: 'Initialize project creation', operationId: 'create' })
  async create(@CurrentUser() current: Current, @Body() project: AutomationProject, @Res() response: Response, @Req() request: Request) {
    const automationId = this.automationService.start(project, current);
    const sandbox = await this.sandboxesService.findInUseByUser(current.user._id, current.organization ? current.organization._id : undefined);
    const steps = ['Creating Project', 'Creating sandbox', 'Loading project'];
    return response.json({ started: true, automationId, estimatedTime: '40 seconds', steps });
  }


  @Get('/open/:projectId')
  @OpenAPI({ summary: 'Open project', operationId: 'openProject' })
  async openProject(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('projectId') projectId: string) {
    const project = await this.projectService.findById(projectId) as IProject;
    if (!project) {
      return response.status(404).send({ message: 'Project not found' });
    }
    const automationId = this.automationService.start(undefined, current, project.toObject());
    const sandbox = await this.sandboxesService.findInUseByUser(current.user._id, current.organization ? current.organization._id : undefined);
    const steps = ['Creating sandbox', 'Booting up sandbox', 'Loading project'];
    return response.json({ started: true, automationId, estimatedTime: '40 seconds', steps });
  }


  @Get('/status/:automationId')
  @OpenAPI({ summary: 'Check status of automation status', operationId: 'status' })
  async status(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('automationId') automationId: string) {
    const status = await this.automationService.getStatus(automationId);
    return response.json(status);
  }

  @Get('/projects/active/:sandboxId')
  @OpenAPI({ summary: 'Get Sandbox active projects', operationId: 'getActiveProjects' })
  async activeProjects(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('sandboxId') sandboxId: string) {
    try {
      const activeProjects = await this.automationService.getActiveProjects(sandboxId, current);
      return response.json(activeProjects);
    } catch (err) {
      return response.status(400).send({ message: 'Error getting active projects', error: err.message });
    }
  }


  @Post('/quick-release/:sandboxId')
  @OpenAPI({ summary: 'Quick Release', operationId: 'quickRelease' })
  async quickRelease(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: { automationId: string, projectId: string }, @Param('sandboxId') sandboxId: string) {
    if (!current.organization) {
      return response.status(400).send({ message: 'Quick deploy currently only supported by organization projects' });
    }
    const automationId = await this.automationService.quickRelease(sandboxId, current, body ? body.projectId : undefined, body ? body.automationId : undefined);
    return response.json({ started: true, automationId });
  }


  /* FOR testing
  @Get('/commit/:sandboxId/:projectSlug')
  @OpenAPI({summary: 'Check status of automation status', operationId: 'status' })
  async commit(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('sandboxId') sandboxId: string, @Param('projectSlug') projectSlug: string) {
    const result = await this.automationService.commitRepo(sandboxId, projectSlug);
    return response.json(result);
  }
  */

}
