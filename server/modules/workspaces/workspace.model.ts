import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray } from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';

@JSONSchema({ description: 'Workspace' })
export class Workspace {

  @IsMongoId()
  _id: string;

  @IsMongoId()
  user: string;

  @IsMongoId()
  @IsOptional()
  organization: string;

  @IsMongoId()
  @IsOptional()
  sandbox: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  projects: Array<string>;

  @IsDateString()
  lastOpened: Date;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

}

/**
 * Database schema/collection
 */
const workspaceSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 512
  },
  description: {
    type: String,
    maxlength: 2048
  },

  user: Schema.Types.ObjectId,
  organization: Schema.Types.ObjectId,

  projects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    }
  ],
  lastOpened: {
    type: Date,
    default: Date.now
  },
},
{
  timestamps: true,
  collection: 'creators_studio__workspaces'
});

workspaceSchema.pre('save', function(next, done) {
  const self = this as any;
  Db.connection.models['Workspace'].findOne({ organization: self.organization, user: self.user, name: self.name, _id: { $ne: self._id } }, function(err, workspace) {
      if (err) {
         return next(err);
      } else if (workspace) {
          self.invalidate('name', 'Name must be unique per organization or user');
          return next(new Error('Name must be unique per organization or user'));
      }
      next();
  });
});

export type IWorkspace = Document & Workspace;
export const WorkspaceSchema = Db.connection.model<IWorkspace>('Workspace', workspaceSchema);