const assert = require('assert');
const request = require('supertest');
const { describe, it, before } = require('mocha');
const app = require('../config/lib/app');
const {
  users: [testUser],
  goods: [testGood],
  clients: [testClient],
  orders: [testOrder],
  places: [testPlace]
}  = require('./data');

const initApp = app.start.bind(app);

let appInstance;
let user;
let dbInstance;
let cookies;

describe('Test IRIS app', () => {
  before((done) => {
    initApp((instance, db) => {
      appInstance = instance;
      dbInstance = db;
      done();
    });
  });

  it('should success on signup POST /api/auth/signup', async() => {
    const response = await request(appInstance)
        .post('/api/auth/signup')
        .send(testUser);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    user = response.body;
    cookies = response.headers['set-cookie'].pop().split(';')[0];
  });

  it('should return empty list on GET /api/goods', async() => {
    const response = await request(appInstance)
      .get('/api/goods')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0);
  });

  it('should return empty list on GET /api/orders', async() => {
    const response = await request(appInstance)
      .get('/api/orders')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0);
  });

  it('should return empty list on GET /api/clients', async() => {
    const response = await request(appInstance)
      .get('/api/clients')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0);
  });

  it('should return empty list on GET /api/places', async() => {
    const response = await request(appInstance)
      .get('/api/places')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0);
  });

  it('should create place on POST /api/places', async () => {
    const response = await request(appInstance)
        .post('/api/places')
        .set('Cookie', cookies)
        .send(testPlace);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    testPlace._id = response.body._id;
  });

  it('should create good on POST /api/goods', async () => {
    const response = await request(appInstance)
        .post('/api/goods')
        .set('Cookie', cookies)
        .send(testGood);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    testGood._id = response.body._id;
  });

  it('should create client on POST /api/clients', async () => {
    const response = await request(appInstance)
        .post('/api/clients')
        .set('Cookie', cookies)
        .send(testClient);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    testClient._id = response.body._id;
  });

  it('should create order on POST /api/orders', async () => {
    const response = await request(appInstance)
        .post('/api/orders')
        .set('Cookie', cookies)
        .send({
          ...testOrder,
          items: [
            {
              good: {
                _id: testGood._id
              },
              count: 10
            }
          ],
          client: {
            _id: testClient._id
          },
          place: {
            _id: testPlace._id
          }
        });
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
  });

  it('should return list with one good on GET /api/goods', async() => {
    const response = await request(appInstance)
      .get('/api/goods')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    const goods = response.body.items;
    assert.strictEqual(goods.length, 1);
  });

  it('should return list with one order on GET /api/orders', async() => {
    const response = await request(appInstance)
      .get('/api/orders')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    const orders = response.body.items;
    assert.strictEqual(orders.length, 1);
  });

  after(async () => {
    if (dbInstance.name === 'mean-test') {
      await dbInstance.dropDatabase();
    }
    process.exit(0);
  });
});
