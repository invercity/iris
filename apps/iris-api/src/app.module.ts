import path from 'path';
import dotenv from 'dotenv';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Tenant,
  TenantSchema,
  User,
  UserSchema,
  Media,
  MediaSchema,
  Good,
  GoodSchema,
  Place,
  PlaceSchema,
  Client,
  ClientSchema,
  Order,
  OrderSchema,
  Counter,
  CounterSchema,
} from './schemas';
import { TenantMiddleware } from './common/tenant.context';
import { CounterService } from './services/counter.service';
import { TenantsController } from './controllers/tenants.controller';
import { GoodsController } from './controllers/goods.controller';
import { PlacesController } from './controllers/places.controller';
import { ClientsController } from './controllers/clients.controller';
import { OrdersController } from './controllers/orders.controller';

// Load root .env.local and .env files
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const mongoUri =
  process.env.DATABASE_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://127.0.0.1:27017/mean-dev';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: Good.name, schema: GoodSchema },
      { name: Place.name, schema: PlaceSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [
    TenantsController,
    GoodsController,
    PlacesController,
    ClientsController,
    OrdersController,
  ],
  providers: [CounterService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
