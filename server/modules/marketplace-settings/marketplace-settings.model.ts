import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';


export enum PricingType {
  MONTHLY = 'MONTHLY',
  ONE_TIME = 'ONE_TIME'
}


@JSONSchema({ description: 'File item' })
export class FileItem {

  @IsMongoId()
  _id: string;

  @IsNumber()
  size: number;

  @IsOptional()
  @IsDateString()
  createdAt: string;

  @IsString()
  filename: string;

  @IsString()
  @IsOptional()
  mimetype: string;

  @IsString()
  @IsOptional()
  url: string;
}

@JSONSchema({ description: 'Node styling' })
export class NodeStyling {

  @IsMongoId()
  _id: string;

  @ValidateNested()
  @Type(() => FileItem)
  logo: FileItem;

  @IsString()
  @IsOptional()
  backgroundColor: string;

  @IsString()
  @IsOptional()
  borderColor: string;
}


@JSONSchema({ description: 'MarketplaceSettings' })
export class MarketplaceSettings {


  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  urlName: string;

  @IsMongoId()
  category: any;

  @IsOptional()
  @IsMongoId()
  project: any;

  @IsOptional()
  @IsMongoId()
  provisionalNode: any;

  @IsBoolean()
  enableSale: boolean;

  @IsEnum(PricingType)
  pricingType: PricingType;

  @IsNumber()
  price: number;

  @Type(() => FileItem)
  @ValidateNested({ each: true })
  images: FileItem[];

  @ValidateNested()
  @Type(() => FileItem)
  titleImage: FileItem;

  @IsOptional()
  @ValidateNested()
  @Type(() => NodeStyling)
  nodeStyling: NodeStyling;
}

const FileSchema = new Schema({
  type: {
    type: String,
    enum: ['SALES_DOCUMENT', 'OTHER'],
    default: 'OTHER'
  },
  size: Number,
  mimetype: String,
  filename: String,
  createdAt: Date,
  url: String
});

/**
 * Database schema/collection
 */
const marketplaceSettingsSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 512
  },
  description: {
    type: String,
    required: false,
    maxlength: 512
  },
  urlName: String,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  provisionalNode: {
    type: Schema.Types.ObjectId,
    ref: 'Node'
  },
  enableSale: {
    type: Boolean,
    default: false
  },
  pricingType: {
    type: String,
    enum: Object.keys(PricingType),
    default: PricingType.ONE_TIME
  },
  price: {
    type: Number,
    default: 0
  },
  titleImage: FileSchema,
  images: [FileSchema],
  nodeStyling: {
    logo: FileSchema,
    backgroundColor: {
      type: String,
      default: '#2b2b2b'
    },
    borderColor: {
      type: String,
      default: 'transparent'
    }
  }
},
{
  timestamps: true,
  collection: 'creators_studio__marketplace_settings'
});


export type IMarketplaceSettings = Document & MarketplaceSettings;
export const MarketplaceSettingsSchema = Db.connection.model<IMarketplaceSettings>('MarketplaceSettings', marketplaceSettingsSchema);
