import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({ collection: 'identitycounters', timestamps: false })
export class Counter {
  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  field: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', default: null })
  tenant?: Types.ObjectId | null;

  @Prop({ default: 0 })
  count: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
