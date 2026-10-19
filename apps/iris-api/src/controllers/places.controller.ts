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
import { Place, PlaceDocument } from '../schemas';
import { CurrentTenant, ResolvedTenant } from '../common/tenant.context';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Controller('api/places')
export class PlacesController {
  constructor(
    @InjectModel(Place.name) private readonly placeModel: Model<PlaceDocument>,
  ) {}

  @Get()
  async list(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '50',
    @Query('q') q = '',
  ) {
    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.min(9999, Math.max(1, Number(limitParam) || 50));

    const filter: Record<string, unknown> = {};
    if (tenant?._id) {
      filter.tenant = tenant._id;
    }

    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ name: regex }, { address: regex }];
    }

    const [items, count] = await Promise.all([
      this.placeModel
        .find(filter)
        .sort({ created: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'displayName')
        .lean()
        .exec(),
      this.placeModel.countDocuments(filter).exec(),
    ]);

    return { items, count, page, limit };
  }

  @Get(':placeId')
  async read(@Param('placeId') placeId: string) {
    if (!Types.ObjectId.isValid(placeId)) {
      throw new BadRequestException('ID is invalid');
    }
    const item = await this.placeModel.findById(placeId).lean().exec();
    if (!item) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return item;
  }

  @Post()
  async create(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Body() body: Partial<Place>,
  ) {
    const created = await this.placeModel.create({
      name: body.name?.trim() || '',
      address: body.address?.trim() || '',
      dates: body.dates || [],
      tenant: tenant?._id || body.tenant,
      user: tenant?.owner || body.user,
      created: new Date(),
    });
    return created;
  }

  @Put(':placeId')
  async update(
    @Param('placeId') placeId: string,
    @Body() body: Partial<Place>,
  ) {
    if (!Types.ObjectId.isValid(placeId)) {
      throw new BadRequestException('ID is invalid');
    }
    const updated = await this.placeModel
      .findByIdAndUpdate(
        placeId,
        {
          $set: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.address !== undefined ? { address: body.address } : {}),
            ...(body.dates !== undefined ? { dates: body.dates } : {}),
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return updated;
  }

  @Delete(':placeId')
  async remove(@Param('placeId') placeId: string) {
    if (!Types.ObjectId.isValid(placeId)) {
      throw new BadRequestException('ID is invalid');
    }
    const deleted = await this.placeModel.findByIdAndDelete(placeId).lean().exec();
    if (!deleted) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return deleted;
  }
}
