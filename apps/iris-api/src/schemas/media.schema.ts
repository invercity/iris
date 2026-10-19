import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ collection: 'media', timestamps: true })
export class Media {
  @Prop({ required: true, trim: true })
  alt: string;

  @Prop({ trim: true })
  url: string;

  @Prop({ trim: true })
  filename: string;

  @Prop()
  mimeType?: string;

  @Prop()
  filesize?: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  sizes?: Record<string, { url?: string; width?: number; height?: number; filename?: string }>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', index: true })
  tenant?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
