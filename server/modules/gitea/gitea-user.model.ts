import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, IsBoolean, Min, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';



@JSONSchema({ description: 'GiteaSSH' })
export class GiteaSSH {

  @IsString()
  publicKey: string;

  @IsString()
  privateKey: string;

}

@JSONSchema({ description: 'GiteaUser' })
export class GiteaUser {

  @IsMongoId()
  _id: string;

  @IsMongoId()
  user: string;

  @IsMongoId()
  organization: string;

  @ValidateNested()
  ssh: GiteaSSH;

  @IsString()
  username: string;

  @IsNumber()
  giteaId: number;
}

/**
 * Database schema/collection
 */
const giteaUserSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    sparse: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    sparse: true
  },
  ssh: {
    publicKey: String,
    privateKey: String
  },
  username: String,
  giteaId: Number
},
{
  timestamps: true,
  collection: 'creators_studio__gitea_users'
});

export type IGiteaUser = Document & GiteaUser;
export const GiteaUserSchema = Db.connection.model<IGiteaUser>('GiteaUserSchema', giteaUserSchema);