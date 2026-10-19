import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import sharp from 'sharp';

import { Tenants } from './collections/Tenants';
import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Goods } from './collections/Goods';
import { Places } from './collections/Places';
import { Clients } from './collections/Clients';
import { Orders } from './collections/Orders';
import { migrations } from './migrations';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';
import { isSuperAdmin, superAdminFieldAccess } from './access/roles';

import { en } from '@payloadcms/translations/languages/en';
import { uk } from '@payloadcms/translations/languages/uk';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const isS3Configured = Boolean(
  process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Iris / Homio Admin',
    },
  },
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, uk },
  },
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Українська', code: 'uk' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [Tenants, Users, Media, Goods, Orders, Clients, Places],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'iris-payload-secret-change-in-prod',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url:
      process.env.DATABASE_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.MONGOHQ_URL ||
      'mongodb://127.0.0.1:27017/mean-dev',
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  plugins: [
    multiTenantPlugin({
      collections: {
        goods: {},
        orders: {},
        clients: {},
        places: {},
        media: {},
      },
      tenantsSlug: 'tenants',
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      tenantsArrayField: {
        includeDefaultField: true,
        arrayFieldAccess: {
          read: () => true,
          create: superAdminFieldAccess,
          update: superAdminFieldAccess,
        },
        rowFields: [
          {
            name: 'roles',
            label: 'Ролі в магазині',
            type: 'select',
            hasMany: true,
            defaultValue: ['owner'],
            options: [
              { label: 'Власник', value: 'owner' },
              { label: 'Менеджер', value: 'manager' },
            ],
          },
        ],
      },
    }),
    // Automatically uses Cloudflare R2 / AWS S3 when S3_BUCKET is configured,
    // and falls back to local disk (`apps/iris-admin/media`) during local development
    s3Storage({
      enabled: isS3Configured,
      collections: {
        media: {
          prefix: 'goods',
          disableLocalStorage: isS3Configured,
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT, // e.g., https://<ACCOUNT_ID>.r2.cloudflarestorage.com
        region: process.env.S3_REGION || 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
  sharp,
  cors: [
    process.env.APP_URL || 'http://localhost:5173',
    process.env.API_URL || 'http://localhost:3000',
    'https://homee.ua',
    'https://www.homee.ua',
  ],
});
