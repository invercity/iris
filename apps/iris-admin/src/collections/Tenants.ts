import type { CollectionConfig } from 'payload';
import { normalizeTenantSlug } from '@iris/shared';
import { authenticated, hiddenForTenantUsers, superAdminOnly } from '../access/roles';

/**
 * Tenants (stores). Managed only by platform super-admins in the global admin.
 * Tenant users never see this collection in the nav; read access is still granted
 * (scoped to their own tenants by the multi-tenant plugin) so the tenant selector works.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: {
    singular: {
      en: 'Store (Tenant)',
      uk: 'Магазин (Тенант)',
    },
    plural: {
      en: 'Stores (Tenants)',
      uk: 'Магазини (Тенанти)',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'domain', 'currency', 'active'],
    group: {
      en: 'Platform',
      uk: 'Платформа',
    },
    hidden: hiddenForTenantUsers,
  },
  access: {
    read: authenticated,
    create: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.slug) {
          data.slug = normalizeTenantSlug(data.slug);
        } else if (data?.name) {
          data.slug = normalizeTenantSlug(data.name);
        }
        if (data?.slug && !data?.domain) {
          const baseDomain = process.env.BASE_DOMAIN || 'homee.ua';
          data.domain = `${data.slug}.${baseDomain}`;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'name',
      label: {
        en: 'Store Name',
        uk: 'Назва магазину',
      },
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: {
        en: 'Subdomain Slug (e.g. vitaly for vitaly.homee.ua)',
        uk: 'Код магазину / префікс піддомену (напр. vitaly для vitaly.homee.ua)',
      },
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'domain',
      label: {
        en: 'Full Domain (e.g. vitaly.homee.ua)',
        uk: 'Повна адреса піддомену або власний домен (напр. vitaly.homee.ua)',
      },
      type: 'text',
      index: true,
    },
    {
      name: 'description',
      label: {
        en: 'Store Description',
        uk: 'Опис магазину',
      },
      type: 'textarea',
    },
    {
      name: 'currency',
      label: {
        en: 'Currency',
        uk: 'Валюта',
      },
      type: 'text',
      defaultValue: '₴',
      required: true,
    },
    {
      name: 'phone',
      label: {
        en: 'Store Contact Phone',
        uk: 'Контактний телефон магазину',
      },
      type: 'text',
    },
    {
      name: 'logo',
      label: {
        en: 'Store Logo',
        uk: 'Логотип магазину',
      },
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'owner',
      label: {
        en: 'Store Owner (User)',
        uk: 'Власник (Користувач)',
      },
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'active',
      label: {
        en: 'Active',
        uk: 'Активний',
      },
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
