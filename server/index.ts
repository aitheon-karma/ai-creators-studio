'use strict';
import 'ts-helpers';
import 'reflect-metadata';
import { Application } from './config/application';

import { TransporterBroker, MetadataStorage } from '@aitheon/transporter';


const serviceIO = MetadataStorage.generateIO();

export default new Application();
