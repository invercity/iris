const assert = require('assert').strict;
const request = require('supertest');
const { describe, it, before } = require('mocha');
const app = require('../config/lib/app');
const {
  users: [testUser],
  goods: [testGood, testGood2],
  clients: [testClient, testClient2],
  orders: [testOrder, testOrder2],
  places: [testPlace],
  orderOptions: [orderOps, orderOps2]
} = require('./data');

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

  it('should create yet one good on POST /api/goods', async () => {
    const response = await request(appInstance)
      .post('/api/goods')
      .set('Cookie', cookies)
      .send(testGood2);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    testGood2._id = response.body._id;
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

  it('should create yet one client on POST /api/clients', async () => {
    const response = await request(appInstance)
      .post('/api/clients')
      .set('Cookie', cookies)
      .send(testClient2);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    testClient2._id = response.body._id;
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
            count: orderOps.count
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
    testOrder._id = response.body._id;
    testOrder.code = response.body.code;
  });

  it('should create yet one order on POST /api/orders', async () => {
    const response = await request(appInstance)
      .post('/api/orders')
      .set('Cookie', cookies)
      .send({
        ...testOrder,
        items: [
          {
            good: {
              _id: testGood2._id
            },
            count: orderOps2.count
          }
        ],
        client: {
          _id: testClient2._id
        },
        place: {
          _id: testPlace._id
        }
      });
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    testOrder2._id = response.body._id;
    testOrder2.code = response.body.code;
  });

  it('should return list with two clients on GET /api/clients', async() => {
    const response = await request(appInstance)
      .get('/api/clients')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 2);
  });

  it('should return list with one place on GET /api/places', async() => {
    const response = await request(appInstance)
      .get('/api/places')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 1);
  });

  it('should return list with two goods on GET /api/goods', async() => {
    const response = await request(appInstance)
      .get('/api/goods')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 2);
    const [good2, good1] = response.body.items;
    assert.equal(good2.count + orderOps2.count, testGood2.count);
    assert.equal(good1.count + orderOps.count, testGood.count);
  });

  it('should return list with two orders on GET /api/orders', async() => {
    const response = await request(appInstance)
      .get('/api/orders')
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 2);
  });

  it('should update order on POST /api/orders/:orderId', async () => {
    const response = await request(appInstance)
      .put('/api/orders/' + testOrder._id)
      .set('Cookie', cookies)
      .send({
        ...testOrder,
        items: [
          {
            good: {
              _id: testGood._id
            },
            count: orderOps.count + 10
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

  it('should return good by id on GET /api/goods/:goodId', async() => {
    const response = await request(appInstance)
      .get('/api/goods/' + testGood._id)
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.equal(response.body.count + orderOps.count + 10, testGood.count);
  });

  it('should return list with one order by searching with first client name', async() => {
    const response = await request(appInstance)
      .get('/api/orders?q=' + encodeURIComponent(testClient.firstName))
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 1);
  });

  it('should return list with one order by searching with client phone', async() => {
    const response = await request(appInstance)
      .get('/api/orders?q=' + encodeURIComponent(testClient.phone))
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 1);
  });

  it('should return list with two orders by searching with part of client name', async() => {
    const response = await request(appInstance)
      .get('/api/orders?q=' + encodeURIComponent(testClient.firstName.substring(0, 3)))
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 2);
  });

  it('should return list with one order by searching with order code', async() => {
    const response = await request(appInstance)
      .get('/api/orders?q=' + encodeURIComponent(testOrder.code))
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 1);
  });

  it('should return list with two orders by querying with place id', async() => {
    const response = await request(appInstance)
      .get('/api/orders?place=' + testPlace._id)
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 2);
  });

  it('should return list with one order by searching with good id', async() => {
    const response = await request(appInstance)
      .get('/api/orders?good=' + testGood._id)
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 1);
  });

  it('should return list with one order by searching with client id', async() => {
    const response = await request(appInstance)
      .get('/api/orders?client=' + testClient._id)
      .set('Cookie', cookies);
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 1);
  });

  after(async () => {
    if (dbInstance.name === 'mean-test') {
      await dbInstance.dropDatabase();
    }
  });
});
