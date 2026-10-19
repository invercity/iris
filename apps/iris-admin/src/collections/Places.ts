import type { CollectionConfig } from 'payload';
import { authenticated, assignAuthorHook } from '../access/roles';

export const Places: CollectionConfig = {
  slug: 'places',
  labels: {
    singular: {
      en: 'Pickup Location',
      uk: 'Місце видачі',
    },
    plural: {
      en: 'Pickup Locations',
      uk: 'Місця видачі',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address', 'created'],
    group: {
      en: 'Settings & Logistics',
      uk: 'Налаштування та логістика',
    },
  },
  // Tenant constraint is added on top of these by @payloadcms/plugin-multi-tenant
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeChange: [assignAuthorHook],
  },
  fields: [
    {
      name: 'name',
      label: {
        en: 'Location Name',
        uk: 'Назва місця видачі',
      },
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'address',
      label: {
        en: 'Physical Address',
        uk: 'Адреса',
      },
      type: 'text',
    },
    {
      name: 'dates',
      label: {
        en: 'Pickup Schedule Dates',
        uk: 'Дати видачі / доставки (Legacy Date Array)',
      },
      type: 'json',
      admin: {
        description: 'ISO dates array for delivery schedule',
      },
    },
    {
      name: 'user',
      label: {
        en: 'Created by (User)',
        uk: 'Створив (Користувач)',
      },
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'created',
      label: {
        en: 'Created Date',
        uk: 'Дата створення',
      },
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
};
