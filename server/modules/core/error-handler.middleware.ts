import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { logger } from '@aitheon/core-server';
import { Response, Request } from 'express';
import { environment } from '../../environment';

@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {

  error(error: any, request: Request, response: Response, next: (err: any) => any) {

    let status = 500;
    switch (error.name) {
      case 'AccessDeniedError':
      case 'AuthorizationRequiredError':
        logger.info('[AUTH] AccessDeniedError: ', error.message);
        status = 401;
      default:
        logger.error(error);
    }

    if (!response.headersSent) {
      response.sendStatus(status);
    }
  }

}