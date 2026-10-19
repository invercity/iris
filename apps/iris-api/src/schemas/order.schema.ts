import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import type { OrderStatus } from '@iris/shared';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ collection: 'orders', timestamps: false })
export class Order {
  @Prop({ default: Date.now })
  created: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client' })
  client: Types.ObjectId;

  @Prop({
    type: [
      {
        good: { type: MongooseSchema.Types.ObjectId, ref: 'Good' },
        count: { type: Number, default: 1 },
        priceAtOrder: { type: Number },
      },
    ],
    default: [],
  })
  items: Array<{
    good: Types.ObjectId;
    count: number;
    priceAtOrder?: number;
  }>;

  @Prop({ default: 1, index: true })
  code: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Place', default: null })
  place?: Types.ObjectId | null;

  @Prop({ default: '' })
  placeDescription: string;

  @Prop({ default: false })
  payed: boolean;

  @Prop({ type: String, default: 'work' })
  status: OrderStatus;

  @Prop({ default: 0 })
  credit: number;

  @Prop({ default: 0 })
  sale: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ default: 0 })
  extra: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', index: true })
  tenant?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
