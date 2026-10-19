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
import { Client, ClientDocument } from '../schemas';
import { CurrentTenant, ResolvedTenant } from '../common/tenant.context';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Controller('api/clients')
export class ClientsController {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
  ) {}

  @Get()
  async list(
    @CurrentTenant() tenant: ResolvedTenant | null,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '20',
    @Query('q') q = '',
  ) {
    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.min(9999, Math.max(1, Number(limitParam) || 20));

    const filter: Record<string, unknown> = {};
    if (tenant?._id) {
      filter.tenant = tenant._id;
    }

    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ phone: regex }, { firstName: regex }, { lastName: regex }];
    }

    const [items, count] = await Promise.all([
      this.clientModel
        .find(filter)
        .sort({ created: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('defaultPlace')
        .populate('user', 'displayName')
        .lean()
        .exec(),
      this.clientModel.countDocuments(filter).exec(),
    ]);

    return { items, count, page, limit };
  }

  @Get(':clientId')
  async read(@Param('clientId') clientId: string) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('ID is invalid');
    }
    const item = await this.clientModel
      .findById(clientId)
      .populate('defaultPlace')
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
    @Body() body: Partial<Client>,
  ) {
    const created = await this.clientModel.create({
      firstName: body.firstName?.trim() || '',
      lastName: body.lastName?.trim() || '',
      phone: body.phone?.trim() || '',
      defaultAddress: body.defaultAddress?.trim() || '',
      defaultPlace: body.defaultPlace || null,
      active: body.active ?? true,
      tenant: tenant?._id || body.tenant,
      user: tenant?.owner || body.user,
      created: new Date(),
    });
    return created;
  }

  @Put(':clientId')
  async update(
    @Param('clientId') clientId: string,
    @Body() body: Partial<Client>,
  ) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('ID is invalid');
    }
    const updated = await this.clientModel
      .findByIdAndUpdate(
        clientId,
        {
          $set: {
            firstName: body.firstName ?? '',
            lastName: body.lastName ?? '',
            phone: body.phone ?? '',
            defaultPlace: body.defaultPlace || null,
            active: true,
          },
        },
        { new: true },
      )
      .populate('defaultPlace')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return updated;
  }

  @Delete(':clientId')
  async remove(@Param('clientId') clientId: string) {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('ID is invalid');
    }
    const deleted = await this.clientModel.findByIdAndDelete(clientId).lean().exec();
    if (!deleted) {
      throw new NotFoundException('No item with that identifier has been found');
    }
    return deleted;
  }
}
