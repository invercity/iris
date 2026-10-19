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
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'admin12345';

function generatePayloadPasswordHash(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const rawHash = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex');
  return {
    salt,
    hash: `pbkdf2-sha256-v1:${rawHash}`,
  };
}

async function seedDemoData() {
  console.log('🌱 Connecting to MongoDB to seed demo multi-tenant data...');
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database connection');

  const usersCol = db.collection('users');
  const tenantsCol = db.collection('tenants');
  const goodsCol = db.collection('goods');
  const placesCol = db.collection('places');

  const demoUsers = [
    {
      username: 'admin',
      firstName: 'Адміністратор',
      lastName: 'Платформи',
      displayName: 'Адміністратор Homio',
      email: 'admin@homee.ua',
      roles: ['admin', 'user'],
      storeName: 'Головний Магазин Homio',
      storeDescription: 'Офіційний маркетплейс та вітрина платформи Homio.',
      phone: '+380441234567',
    },
    {
      username: 'vitaly',
      firstName: 'Віталій',
      lastName: 'Коваленко',
      displayName: 'Віталій Коваленко',
      email: 'vitaly@homee.ua',
      roles: ['user'],
      storeName: 'Фермерська Лавка Віталія',
      storeDescription: 'Свіжі фермерські продукти, крафтові сири, мед та домашня випічка з доставкою.',
      phone: '+380501234567',
    },
    {
      username: 'olena',
      firstName: 'Олена',
      lastName: 'Бондаренко',
      displayName: 'Олена Бондаренко',
      email: 'olena@homee.ua',
      roles: ['user'],
      storeName: 'Еко-Сад Олени',
      storeDescription: 'Сезонні фрукти, ягоди, пастила та натуральні соки прямісінько з саду.',
      phone: '+380679876543',
    },
  ];

  for (const u of demoUsers) {
    const slug = normalizeTenantSlug(u.username);
    const now = new Date();
    const { salt, hash } = generatePayloadPasswordHash(DEFAULT_PASSWORD);

    await usersCol.updateOne(
      { username: slug },
      {
        $setOnInsert: {
          username: slug,
          firstName: u.firstName,
          lastName: u.lastName,
          displayName: u.displayName,
          email: u.email,
          provider: 'local',
          created: now,
        },
        $set: {
          roles: u.roles,
          salt,
          hash,
          loginAttempts: 0,
          updated: now,
        },
      },
      { upsert: true },
    );

    const userDoc = await usersCol.findOne({ username: slug });
    if (!userDoc) continue;

    if (slug === 'admin') {
      await tenantsCol.deleteOne({ slug: 'admin' });
      console.log(
        `✅ Super-Admin account "${slug}" (${u.email}) ready | Password: ${DEFAULT_PASSWORD}`,
      );
      continue;
    }

    await tenantsCol.updateOne(
      { slug },
      {
        $setOnInsert: {
          slug,
          name: u.storeName,
          domain: `${slug}.${baseDomain}`,
          description: u.storeDescription,
          currency: '₴',
          phone: u.phone,
          owner: userDoc._id,
          active: true,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true },
    );

    const tenantDoc = await tenantsCol.findOne({ slug });
    if (!tenantDoc) continue;

    await usersCol.updateOne(
      { _id: userDoc._id },
      {
        $set: {
          defaultTenant: tenantDoc._id,
          tenants: [{ tenant: tenantDoc._id, roles: ['owner'] }],
        },
      },
    );

    console.log(
      `✅ Account "${slug}" (${u.email}) ready | Password: ${DEFAULT_PASSWORD} | Store: ${slug}.${baseDomain}`,
    );

    const existingGoodsCount = await goodsCol.countDocuments({ tenant: tenantDoc._id });
    if (existingGoodsCount === 0) {
      await placesCol.insertMany([
        {
          name: 'ЖК Комфорт Таун (біля фонтану)',
          address: 'вул. Регенераторна, 4',
          dates: [now],
          tenant: tenantDoc._id,
          user: userDoc._id,
          created: now,
        },
        {
          name: 'Метро Осокорки (парковка Novus)',
          address: 'просп. Миколи Бажана, 8',
          dates: [now],
          tenant: tenantDoc._id,
          user: userDoc._id,
          created: now,
        },
      ]);

      await goodsCol.insertMany(
        slug === 'vitaly'
          ? [
              {
                code: 101,
                name: 'Сир Качокавало витриманий (300г)',
                details: 'Крафтовий напівтвердий сир з цільного коровʼячого молока, витримка 3 місяці.',
                price: 210,
                count: 18,
                weight: 0.3,
                unit: 'шт',
                country: 'Україна',
                type: 'Сири',
                images: [],
                isPublished: true,
                tenant: tenantDoc._id,
                user: userDoc._id,
                created: now,
              },
              {
                code: 102,
                name: 'Мед акацієвий натуральний (0.5л)',
                details: 'Перший весняний збір з власної пасіки на Черкащині. Прозорий та ніжний.',
                price: 240,
                count: 25,
                weight: 0.7,
                unit: 'л',
                country: 'Україна',
                type: 'Мед та солодощі',
                images: [],
                isPublished: true,
                tenant: tenantDoc._id,
                user: userDoc._id,
                created: now,
              },
              {
                code: 103,
                name: 'Хліб на заквасці з льоном та насінням',
                details: 'Випечений у печі на житній заквасці тривалої ферментації (24 години).',
                price: 85,
                count: 12,
                weight: 0.65,
                unit: 'шт',
                country: 'Україна',
                type: 'Випічка',
                images: [],
                isPublished: true,
                tenant: tenantDoc._id,
                user: userDoc._id,
                created: now,
              },
            ]
          : [
              {
                code: 201,
                name: 'Яблука Гала відбірні (1 кг)',
                details: 'Соковиті та солодкі яблука з власного саду у Вінницькій області.',
                price: 45,
                count: 50,
                weight: 1,
                unit: 'кг',
                country: 'Україна',
                type: 'Фрукти',
                images: [],
                isPublished: true,
                tenant: tenantDoc._id,
                user: userDoc._id,
                created: now,
              },
              {
                code: 202,
                name: 'Пастила яблучно-малинова без цукру (100г)',
                details: '100% натуральні ягоди та печені яблука, висушені при низькій температурі.',
                price: 110,
                count: 30,
                weight: 0.1,
                unit: 'уп',
                country: 'Україна',
                type: 'Солодощі',
                images: [],
                isPublished: true,
                tenant: tenantDoc._id,
                user: userDoc._id,
                created: now,
              },
            ],
      );
    }

    console.log(
      `✅ Account "${slug}" (${u.email}) ready | Password: ${DEFAULT_PASSWORD} | Store: ${slug}.${baseDomain}`,
    );
  }

  await mongoose.disconnect();
  console.log('🎉 Seeding complete!');
}

seedDemoData().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
