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
import { Good, GoodDocument } from '../schemas';
import { CounterService } from '../services/counter.service';
import { CurrentTenant, ResolvedTenant } from '../common/tenant.context';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Controller('api/goods')
export class GoodsController {
  constructor(
    @InjectModel(Good.name) private readonly goodModel: Model<GoodDocument>,
    private readonly counterService: CounterService,
  ) {}

  @Get()
  async list(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '20',
    @Query('q') q = '',
    @Query('type') type = '',
    @Query('excludeEmpty') excludeEmpty = '',
  ) {
    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.min(9999, Math.max(1, Number(limitParam) || 20));

    const filter: Record<string, unknown> = {};
    if (tenant?._id) {
      filter.tenant = tenant._id;
    }

    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      const orConditions: Record<string, unknown>[] = [
        { name: regex },
        { details: regex },
        { type: regex },
        { country: regex },
      ];
      if (!Number.isNaN(Number(q))) {
        orConditions.push({ code: Number(q) });
      }
      filter.$or = orConditions;
    }

    if (type && type.trim()) {
      filter.type = type.trim();
    }

    if (excludeEmpty === 'true' || excludeEmpty === '1') {
      filter.count = { $gt: 0 };
    }

    const [items, count] = await Promise.all([
      this.goodModel
        .find(filter)
        .sort({ created: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'displayName username')
        .populate('images.image')
        .lean()
        .exec(),
      this.goodModel.countDocuments(filter).exec(),
    ]);

    return { items, count, page, limit };
  }

  @Get(':goodId')
  async read(@Param('goodId') goodId: string) {
    if (!Types.ObjectId.isValid(goodId)) {
      throw new BadRequestException('ID is invalid');
    }
    const item = await this.goodModel
      .findById(goodId)
      .populate('user', 'displayName username')
      .populate('images.image')
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return item;
  }

  @Post()
  async create(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Body() body: Partial<Good>,
  ) {
    if (!body.name || !body.name.trim()) {
      throw new BadRequestException('Name cannot be blank');
    }
    const code = await this.counterService.getNextCode('Good', tenant?._id);

    const created = await this.goodModel.create({
      name: body.name.trim(),
      details: body.details?.trim() || '',
      price: Number(body.price) || 1,
      count: Number(body.count) ?? 1,
      weight: Number(body.weight) || 1,
      unit: body.unit || 'шт',
      country: body.country?.trim() || '',
      type: body.type?.trim() || '',
      images: body.images || [],
      isPublished: body.isPublished ?? true,
      code,
      tenant: tenant?._id || body.tenant,
      user: tenant?.owner || body.user,
      created: new Date(),
    });

    return created;
  }

  @Put(':goodId')
  async update(
    @Param('goodId') goodId: string,
    @Body() body: Partial<Good>,
  ) {
    if (!Types.ObjectId.isValid(goodId)) {
      throw new BadRequestException('ID is invalid');
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields: (keyof Good)[] = [
      'name',
      'details',
      'price',
      'count',
      'weight',
      'unit',
      'country',
      'type',
      'images',
      'isPublished',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await this.goodModel
      .findByIdAndUpdate(goodId, { $set: updateData }, { new: true })
      .populate('images.image')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return updated;
  }

  @Delete(':goodId')
  async remove(@Param('goodId') goodId: string) {
    if (!Types.ObjectId.isValid(goodId)) {
      throw new BadRequestException('ID is invalid');
    }
    const deleted = await this.goodModel.findByIdAndDelete(goodId).lean().exec();
    if (!deleted) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return deleted;
  }
}
