import { Project } from '@aitheon/creators-studio';

export class ProjectTypeSettings {
  projectType: Project.ProjectTypeEnum;
  projectTemplate: string;
  aiIgnore: string;
}

export interface Dependency {
  _id: string;
  name: string;
  gitUrl: string;
  service?: string;
}

export class ItemFile {
  _id: string;
  createdAt: Date;
  filename: string;
  mimetype: string;
  url: string;
}
