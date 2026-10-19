import crypto from 'node:crypto';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { normalizeTenantSlug } from '@iris/shared';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const mongoUri =
  process.env.DATABASE_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://127.0.0.1:27017/mean-dev';

const baseDomain = process.env.BASE_DOMAIN || 'homee.ua';
const DEFAULT_MIGRATED_PASSWORD = process.env.DEFAULT_MIGRATED_PASSWORD || 'admin12345';

function generatePayloadPasswordHash(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const rawHash = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex');
  return {
    salt,
    hash: `pbkdf2-sha256-v1:${rawHash}`,
  };
}

/**
 * Standalone Migration Script:
 * - Reads all existing users from the `users` collection.
 * - For each user, creates (or updates) a dedicated Tenant in `tenants` bound to `user.username`
 *   (e.g., username "vitaly" -> tenant slug "vitaly", domain "vitaly.homee.ua").
 * - Updates the user record with `defaultTenant`, `tenants` array, and a PayloadCMS-compatible
 *   `hash`/`salt` if not already set (preserving legacy `password` & `legacySalt`).
 * - Updates all `goods`, `orders`, `clients`, and `places` owned by that user (`user: user._id`)
 *   to point to `tenant: tenant._id`.
 */
async function runMigration() {
  console.log(`🔄 Connecting to MongoDB for Multi-Tenant Migration...`);
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not initialized');
  }

  const usersCol = db.collection('users');
  const tenantsCol = db.collection('tenants');
  const goodsCol = db.collection('goods');
  const ordersCol = db.collection('orders');
  const clientsCol = db.collection('clients');
  const placesCol = db.collection('places');

  // Ensure unique index on tenants.slug
  await tenantsCol.createIndex({ slug: 1 }, { unique: true });

  const users = await usersCol.find({}).toArray();
  console.log(`👥 Found ${users.length} user(s) in database.`);

  let primaryTenantId: mongoose.Types.ObjectId | null = null;

  for (const user of users) {
    const rawUsername = String(
      user.username || (typeof user.email === 'string' ? user.email.split('@')[0] : '') || user._id,
    );
    const slug = normalizeTenantSlug(rawUsername);
    const displayName =
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      rawUsername;

    const now = new Date();
    await tenantsCol.updateOne(
      { slug },
      {
        $setOnInsert: {
          slug,
          name: `Магазин ${displayName}`,
          domain: `${slug}.${baseDomain}`,
          description: `Інтернет-магазин ${displayName} (${slug}.${baseDomain})`,
          currency: '₴',
          phone: '',
          owner: user._id,
          active: true,
          createdAt: now,
        },
        $set: {
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    const tenant = await tenantsCol.findOne({ slug });
    if (!tenant) continue;

    if (!primaryTenantId || (Array.isArray(user.roles) && user.roles.includes('admin'))) {
      primaryTenantId = tenant._id as mongoose.Types.ObjectId;
    }

    const userUpdateFields: Record<string, unknown> = {
      defaultTenant: tenant._id,
      tenants: [
        {
          tenant: tenant._id,
          roles: ['owner'],
        },
      ],
    };

    // If user comes from legacy MEAN.js and lacks PayloadCMS `hash`, generate PayloadCMS password hash
    if (!user.hash) {
      const { salt, hash } = generatePayloadPasswordHash(DEFAULT_MIGRATED_PASSWORD);
      if (user.salt && !user.legacySalt) {
        userUpdateFields.legacySalt = user.salt;
      }
      userUpdateFields.salt = salt;
      userUpdateFields.hash = hash;
      userUpdateFields.loginAttempts = 0;
    }

    await usersCol.updateOne({ _id: user._id }, { $set: userUpdateFields });

    const [goodsRes, ordersRes, clientsRes, placesRes] = await Promise.all([
      goodsCol.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenant._id, isPublished: true, unit: 'шт' } },
      ),
      ordersCol.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenant._id } },
      ),
      clientsCol.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenant._id } },
      ),
      placesCol.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenant._id } },
      ),
    ]);

    console.log(
      `✅ User "${rawUsername}" (${user.email || 'no-email'}) -> Tenant "${slug}" (${slug}.${baseDomain}) | Migrated: ${goodsRes.modifiedCount} goods, ${ordersRes.modifiedCount} orders, ${clientsRes.modifiedCount} clients, ${placesRes.modifiedCount} places`,
    );
  }

  // Assign any orphan records (without a `user` field) to primaryTenantId if present
  if (primaryTenantId) {
    await Promise.all([
      goodsCol.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: primaryTenantId, isPublished: true, unit: 'шт' } },
      ),
      ordersCol.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: primaryTenantId } },
      ),
      clientsCol.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: primaryTenantId } },
      ),
      placesCol.updateMany(
        { tenant: { $exists: false } },
        { $set: { tenant: primaryTenantId } },
      ),
    ]);
  }

  console.log('🎉 Multi-tenant migration completed successfully!');
  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
