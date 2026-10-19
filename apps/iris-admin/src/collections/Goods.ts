import type { CollectionConfig } from 'payload';
import { authenticated, assignAuthorHook, getNextTenantCode } from '../access/roles';

export const Goods: CollectionConfig = {
  slug: 'goods',
  labels: {
    singular: {
      en: 'Product',
      uk: 'Товар',
    },
    plural: {
      en: 'Products',
      uk: 'Товари',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'price', 'count', 'type', 'isPublished'],
    group: {
      en: 'Catalog',
      uk: 'Каталог',
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
    beforeChange: [
      assignAuthorHook,
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.code) {
          data.code = await getNextTenantCode(req, 'goods', data.tenant);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          label: {
            en: 'Product Name',
            uk: 'Назва товару',
          },
          type: 'text',
          required: true,
          index: true,
        },
        {
          name: 'code',
          label: {
            en: 'Product Code (#)',
            uk: 'Код товару (#)',
          },
          type: 'number',
          index: true,
          admin: {
            width: '25%',
            description: 'Generated automatically on creation',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          label: {
            en: 'Price (₴)',
            uk: 'Ціна (₴)',
          },
          type: 'number',
          required: true,
          min: 0.01,
          defaultValue: 1,
        },
        {
          name: 'count',
          label: {
            en: 'Stock Quantity',
            uk: 'Кількість (Залишок на складі)',
          },
          type: 'number',
          required: true,
          defaultValue: 1,
        },
        {
          name: 'unit',
          label: {
            en: 'Unit',
            uk: 'Одиниця виміру',
          },
          type: 'select',
          defaultValue: 'pcs',
          options: [
            { label: { en: 'pcs.', uk: 'шт.' }, value: 'pcs' },
            { label: { en: 'kg', uk: 'кг' }, value: 'kg' },
            { label: { en: 'g', uk: 'г' }, value: 'g' },
            { label: { en: 'l', uk: 'л' }, value: 'l' },
            { label: { en: 'pack', uk: 'уп.' }, value: 'pack' },
          ],
        },
      ],
    },
    {
      name: 'details',
      label: {
        en: 'Product Description & Details',
        uk: 'Деталі / Опис товару',
      },
      type: 'textarea',
    },
    {
      name: 'images',
      label: {
        en: 'Product Images',
        uk: 'Фотографії товару',
      },
      type: 'array',
      labels: {
        singular: {
          en: 'Image',
          uk: 'Фото',
        },
        plural: {
          en: 'Images',
          uk: 'Фотографії',
        },
      },
      fields: [
        {
          name: 'image',
          label: {
            en: 'Image File',
            uk: 'Зображення',
          },
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'isPrimary',
          label: {
            en: 'Primary / Cover Photo',
            uk: 'Головне фото',
          },
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          label: {
            en: 'Category / Type',
            uk: 'Тип / Категорія',
          },
          type: 'text',
          index: true,
        },
        {
          name: 'country',
          label: {
            en: 'Country of Origin',
            uk: 'Країна виробництва',
          },
          type: 'text',
        },
        {
          name: 'weight',
          label: {
            en: 'Weight (kg)',
            uk: 'Вага (кг)',
          },
          type: 'number',
          defaultValue: 1,
        },
      ],
    },
    {
      name: 'isPublished',
      label: {
        en: 'Visible in Storefront',
        uk: 'Показувати у вітрині магазину',
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
