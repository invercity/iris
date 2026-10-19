import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: false })
export class User {
  @Prop({ default: '', trim: true })
  firstName: string;

  @Prop({ default: '', trim: true })
  lastName: string;

  @Prop({ default: '', trim: true })
  displayName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ default: '' })
  password?: string;

  @Prop()
  salt?: string;

  @Prop()
  hash?: string;

  @Prop({ default: 'modules/users/client/img/profile/default.png' })
  profileImageURL: string;

  @Prop({ default: 'local' })
  provider: string;

  @Prop({ type: [String], enum: ['user', 'admin'], default: ['user'] })
  roles: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant', index: true })
  defaultTenant?: Types.ObjectId;

  @Prop({
    type: [
      {
        tenant: { type: MongooseSchema.Types.ObjectId, ref: 'Tenant' },
        roles: [{ type: String, enum: ['owner', 'manager'] }],
      },
    ],
    default: [],
  })
  tenants: Array<{ tenant: Types.ObjectId; roles: string[] }>;

  @Prop({ default: Date.now })
  created: Date;

  @Prop()
  updated?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
