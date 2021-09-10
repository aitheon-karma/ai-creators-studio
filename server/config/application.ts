import { environment } from '../environment';
import { Container } from 'typedi';
Container.set('environment', environment);
import { TransporterBroker } from '@aitheon/transporter';
import * as http from 'http';
import { GiteaService } from '../modules/gitea/gitea.service';
import { SandboxesService } from '../modules/sandboxes/sandboxes.service';
import { Sandbox } from '../modules/sandboxes/sandbox.model';

import { ExpressConfig, logger } from '@aitheon/core-server';
import * as docs from '@aitheon/core-server';

export class Application {

  server: http.Server;
  express: ExpressConfig;

  constructor() {
    /**
     * Inner microservices communication via transporter
     */
    const transporter = new TransporterBroker({
      transporterServiceId: `${ environment.service._id }${ environment.production ? '' : '_DEV'}`,
      transporterOptions: environment.rabbitmq
    });
    transporter.start();


    const sandboxesService = Container.get(SandboxesService);
    sandboxesService.initSessionCleanup();
    // sandboxesService.terminate({ _id: '5e5ffa5a0dd8260011c2cf0a'} as Sandbox);
    // sandboxesService.terminate({ _id: '5e60c4ece6881e957fe81684'} as Sandbox);
    // sandboxesService.terminate({ _id: '5e61232ce6881e957fe816ad'} as Sandbox);
    const giteaService = Container.get(GiteaService);
    // giteaService.seed();
    // giteaService.createOrganization({ user: { _id: '5e666b5f80974473167b19af' } as any, organization: { domain: 'oneone5', _id: '5925de2a16d7f20015e06169'} as any });

    // giteaService.addOrgMember({ user: { _id: '5925ab587bb5b800150a3e16'} as any, organization: { _id: '5925de2a16d7f20015e06169'} as any });
    // giteaService.removeOrgMember({ user: { _id: '5925ab587bb5b800150a3e16'} as any, organization: { _id: '5925de2a16d7f20015e06169' } as any });
    // giteaService.changePassword({ user: { _id: '5925ab587bb5b800150a3e16' } as any, password: '' });
    // giteaService.createUser({
    //   user: {
    //     _id: '5925ab587bb5b800150a3e16',
    //     email: 'sergei.sleptsov@gmail.com',
    //     profile: {
    //       firstName: 'Sergei',
    //       lastName: 'Test new keys'
    //     }
    //   } as any,
    //   password: '5E61232ce6881e957fe816ad'
    // });

    this.express = new ExpressConfig();

    docs.init(this.express.app, () => {
      console.log('Swagger documentation generated');
    });

    /**
     * Start server
     */
    /**
     * Start server
     */
    this.server = this.express.app.listen(environment.port, () => {
      logger.debug(`
        ------------
        ${ environment.service._id } Service Started!
        Express: http://localhost:${ environment.port }
        ${ environment.production ? 'Production: true' : '' }
        ------------
      `);
    });
  }
}
