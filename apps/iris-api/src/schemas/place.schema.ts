import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PlaceDocument = HydratedDocument<Place>;

@Schema({ collection: 'places', timestamps: false })
export class Place {
  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: '', trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ type: [Date], default: [] })
  dates: Date[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', index: true })
  tenant?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;
}

export const PlaceSchema = SchemaFactory.createForClass(Place);
