import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { normalizeTenantSlug } from '@iris/shared';
import { Tenant, TenantDocument } from '../schemas';
import { CurrentTenant, ResolvedTenant } from '../common/tenant.context';

@Controller('api/tenants')
export class TenantsController {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  @Get()
  async list() {
    const items = await this.tenantModel
      .find({ active: true })
      .populate('logo')
      .sort({ name: 1 })
      .lean()
      .exec();

    return {
      items,
      count: items.length,
    };
  }

  @Get('current')
  async getCurrent(@CurrentTenant() tenant: ResolvedTenant | null) {
    if (tenant) {
      const fullTenant = await this.tenantModel
        .findById(tenant._id)
        .populate('logo')
        .lean()
        .exec();
      if (fullTenant) return fullTenant;
    }

    // Fallback: return first active tenant if no subdomain/header was specified
    const firstTenant = await this.tenantModel
      .findOne({ active: true })
      .populate('logo')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return firstTenant || null;
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const cleanSlug = normalizeTenantSlug(slug);
    const tenant = await this.tenantModel
      .findOne({ slug: cleanSlug, active: true })
      .populate('logo')
      .lean()
      .exec();

    if (!tenant) {
      throw new NotFoundException(`Магазин "${cleanSlug}" не знайдено`);
    }

    return tenant;
  }
}
