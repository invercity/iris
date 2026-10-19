import type { Access, CollectionBeforeChangeHook, FieldAccess } from 'payload';

export interface AuthUser {
  id: string;
  roles?: string[];
  tenants?: Array<{
    tenant: string | { id?: string; _id?: string };
    roles?: string[];
  }>;
}

/**
 * Platform super-admin: has `admin` system role.
 * Sees the global admin (Tenants, Users) and can switch between all tenants.
 */
export function isSuperAdmin(user?: unknown): boolean {
  const u = user as AuthUser | null | undefined;
  return Boolean(u && Array.isArray(u.roles) && u.roles.includes('admin'));
}

export function extractId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object') {
    const obj = ref as { id?: string; _id?: string };
    return obj.id || obj._id || null;
  }
  return null;
}

/** Any logged-in user. Tenant scoping is applied on top by @payloadcms/plugin-multi-tenant. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/** Public read. For non-super-admin users the plugin still adds the tenant constraint. */
export const anyone: Access = () => true;

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user);

export const superAdminFieldAccess: FieldAccess = ({ req: { user } }) => isSuperAdmin(user);

/** Hide a collection from the admin nav for everyone except platform super-admins */
export const hiddenForTenantUsers = ({ user }: { user: unknown }): boolean => !isSuperAdmin(user);

/** Stamps the author (`user`) on create. The `tenant` is assigned by the multi-tenant plugin. */
export const assignAuthorHook: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' && req.user && !data.user) {
    data.user = req.user.id;
  }
  if (operation === 'create' && !data.created) {
    data.created = new Date().toISOString();
  }
  return data;
};

/**
 * Returns next sequential `code` for a collection, scoped per tenant
 * (each store has its own order/good numbering).
 */
export async function getNextTenantCode(
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  collection: 'goods' | 'orders',
  tenant: unknown,
): Promise<number> {
  const tenantId = extractId(tenant);
  const latest = await req.payload.find({
    collection,
    where: tenantId ? { tenant: { equals: tenantId } } : {},
    sort: '-code',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });
  return (Number(latest.docs[0]?.code) || 0) + 1;
}
