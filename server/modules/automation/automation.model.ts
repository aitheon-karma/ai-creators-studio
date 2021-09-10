import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Runtime, ProjectType, Project, ProjectSubType } from '../projects/project.model';
import { ProjectLanguage } from '../projects/project.model';
import { Type } from 'class-transformer';
// Below schemas are just for helpers and rest generation

export enum AutomationProjectType {
  CODELESS = 'CODELESS',
  CODED = 'CODED'
}

@JSONSchema({ description: 'Automation Status' })
export class AutomationStatus {

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsBoolean()
  @IsOptional()
  inProgress?: boolean;

  @IsBoolean()
  @IsOptional()
  error?: boolean;

  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsOptional()
  @IsString()
  currentTask?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsString()
  @IsOptional()
  redirectUrl?: string;

  @IsOptional()
  @IsMongoId()
  sandBoxId?: string;


  @IsOptional()
  output?: any;
}

@JSONSchema({description: 'Automation Template'})
export class AutomationProjectTemplate {
  @IsOptional()
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @IsOptional()
  @IsEnum(Runtime)
  runtime: Runtime;

  @IsOptional()
  @IsEnum(ProjectLanguage)
  language: ProjectLanguage;
}


@JSONSchema({ description: 'Automation Project' })
export class AutomationProject {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  @IsOptional()
  service: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  @IsEnum(AutomationProjectType)
  type: AutomationProjectType;

  @IsOptional()
  @IsEnum(ProjectSubType)
  subType: ProjectSubType;

  @IsString()
  @IsOptional()
  sandBoxType?: string;

  @IsOptional()
  meta: any;

  @Type(() => Project)
  @ValidateNested()
  @IsOptional()
  project: Project;
}
