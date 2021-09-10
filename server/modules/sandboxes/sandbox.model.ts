import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
// import { SandboxType } from './sandbox-type';
import { User } from '@aitheon/core-server';

export enum SandboxStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  SHUTTING_DOWN = 'SHUTTING_DOWN',
  SHUTTING_DOWN_READY = 'SHUTTING_DOWN_READY',
  SHUTTING_DOWN_ERROR = 'SHUTTING_DOWN_ERROR',
  TERMINATED = 'TERMINATED'
}

@JSONSchema({ description: 'Sandbox' })
export class Sandbox {

  @IsMongoId()
  _id: string;

  @IsMongoId()
  user: User | string;

  @IsMongoId()
  @IsOptional()
  organization: string;

  @IsMongoId()
  type: string;

  @IsEnum(SandboxStatus)
  status: SandboxStatus;

  @IsDateString()
  @IsOptional()
  terminatedAt: Date;

  @IsDateString()
  @IsOptional()
  lastActive: Date;

}

/**
 * Database schema/collection
 */
const sandboxSchema = new Schema({
  user: Schema.Types.ObjectId,
  organization: Schema.Types.ObjectId,
  type: Schema.Types.Mixed,
  status: {
    type: String,
    enum: Object.keys(SandboxStatus)
  },
  terminatedAt: Date,
  lastActive: {
    type: Date,
    default: new Date()
  }
},
{
  timestamps: true,
  collection: 'creators_studio__sandboxes'
});

export type ISandbox = Document & Sandbox;
export const SandboxSchema = Db.connection.model<ISandbox>('SandboxSchema', sandboxSchema);