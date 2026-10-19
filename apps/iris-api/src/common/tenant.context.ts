import {
  Injectable,
  NestMiddleware,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import { resolveTenantSlugFromHostname, normalizeTenantSlug } from '@iris/shared';
import { Tenant, TenantDocument } from '../schemas';

export interface ResolvedTenant {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  domain?: string;
  currency: string;
  owner?: Types.ObjectId;
}

export interface TenantRequest extends Request {
  tenant?: ResolvedTenant | null;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      const headerTenantId = req.headers['x-tenant-id'];
      const headerTenantSlug = req.headers['x-tenant-slug'];
      const queryTenant = typeof req.query.tenant === 'string' ? req.query.tenant : undefined;

      // 1. Check explicit tenant ObjectId header
      if (typeof headerTenantId === 'string' && Types.ObjectId.isValid(headerTenantId)) {
        const tenant = await this.tenantModel
          .findOne({ _id: new Types.ObjectId(headerTenantId), active: true })
          .lean()
          .exec();
        if (tenant) {
          req.tenant = tenant as unknown as ResolvedTenant;
          return next();
        }
      }

      // 2. Determine slug from header, query, Origin, or Host header (e.g. vitaly.homee.ua)
      const baseDomain = process.env.BASE_DOMAIN || 'homee.ua';
      let slug: string | null = null;

      if (typeof headerTenantSlug === 'string' && headerTenantSlug.trim()) {
        slug = normalizeTenantSlug(headerTenantSlug);
      } else if (queryTenant && queryTenant.trim()) {
        slug = normalizeTenantSlug(queryTenant);
      } else {
        const originHeader = req.headers.origin;
        if (typeof originHeader === 'string') {
          try {
            const originHost = new URL(originHeader).hostname;
            slug = resolveTenantSlugFromHostname(originHost, baseDomain);
          } catch {
            // Ignore invalid origin URL
          }
        }
        if (!slug && req.headers.host) {
          slug = resolveTenantSlugFromHostname(req.headers.host, baseDomain);
        }
      }

      if (slug) {
        const tenant = await this.tenantModel
          .findOne({
            $or: [{ slug }, { domain: req.headers.host?.split(':')[0]?.toLowerCase() }],
            active: true,
          })
          .lean()
          .exec();

        if (tenant) {
          req.tenant = tenant as unknown as ResolvedTenant;
        }
      }
    } catch {
      // Proceed without tenant if lookup fails
    }

    next();
  }
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ResolvedTenant | null => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    return request.tenant || null;
  },
);
