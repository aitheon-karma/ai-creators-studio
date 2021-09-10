import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { MarketplaceSettingsService } from './marketplace-settings.service';
import { MarketplaceSettings, MarketplaceSettingsSchema } from './marketplace-settings.model';


@Authorized()
@JsonController('/api/marketplace')
export class MarketplaceSettingsController {

  @Inject()
  marketplaceSettingsService: MarketplaceSettingsService;


  constructor() {

  }

  @Get('/projects/:projectId')
  @OpenAPI({ summary: 'Get settings by project id', operationId: 'getByProject' })
  async getByProject(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('projectId') projectId: string) {
    try {
      const result = await this.marketplaceSettingsService.findByProject(projectId);
      return response.json(result);
    } catch (err) {
      logger.error('[MarketplaceSettings get by project id]', err);
      return response.status(422).send({ message: err.message });
    }
  }

  @Get('/nodes/:nodeId')
  @OpenAPI({ summary: 'Get settings by node id', operationId: 'getByNode' })
  async getByNode(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('nodeId') nodeId: string) {
    try {
      const result = await this.marketplaceSettingsService.findByNode(nodeId);
      return response.json(result);
    } catch (err) {
      logger.error('[MarketplaceSettings get by node id]', err);
      return response.status(422).send({ message: err.message });
    }
  }

  @Post('/settings/:projectId')
  @OpenAPI({ summary: 'Create project marketplace settings', operationId: 'create' })
  async create(@CurrentUser() current: Current, @Body() settings: MarketplaceSettings, @Res() response: Response, @Req() request: Request, @Param('projectId') projectId: string, @QueryParam('type') type: string) {
    try {
      settings.project = projectId;
      const marketplaceSettings = await this.marketplaceSettingsService.findByProject(projectId);
      const result = marketplaceSettings ? await this.marketplaceSettingsService.update(marketplaceSettings._id, settings) :
                                           await this.marketplaceSettingsService.create(settings);

      const item = await this.marketplaceSettingsService.saveItem(settings, current, type);
      return response.json(result);
    } catch (err) {
      logger.error('[MarketplaceSettings create]', err);
      return response.status(422).send({ message: err.message });
    }
  }

  @Post('/settings/nodes/:nodeId')
  @OpenAPI({ summary: 'Create node marketplace settings', operationId: 'createForNode' })
  async createForNode(@CurrentUser() current: Current, @Body() settings: MarketplaceSettings, @Res() response: Response, @Req() request: Request, @Param('nodeId') nodeId: string, @QueryParam('type') type: string) {
    try {
      settings.provisionalNode = nodeId;
      const marketplaceSettings = await this.marketplaceSettingsService.findByNode(nodeId);
      const result = marketplaceSettings ? await this.marketplaceSettingsService.update(marketplaceSettings._id, settings) :
                                           await this.marketplaceSettingsService.create(settings);

      const item = await this.marketplaceSettingsService.saveItem(settings, current, type);
      return response.json(result);
    } catch (err) {
      logger.error('[MarketplaceSettings create]', err);
      return response.status(422).send({ message: err.message });
    }
  }

}
