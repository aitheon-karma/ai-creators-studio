import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { Request, Response } from 'express';
import { logger, Current } from '@aitheon/core-server';
import { TemplatesService, hasPlatformAccess, PlatformRole } from './templates.service';
import { Template } from './template.model';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { GiteaService } from '../gitea/gitea.service';

@Authorized()
@JsonController('/api/templates')
export class TemplatesController {

  @Inject()
  templatesService: TemplatesService;

  @Inject()
  giteaService: GiteaService;

  @Get('/')
  @OpenAPI({ summary: 'List of tempaltes', operationId: 'list' })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const templates = await this.templatesService.findAll();
      // For this type of settings, return original projectType for not-found settings
      return response.json(templates);
    } catch (err) {
      logger.error(`[getTemplates] `, err);
      return response.sendStatus(500);
    }
  }

  @Post('/')
  @OpenAPI({ summary: 'Save template', operationId: 'save' })
  async save(@CurrentUser() current: Current, @Res() response: Response, @Body() body: Template) {
    try {
      if (!hasPlatformAccess(current.user, PlatformRole.PLATFORM_ADMIN)) {
        return response.sendStatus(403);
      }
      const template = body._id ? await this.templatesService.update(body) : await this.templatesService.create(body);
      return response.json(template);
    } catch (err) {
      logger.error(`[save] `, err);
      return response.sendStatus(500);
    }
  }

  @Post('/searchRepository')
  @OpenAPI({ summary: 'Search template', operationId: 'searchRepository' })
  async searchRepository(@CurrentUser() current: Current, @Res() response: Response, @Body() body: { query: string }) {
    try {
      if (!hasPlatformAccess(current.user, PlatformRole.PLATFORM_ADMIN)) {
        return response.sendStatus(403);
      }
      const repos = await this.giteaService.searchRepository(body.query);
      return response.json(repos);
    } catch (err) {
      logger.error(`[save] `, err);
      return response.sendStatus(500);
    }
  }


}
