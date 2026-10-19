import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { calculateOrderTotal, maskClientPhone, type OrderStatus } from '@iris/shared';
import {
  Order,
  OrderDocument,
  Good,
  GoodDocument,
  Client,
  ClientDocument,
} from '../schemas';
import { CounterService } from '../services/counter.service';
import { CurrentTenant, ResolvedTenant } from '../common/tenant.context';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractObjectId(val: unknown): Types.ObjectId | null {
  if (!val) return null;
  if (val instanceof Types.ObjectId) return val;
  if (typeof val === 'string' && Types.ObjectId.isValid(val)) {
    return new Types.ObjectId(val);
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as { _id?: unknown; id?: unknown };
    const idStr = obj._id || obj.id;
    if (typeof idStr === 'string' && Types.ObjectId.isValid(idStr)) {
      return new Types.ObjectId(idStr);
    }
    if (idStr instanceof Types.ObjectId) {
      return idStr;
    }
  }
  return null;
}

export interface SaveOrderBody {
  client?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    defaultPlace?: string;
  };
  items?: Array<{
    good: string | { _id: string; price?: number };
    count: number;
    priceAtOrder?: number;
  }>;
  place?: string | { _id: string } | null;
  placeDescription?: string;
  payed?: boolean;
  status?: OrderStatus;
  credit?: number;
  sale?: number;
  extra?: number;
  total?: number;
}

@Controller('api/orders')
export class OrdersController {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Good.name) private readonly goodModel: Model<GoodDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    private readonly counterService: CounterService,
  ) {}

  @Get()
  async list(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '20',
    @Query('q') q = '',
    @Query('good') good = '',
    @Query('place') place = '',
    @Query('client') client = '',
    @Query('status') status = '',
    @Query('payed') payed?: string,
  ) {
    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.min(9999, Math.max(1, Number(limitParam) || 20));

    const andConditions: Record<string, unknown>[] = [];
    if (tenant?._id) {
      andConditions.push({ tenant: tenant._id });
    }

    if (place && Types.ObjectId.isValid(place)) {
      andConditions.push({ place: new Types.ObjectId(place) });
    }
    if (client && Types.ObjectId.isValid(client)) {
      andConditions.push({ client: new Types.ObjectId(client) });
    }
    if (good && Types.ObjectId.isValid(good)) {
      andConditions.push({ 'items.good': new Types.ObjectId(good) });
    }
    if (status && status.trim()) {
      andConditions.push({ status: status.trim() });
    }
    if (payed === 'true' || payed === 'false') {
      andConditions.push({ payed: payed === 'true' });
    }

    if (q && q.trim()) {
      const orConditions: Record<string, unknown>[] = [];
      if (!Number.isNaN(Number(q))) {
        orConditions.push({ code: Number(q) });
      }
      if (q.trim().length > 2) {
        const regex = new RegExp(escapeRegex(q.trim()), 'i');
        const clientFilter: Record<string, unknown> = {
          $or: [{ firstName: regex }, { lastName: regex }, { phone: regex }],
        };
        if (tenant?._id) {
          clientFilter.tenant = tenant._id;
        }
        const matchedClients = await this.clientModel
          .find(clientFilter)
          .select('_id')
          .lean()
          .exec();
        if (matchedClients.length > 0) {
          orConditions.push({
            client: { $in: matchedClients.map((c) => c._id) },
          });
        }
      }
      if (orConditions.length > 0) {
        andConditions.push({ $or: orConditions });
      } else {
        // Query didn't match any code or client
        return { items: [], count: 0, page, limit };
      }
    }

    const queryFilter = andConditions.length > 0 ? { $and: andConditions } : {};

    const [items, count] = await Promise.all([
      this.orderModel
        .find(queryFilter)
        .sort({ created: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'displayName')
        .populate('client')
        .populate({
          path: 'items.good',
          populate: { path: 'images.image' },
        })
        .populate('place')
        .lean()
        .exec(),
      this.orderModel.countDocuments(queryFilter).exec(),
    ]);

    return { items, count, page, limit };
  }

  @Get(':orderId')
  async read(@Param('orderId') orderId: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('ID is invalid');
    }
    const order = await this.orderModel
      .findById(orderId)
      .populate('user', 'displayName')
      .populate('client')
      .populate({
        path: 'items.good',
        populate: { path: 'images.image' },
      })
      .populate('place')
      .lean()
      .exec();

    if (!order) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return order as unknown as Record<string, unknown>;
  }

  /**
   * Public order status preview (masks client phone number for unauthenticated viewers)
   */
  @Get(':orderId/public')
  async readPublic(@Param('orderId') orderId: string): Promise<Record<string, unknown>> {
    const order = await this.read(orderId);
    const clientObj = order.client as unknown as {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
    return {
      ...order,
      client: clientObj
        ? {
            ...clientObj,
            phone: maskClientPhone(clientObj.phone, false),
          }
        : undefined,
    };
  }

  @Post()
  async create(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Body() body: SaveOrderBody,
  ) {
    if (!body.items || body.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const placeId = extractObjectId(body.place);
    const clientId = await this.saveOrUpdateClient(body.client, placeId, tenant);
    const normalizedItems = body.items
      .map((item) => ({
        good: extractObjectId(item.good)!,
        count: Math.max(1, Number(item.count) || 1),
        priceAtOrder: item.priceAtOrder,
      }))
      .filter((i) => Boolean(i.good));

    const priceMap = await this.updateGoodsCountOnUpdateOrder(null, normalizedItems, false);
    const code = await this.counterService.getNextCode('Order', tenant?._id);

    const total = calculateOrderTotal(
      normalizedItems.map((i) => ({
        count: i.count,
        priceAtOrder: i.priceAtOrder ?? priceMap.get(i.good.toHexString()) ?? 0,
      })),
      {
        sale: Number(body.sale) || 0,
        credit: Number(body.credit) || 0,
        extra: Number(body.extra) || 0,
      },
    );

    const created = await this.orderModel.create({
      code,
      client: clientId,
      items: normalizedItems,
      place: placeId,
      placeDescription: body.placeDescription || '',
      payed: Boolean(body.payed),
      status: body.status || 'work',
      credit: Number(body.credit) || 0,
      sale: Number(body.sale) || 0,
      extra: Number(body.extra) || 0,
      total,
      tenant: tenant?._id,
      user: tenant?.owner,
      created: new Date(),
    });

    return this.read(created._id.toHexString());
  }

  @Put(':orderId')
  async update(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Param('orderId') orderId: string,
    @Body() body: SaveOrderBody,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('ID is invalid');
    }

    const existingOrder = await this.orderModel.findById(orderId).lean().exec();
    if (!existingOrder) {
      throw new NotFoundException('No item with that identifier has been found');
    }

    const placeId =
      body.place !== undefined ? extractObjectId(body.place) : existingOrder.place || null;
    const clientId = body.client
      ? await this.saveOrUpdateClient(body.client, placeId, tenant)
      : existingOrder.client;

    const normalizedItems = body.items
      ? body.items
          .map((item) => ({
            good: extractObjectId(item.good)!,
            count: Math.max(1, Number(item.count) || 1),
            priceAtOrder: item.priceAtOrder,
          }))
          .filter((i) => Boolean(i.good))
      : existingOrder.items.map((item) => ({
          good: extractObjectId(item.good)!,
          count: item.count,
          priceAtOrder: item.priceAtOrder,
        }));

    const priceMap = await this.updateGoodsCountOnUpdateOrder(
      existingOrder.items,
      normalizedItems,
      false,
    );

    const sale = body.sale !== undefined ? Number(body.sale) : existingOrder.sale;
    const credit = body.credit !== undefined ? Number(body.credit) : existingOrder.credit;
    const extra = body.extra !== undefined ? Number(body.extra) : existingOrder.extra;

    const total = calculateOrderTotal(
      normalizedItems.map((i) => ({
        count: i.count,
        priceAtOrder: i.priceAtOrder ?? priceMap.get(i.good.toHexString()) ?? 0,
      })),
      { sale, credit, extra },
    );

    await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          $set: {
            client: clientId,
            items: normalizedItems,
            place: placeId,
            placeDescription:
              body.placeDescription !== undefined
                ? body.placeDescription
                : existingOrder.placeDescription,
            payed: body.payed !== undefined ? Boolean(body.payed) : existingOrder.payed,
            status: body.status || existingOrder.status,
            sale,
            credit,
            extra,
            total,
          },
        },
        { new: true },
      )
      .exec();

    return this.read(orderId);
  }

  @Delete(':orderId')
  async remove(@Param('orderId') orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('ID is invalid');
    }
    const existingOrder = await this.orderModel.findById(orderId).lean().exec();
    if (!existingOrder) {
      throw new NotFoundException('No item with that identifier has been found');
    }

    // Legacy rule: only restore stock if the order was NOT paid yet
    if (!existingOrder.payed) {
      await this.updateGoodsCountOnUpdateOrder(existingOrder.items, [], true);
    }

    const deleted = await this.orderModel.findByIdAndDelete(orderId).lean().exec();
    return deleted;
  }

  /**
   * Matches legacy `saveClient` behavior:
   * - Creates a new Client if `_id` is not provided (or looks up existing client by phone in current tenant)
   * - Updates phone, `defaultPlace`, and `active: true` if `_id` is provided
   */
  private async saveOrUpdateClient(
    clientInput: SaveOrderBody['client'],
    placeId: Types.ObjectId | null,
    tenant: ResolvedTenant | null,
  ): Promise<Types.ObjectId> {
    if (!clientInput) {
      throw new BadRequestException('Client details are required');
    }

    const existingId = extractObjectId(clientInput._id);
    if (existingId) {
      await this.clientModel
        .updateOne(
          { _id: existingId },
          {
            $set: {
              ...(clientInput.phone ? { phone: clientInput.phone.trim() } : {}),
              ...(placeId ? { defaultPlace: placeId } : {}),
              active: true,
            },
          },
        )
        .exec();
      return existingId;
    }

    const phone = (clientInput.phone || '').trim();
    if (phone) {
      const existingByPhone = await this.clientModel
        .findOne({
          phone,
          ...(tenant?._id ? { tenant: tenant._id } : {}),
        })
        .exec();

      if (existingByPhone) {
        existingByPhone.firstName = clientInput.firstName?.trim() || existingByPhone.firstName;
        existingByPhone.lastName = clientInput.lastName?.trim() || existingByPhone.lastName;
        if (placeId) existingByPhone.defaultPlace = placeId;
        existingByPhone.active = true;
        await existingByPhone.save();
        return existingByPhone._id;
      }
    }

    const createdClient = await this.clientModel.create({
      firstName: clientInput.firstName?.trim() || 'Клієнт',
      lastName: clientInput.lastName?.trim() || '',
      phone,
      defaultPlace: placeId,
      active: true,
      tenant: tenant?._id,
      user: tenant?.owner,
      created: new Date(),
    });

    return createdClient._id;
  }

  /**
   * Matches legacy `updateGoodsCountOnUpdateOrder`:
   * Adjusts `Good.count` when orders are created, modified, or deleted.
   */
  private async updateGoodsCountOnUpdateOrder(
    beforeItems: Array<{ good: Types.ObjectId; count: number }> | null,
    afterItems: Array<{ good: Types.ObjectId; count: number }>,
    _isDelete: boolean,
  ): Promise<Map<string, number>> {
    const oldList = beforeItems || [];
    const newList = afterItems || [];

    const allIds = Array.from(
      new Set([
        ...oldList.map((i) => extractObjectId(i.good)?.toHexString()),
        ...newList.map((i) => extractObjectId(i.good)?.toHexString()),
      ]),
    ).filter((id): id is string => Boolean(id));

    const priceMap = new Map<string, number>();
    if (allIds.length === 0) return priceMap;

    const goods = await this.goodModel
      .find({ _id: { $in: allIds.map((id) => new Types.ObjectId(id)) } })
      .exec();

    await Promise.all(
      goods.map(async (good) => {
        const goodIdHex = good._id.toHexString();
        priceMap.set(goodIdHex, good.price);

        const before = oldList.find(
          (i) => extractObjectId(i.good)?.toHexString() === goodIdHex,
        );
        const after = newList.find(
          (i) => extractObjectId(i.good)?.toHexString() === goodIdHex,
        );

        let nextCount = good.count;
        if (before && after) {
          if (before.count === after.count) return;
          nextCount += before.count - after.count;
        } else if (!before && after) {
          nextCount -= after.count;
        } else if (before && !after) {
          nextCount += before.count;
        }

        await this.goodModel
          .updateOne({ _id: good._id }, { $set: { count: Math.max(0, nextCount) } })
          .exec();
      }),
    );

    return priceMap;
  }
}
