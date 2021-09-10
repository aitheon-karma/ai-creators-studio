import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { Organization } from '@aitheon/core-server';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectLanguage } from '../projects/project.model';
import { Runtime } from '../projects/project.model';
import { ProjectType } from '../projects/project.model';


@JSONSchema({ description: 'Template' })
export class Template {

  @IsMongoId()
  _id: string;

  @IsEnum(ProjectType)
  projectType: ProjectType;

  @IsEnum(Runtime)
  runtime: Runtime;

  @IsEnum(ProjectLanguage)
  language: ProjectLanguage;

  @IsString()
  dockerfile: string;

  @IsNumber()
  repositoryId: number;

}

/**
 * Database schema/collection
 */
const templateSchema = new Schema({
  projectType: {
    type: String,
    enum: Object.keys(ProjectType)
  },
  runtime: {
    type: String,
    enum: Object.keys(Runtime)
  },
  language: {
    type: String,
    enum: Object.keys(ProjectLanguage)
  },
  dockerfile: String,
  repositoryId: Number
},
{
  timestamps: true,
  collection: 'creators_studio__templates'
});


export type ITemplate = Document & Template;
export const TemplateSchema = Db.connection.model<ITemplate>('Template', templateSchema);