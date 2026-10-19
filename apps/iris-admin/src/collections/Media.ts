import path from 'path';
import { fileURLToPath } from 'url';
import type { CollectionConfig } from 'payload';
import { anyone, authenticated, assignAuthorHook } from '../access/roles';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: {
      en: 'Media / Image',
      uk: 'Зображення / Медіа',
    },
    plural: {
      en: 'Media Files',
      uk: 'Медіафайли',
    },
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    group: {
      en: 'Media & Files',
      uk: 'Медіа та файли',
    },
  },
  // Public read so product images render on the storefront;
  // logged-in tenant users still only see their own tenant's media (plugin constraint).
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeChange: [assignAuthorHook],
  },
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 640,
        height: 640,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        name: 'large',
        width: 1200,
        height: 1200,
        position: 'inside',
        formatOptions: { format: 'webp', options: { quality: 88 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: {
        en: 'Alt Text / Description',
        uk: 'Альтернативний текст (Опис картинки)',
      },
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      label: {
        en: 'Uploaded by (User)',
        uk: 'Завантажив користувач',
      },
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
};
