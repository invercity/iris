import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ collection: 'tenants', timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ trim: true, index: true })
  domain?: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ default: '₴', trim: true })
  currency: string;

  @Prop({ default: '', trim: true })
  phone: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  logo?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  owner?: Types.ObjectId;

  @Prop({ default: true })
  active: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
