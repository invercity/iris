import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-mongodb';
import { normalizeTenantSlug } from '@iris/shared';

/**
 * Migration:
 * 1. Iterates over all existing users in `users` collection.
 * 2. Creates a dedicated Tenant (`tenants` collection) for each user where `slug = normalizeTenantSlug(user.username)`
 *    and `domain = `${slug}.homee.ua``.
 * 3. Links the user to their tenant (`defaultTenant` + `tenants` array).
 * 4. Updates all existing documents in `goods`, `orders`, `clients`, `places` where `user == user._id`
 *    to set `tenant = tenant._id`.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const baseDomain = process.env.BASE_DOMAIN || 'homee.ua';
  const db = payload.db.connection;

  const usersCollection = db.collection('users');
  const tenantsCollection = db.collection('tenants');
  const goodsCollection = db.collection('goods');
  const ordersCollection = db.collection('orders');
  const clientsCollection = db.collection('clients');
  const placesCollection = db.collection('places');

  const existingUsers = await usersCollection.find({}).toArray();

  for (const user of existingUsers) {
    const rawUsername = String(user.username || user.email?.split('@')[0] || user._id);
    const slug = normalizeTenantSlug(rawUsername);
    const displayName =
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      rawUsername;

    const now = new Date();
    const tenantResult = await tenantsCollection.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          slug,
          name: `Магазин ${displayName}`,
          domain: `${slug}.${baseDomain}`,
          description: `Офіційний магазин користувача ${displayName}`,
          currency: '₴',
          owner: user._id,
          active: true,
          createdAt: now,
        },
        $set: {
          updatedAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const tenantDoc = tenantResult || (await tenantsCollection.findOne({ slug }));
    if (!tenantDoc) continue;

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          defaultTenant: tenantDoc._id,
          tenants: [
            {
              tenant: tenantDoc._id,
              roles: ['owner'],
            },
          ],
        },
      },
    );

    // Backfill tenant reference on all user-owned entities
    await Promise.all([
      goodsCollection.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenantDoc._id, isPublished: true, unit: 'шт' } },
      ),
      ordersCollection.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenantDoc._id } },
      ),
      clientsCollection.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenantDoc._id } },
      ),
      placesCollection.updateMany(
        { user: user._id, tenant: { $exists: false } },
        { $set: { tenant: tenantDoc._id } },
      ),
    ]);
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const db = payload.db.connection;
  await Promise.all([
    db.collection('goods').updateMany({}, { $unset: { tenant: '' } }),
    db.collection('orders').updateMany({}, { $unset: { tenant: '' } }),
    db.collection('clients').updateMany({}, { $unset: { tenant: '' } }),
    db.collection('places').updateMany({}, { $unset: { tenant: '' } }),
    db.collection('users').updateMany({}, { $unset: { defaultTenant: '', tenants: '' } }),
  ]);
}
