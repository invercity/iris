import type { CollectionConfig } from 'payload';
import { normalizeTenantSlug } from '@iris/shared';
import {
  isSuperAdmin,
  hiddenForTenantUsers,
  superAdminOnly,
  superAdminFieldAccess,
} from '../access/roles';

/**
 * Users. Only platform super-admins manage users in the global admin.
 * Tenant users can still edit their own profile via the "Account" page
 * but cannot change their roles or tenant assignments.
 *
 * The `tenants` array field (tenant + per-tenant roles) is added by the
 * multi-tenant plugin (see payload.config.ts → tenantsArrayField).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: {
      en: 'User',
      uk: 'Користувач',
    },
    plural: {
      en: 'Users',
      uk: 'Користувачі',
    },
  },
  auth: {
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: true,
      requireUsername: true,
    },
  },
  admin: {
    useAsTitle: 'username',
    defaultColumns: ['username', 'displayName', 'email', 'roles'],
    group: {
      en: 'Platform',
      uk: 'Платформа',
    },
    hidden: hiddenForTenantUsers,
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isSuperAdmin(user)) return true;
      return { id: { equals: user.id } };
    },
    create: superAdminOnly,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isSuperAdmin(user)) return true;
      return { id: { equals: user.id } };
    },
    delete: superAdminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.displayName && (data.firstName || data.lastName)) {
          data.displayName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
        }
        return data;
      },
    ],
    afterChange: [
      // Every new store owner gets their own tenant bound to their username
      async ({ doc, req, operation }) => {
        const isAdmin = Array.isArray(doc.roles) && doc.roles.includes('admin');
        const hasTenants = Array.isArray(doc.tenants) && doc.tenants.length > 0;
        if (operation !== 'create' || isAdmin || hasTenants || !doc.username) {
          return doc;
        }

        const slug = normalizeTenantSlug(doc.username);
        const baseDomain = process.env.BASE_DOMAIN || 'homee.ua';
        const existing = await req.payload.find({
          collection: 'tenants',
          where: { slug: { equals: slug } },
          limit: 1,
          overrideAccess: true,
          req,
        });

        const tenant =
          existing.docs[0] ||
          (await req.payload.create({
            collection: 'tenants',
            data: {
              name: doc.displayName || `Store ${doc.username}`,
              slug,
              domain: `${slug}.${baseDomain}`,
              currency: '₴',
              owner: doc.id,
              active: true,
            },
            overrideAccess: true,
            req,
          }));

        await req.payload.update({
          collection: 'users',
          id: doc.id,
          data: {
            tenants: [{ tenant: tenant.id, roles: ['owner'] }],
          },
          overrideAccess: true,
          req,
        });

        return doc;
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          label: {
            en: 'First Name',
            uk: "Ім'я",
          },
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          label: {
            en: 'Last Name',
            uk: 'Прізвище',
          },
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'displayName',
      label: {
        en: 'Display Name',
        uk: "Відображуване ім'я",
      },
      type: 'text',
    },
    {
      name: 'roles',
      label: {
        en: 'System Roles',
        uk: 'Системні ролі',
      },
      type: 'select',
      hasMany: true,
      defaultValue: ['user'],
      required: true,
      saveToJWT: true,
      access: {
        // Prevent privilege escalation: tenant users cannot grant themselves `admin`
        create: superAdminFieldAccess,
        update: superAdminFieldAccess,
      },
      options: [
        { label: { en: 'Store Owner / Manager', uk: 'Власник / менеджер магазину' }, value: 'user' },
        { label: { en: 'Platform Super-Admin', uk: 'Адміністратор платформи' }, value: 'admin' },
      ],
    },
    {
      name: 'profileImageURL',
      label: {
        en: 'Avatar URL (legacy)',
        uk: 'URL аватара (legacy)',
      },
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'provider',
      type: 'text',
      defaultValue: 'local',
      admin: {
        hidden: true,
      },
    },
  ],
};
