import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ClientDocument = HydratedDocument<Client>;

@Schema({ collection: 'clients', timestamps: false })
export class Client {
  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: '', trim: true })
  firstName: string;

  @Prop({ default: '', trim: true })
  lastName: string;

  @Prop({ default: '', trim: true, index: true })
  phone: string;

  @Prop({ default: '', trim: true })
  defaultAddress: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Place', default: null })
  defaultPlace?: Types.ObjectId | null;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', index: true })
  tenant?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
