'use strict';

import 'ts-helpers';
// import 'source-map-support/register';
import 'reflect-metadata';
import * as path from 'path';
import { TransporterBroker } from '@aitheon/transporter';
import { environment } from './environment';
import { Container, Inject } from 'typedi';
import { GiteaService } from './modules/gitea/gitea.service';

const transporter = new TransporterBroker({
  transporterServiceId: `${ environment.service._id }${ environment.production ? '' : '_DEV'}`,
  transporterOptions: environment.rabbitmq
});
transporter.start();

const giteaService = Container.get(GiteaService);
if (process.env.ORGS === 'true') {
  console.log('Start seed orgs');
  giteaService.seedOrganizations();
} else if (process.env.FIXES === 'true') {
  giteaService.fixUsers();
} else {
  giteaService.seed();
}
