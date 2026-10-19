import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type GoodDocument = HydratedDocument<Good>;

@Schema({ collection: 'goods', timestamps: false })
export class Good {
  @Prop({ default: Date.now })
  created: Date;

  @Prop({ required: true, trim: true, default: '' })
  name: string;

  @Prop({ default: '', trim: true })
  details: string;

  @Prop({ default: 1, index: true })
  code: number;

  @Prop({ default: 1 })
  count: number;

  @Prop({ default: 1 })
  price: number;

  @Prop({ default: 1 })
  weight: number;

  @Prop({ default: 'шт', trim: true })
  unit: string;

  @Prop({ default: '', trim: true })
  country: string;

  @Prop({ default: '', trim: true, index: true })
  type: string;

  @Prop({
    type: [
      {
        image: { type: MongooseSchema.Types.ObjectId, ref: 'Media' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  images: Array<{ image: Types.ObjectId; isPrimary?: boolean }>;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', index: true })
  tenant?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;
}

export const GoodSchema = SchemaFactory.createForClass(Good);
