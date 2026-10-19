import type { CollectionConfig } from 'payload';
import { authenticated, assignAuthorHook } from '../access/roles';

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: {
    singular: {
      en: 'Customer',
      uk: 'Клієнт',
    },
    plural: {
      en: 'Customers',
      uk: 'Клієнти',
    },
  },
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'phone', 'defaultPlace', 'active'],
    group: {
      en: 'Customers & CRM',
      uk: 'Клієнти та CRM',
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
          index: true,
        },
        {
          name: 'lastName',
          label: {
            en: 'Last Name',
            uk: 'Прізвище',
          },
          type: 'text',
        },
      ],
    },
    {
      name: 'phone',
      label: {
        en: 'Phone Number',
        uk: 'Телефон',
      },
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'defaultPlace',
      label: {
        en: 'Default Pickup Place',
        uk: 'Місце отримання за замовчуванням',
      },
      type: 'relationship',
      relationTo: 'places',
    },
    {
      name: 'defaultAddress',
      label: {
        en: 'Default Address',
        uk: 'Адреса за замовчуванням',
      },
      type: 'text',
    },
    {
      name: 'active',
      label: {
        en: 'Active',
        uk: 'Активний',
      },
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
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
