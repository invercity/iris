import type { CollectionConfig } from 'payload';
import { calculateOrderTotal, ORDER_STATUSES } from '@iris/shared';
import { authenticated, assignAuthorHook, extractId, getNextTenantCode } from '../access/roles';

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: {
      en: 'Order',
      uk: 'Замовлення',
    },
    plural: {
      en: 'Orders',
      uk: 'Замовлення',
    },
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'client', 'status', 'payed', 'total', 'created'],
    group: {
      en: 'Sales',
      uk: 'Продажі',
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
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'create' && !data.code) {
          data.code = await getNextTenantCode(req, 'orders', data.tenant);
        }

        // Resolve item prices and adjust Goods inventory counts
        const newItems: Array<{ good: string; count: number; priceAtOrder?: number }> =
          Array.isArray(data.items)
            ? data.items.map((item: { good: unknown; count?: number; priceAtOrder?: number }) => ({
                good: extractId(item.good) || String(item.good),
                count: Number(item.count) || 1,
                priceAtOrder: item.priceAtOrder,
              }))
            : [];

        const oldItems: Array<{ good: string; count: number }> =
          originalDoc && Array.isArray(originalDoc.items)
            ? originalDoc.items.map((item: { good: unknown; count?: number }) => ({
                good: extractId(item.good) || String(item.good),
                count: Number(item.count) || 1,
              }))
            : [];

        const allGoodIds = Array.from(
          new Set([...newItems.map((i) => i.good), ...oldItems.map((i) => i.good)].filter(Boolean)),
        );

        const priceMap = new Map<string, number>();

        for (const goodId of allGoodIds) {
          try {
            const goodDoc = await req.payload.findByID({
              collection: 'goods',
              id: goodId,
            });
            if (!goodDoc) continue;
            priceMap.set(goodId, Number(goodDoc.price) || 0);

            const before = oldItems.find((i) => i.good === goodId);
            const after = newItems.find((i) => i.good === goodId);
            let updatedCount = Number(goodDoc.count) || 0;

            if (before && after) {
              if (before.count !== after.count) {
                updatedCount += before.count - after.count;
              }
            } else if (!before && after) {
              updatedCount -= after.count;
            } else if (before && !after) {
              updatedCount += before.count;
            }

            if (updatedCount !== Number(goodDoc.count)) {
              await req.payload.update({
                collection: 'goods',
                id: goodId,
                data: { count: Math.max(0, updatedCount) },
              });
            }
          } catch {
            // Ignore missing good references during migration/seed
          }
        }

        data.total = calculateOrderTotal(
          newItems.map((item) => ({
            count: item.count,
            priceAtOrder: item.priceAtOrder ?? priceMap.get(item.good) ?? 0,
          })),
          {
            sale: Number(data.sale) || 0,
            credit: Number(data.credit) || 0,
            extra: Number(data.extra) || 0,
          },
        );

        return data;
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        try {
          const existingOrder = await req.payload.findByID({
            collection: 'orders',
            id,
          });
          // Match legacy logic: if order is unpaid, return items to stock on delete
          if (existingOrder && !existingOrder.payed && Array.isArray(existingOrder.items)) {
            for (const item of existingOrder.items as Array<{ good: unknown; count?: number }>) {
              const goodId = extractId(item.good);
              const count = Number(item.count) || 0;
              if (goodId && count > 0) {
                const goodDoc = await req.payload.findByID({
                  collection: 'goods',
                  id: goodId,
                });
                if (goodDoc) {
                  await req.payload.update({
                    collection: 'goods',
                    id: goodId,
                    data: { count: (Number(goodDoc.count) || 0) + count },
                  });
                }
              }
            }
          }
        } catch {
          // Ignore if order or goods already removed
        }
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'code',
          label: {
            en: 'Order Number (#)',
            uk: 'Номер замовлення (#)',
          },
          type: 'number',
          index: true,
          admin: {
            width: '30%',
          },
        },
        {
          name: 'status',
          label: {
            en: 'Order Status',
            uk: 'Статус замовлення',
          },
          type: 'select',
          required: true,
          defaultValue: 'work',
          options: [
            { label: { en: 'New / Processing', uk: 'Нові' }, value: 'work' },
            { label: { en: 'Ready', uk: 'Готові' }, value: 'ready' },
            { label: { en: 'To Assemble', uk: 'Можна збирати' }, value: 'togo' },
            { label: { en: 'Completed', uk: 'Зібрані' }, value: 'done' },
          ],
          admin: {
            width: '40%',
          },
        },
        {
          name: 'payed',
          label: {
            en: 'Paid',
            uk: 'Оплачено',
          },
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '30%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'client',
          label: {
            en: 'Customer',
            uk: 'Клієнт',
          },
          type: 'relationship',
          relationTo: 'clients',
          required: true,
        },
        {
          name: 'place',
          label: {
            en: 'Pickup Location',
            uk: 'Місце видачі',
          },
          type: 'relationship',
          relationTo: 'places',
        },
      ],
    },
    {
      name: 'placeDescription',
      label: {
        en: 'Delivery Address / Order Notes',
        uk: 'Адреса доставки / примітка до місця видачі',
      },
      type: 'textarea',
    },
    {
      name: 'items',
      label: {
        en: 'Order Items',
        uk: 'Список товарів у замовленні',
      },
      type: 'array',
      labels: {
        singular: {
          en: 'Item',
          uk: 'Позиція',
        },
        plural: {
          en: 'Items',
          uk: 'Позиції',
        },
      },
      required: true,
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'good',
              label: {
                en: 'Product',
                uk: 'Товар',
              },
              type: 'relationship',
              relationTo: 'goods',
              required: true,
            },
            {
              name: 'count',
              label: {
                en: 'Quantity',
                uk: 'Кількість',
              },
              type: 'number',
              required: true,
              min: 1,
              defaultValue: 1,
            },
            {
              name: 'priceAtOrder',
              label: {
                en: 'Locked Price at Order Time',
                uk: 'Фіксована ціна на момент замовлення (опціонально)',
              },
              type: 'number',
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sale',
          label: {
            en: 'Discount / Sale (₴)',
            uk: 'Знижка (₴)',
          },
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'credit',
          label: {
            en: 'Credit / Debt (₴)',
            uk: 'Борг (₴)',
          },
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'extra',
          label: {
            en: 'Extra Charge (%)',
            uk: 'Додатково (%)',
          },
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'total',
          label: {
            en: 'Total Amount (₴)',
            uk: 'Загальна сума до сплати (₴)',
          },
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
      ],
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
