import Container, { Service, Inject } from 'typedi';
import { TemplateSchema, Template } from './template.model';
import { MailerService, SendMailOptions } from '../core/mailer.service';
import * as path from 'path';
import { Transporter, TransporterService, Action, Event, param } from '@aitheon/transporter';
import { logger } from '@aitheon/core-server';
import { ProjectType, Runtime, ProjectLanguage } from '../projects/project.model';

@Service()
@Transporter()
export class TemplatesService extends TransporterService {

  constructor() {
    super(Container.get('TransporterBroker'));
  }

  @Event()
  async findAll(): Promise<Template[]> {
    return TemplateSchema.find();
  }

  async find(runtime: Runtime, projectType: ProjectType, language: ProjectLanguage) {
    return TemplateSchema.findOne({ runtime, projectType, language });
  }

  async create(template: Template): Promise<Template> {
    const templateSchema = new TemplateSchema(template);
    return templateSchema.save();
  }

  async update(template: Template): Promise<Template> {
    return TemplateSchema.findByIdAndUpdate(template._id, template, { new: true });
  }

}

// HOTFIX: TO_DO: Move logic to core-server
export enum PlatformRole {
  NONE = 'NONE',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  PLATFORM_MANAGER = 'PLATFORM_MANAGER',
  PLATFORM_SUPPORT = 'PLATFORM_SUPPORT'
}

export function hasPlatformAccess(user: any, role: string = PlatformRole.PLATFORM_SUPPORT) {
  let hasAccess = user.sysadmin ||
    user.sysManager;
  switch (role) {
    case PlatformRole.PLATFORM_SUPPORT:
      hasAccess = hasAccess ||
        user.platformRole === PlatformRole.PLATFORM_ADMIN ||
        user.platformRole === PlatformRole.PLATFORM_MANAGER ||
        user.platformRole === PlatformRole.PLATFORM_SUPPORT;
      break;
    case PlatformRole.PLATFORM_MANAGER:
      hasAccess = hasAccess ||
        user.platformRole === PlatformRole.PLATFORM_ADMIN ||
        user.platformRole === PlatformRole.PLATFORM_MANAGER;
      break;
    case PlatformRole.PLATFORM_ADMIN:
      hasAccess = hasAccess ||
        user.platformRole === PlatformRole.PLATFORM_ADMIN;
      break;
  }
  return hasAccess;
}
