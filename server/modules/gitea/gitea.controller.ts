import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger, getTokenFromRequest, accessTokenCheck } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { environment } from '../../environment';
import { GiteaService } from './gitea.service';

@JsonController('/api/gitea')
export class GiteaController {

  constructor(
    // examplesService: ExamplesService
  ) {

  }

  @Inject()
  giteaService: GiteaService;

  @Get('/auth')
  @OpenAPI({ summary: 'SSO', operationId: 'auth' })
  async auth(@Res() response: Response, @Req() request: Request) {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return response.sendStatus(204);
    }
    const current = await accessTokenCheck(request, []);
    if (!current) {
      return response.sendStatus(204);
    }
    const giteaUser = await this.giteaService.findByUserId(current.user._id);
    if (!giteaUser) {
      return response.status(401).send('No gitea user found');
    }
    response.setHeader('X-WEBAUTH-USER', giteaUser.username);
    return response.sendStatus(204);
  }

}
