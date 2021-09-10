import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { Organization } from '@aitheon/core-server';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum Visibility {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION'
}

export enum BuildStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export enum NodeTemplateStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  ERROR = 'ERROR'
}

@JSONSchema({ description: 'Release' })
export class Release {

  @IsMongoId()
  _id: string;

  @IsMongoId()
  @IsOptional()
  user: string;

  @IsMongoId()
  @IsOptional()
  organization?: string;

  @IsString()
  tag: string;

  @IsString()
  name: string;

  @IsString()
  npmLibName: string;

  @IsString()
  description: string;

  @IsString()
  headCommit: string;

  @IsNumber()
  giteaReleaseId: number;

  @IsMongoId()
  project: string;

  @IsEnum(Visibility)
  visibility: Visibility;

  @IsEnum(NodeTemplateStatus)
  nodeTemplateStatus: NodeTemplateStatus;

  @IsMongoId()
  build: string;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  @IsOptional()
  updatedAt: Date;

  outputs: any;
  inputs: any;
  ticks: any;
  settingParams: any;
  nodeChannels: any;
  deviceReceiver: boolean;
  deviceSender: boolean;

}

export enum ChannelType {
  server = 'server',
  client = 'client',
}

export const socketMetadataSchema = new Schema({
  name: String,
  multiple: {
    type: Boolean,
    default: true
  },
  socket: {
    type: Schema.Types.ObjectId,
    ref: 'Socket'
  },
  core: {
    type: Boolean,
    default: false
  }
});

export const channelMetadataSchema = new Schema({
  name: String,
  multiple: {
    type: Boolean,
    default: true
  },
  socket: {
    type: Schema.Types.ObjectId,
    ref: 'Socket'
  },
  responseSocket: {
    type: Schema.Types.ObjectId,
    ref: 'Socket'
  },
  type: {
    type: String,
    enum: Object.keys(ChannelType),
  },
  core: {
    type: Boolean,
    default: false
  }
});

/**
 * Database schema/collection
 */
const releaseSchema = new Schema({
  tag: {
    type: String,
    required: true,
    maxlength: 512
  },
  name: {
    type: String,
    required: true,
    maxlength: 2048
  },
  description: {
    type: String,
    required: true,
    maxlength: 2048
  },
  giteaReleaseId: Number,
  headCommit: String,
  visibility: {
    type: String,
    enum: Object.keys(Visibility)
  },
  nodeTemplateStatus: {
    type: String,
    enum: Object.keys(NodeTemplateStatus)
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Projects'
  },
  npmLibName: Schema.Types.String,
  inputs: [socketMetadataSchema],
  outputs: [socketMetadataSchema],
  ticks: Schema.Types.Mixed,
  settingParams: Schema.Types.Mixed,
  nodeChannels: [channelMetadataSchema],
  build: Schema.Types.ObjectId,
  user: Schema.Types.ObjectId,
  organization: Schema.Types.ObjectId,
  deviceReceiver: Boolean,
  deviceSender: Boolean
},
{
  timestamps: true,
  collection: 'creators_studio__releases'
});

export type IRelease = Document & Release;
export const ReleaseSchema = Db.connection.model<IRelease>('Release', releaseSchema);
