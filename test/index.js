const assert = require('assert');
const request = require('supertest');
const { describe, it, before } = require('mocha');
const app = require('../config/lib/app');
const initApp = app.start.bind(app);

let appInstance;
let user;

describe('Test IRIS app', async () => {
  before((done) => {
    initApp(async (instance, db) => {
      if (db.name === 'mean-test') {
        await db.dropDatabase();
      }
      appInstance = instance;
      done();
    });
  })

  it('should return empty list on GET /api/goods', async() => {
    const response = await request(appInstance)
      .get('/api/goods');
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0)
  });

  it('should return empty list on GET /api/orders', async() => {
    const response = await request(appInstance)
      .get('/api/orders');
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0)
  });

  it('should return empty list on GET /api/clients', async() => {
    const response = await request(appInstance)
      .get('/api/clients');
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0)
  });

  it('should return empty list on GET /api/places', async() => {
    const response = await request(appInstance)
      .get('/api/places');
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    assert.strictEqual(response.body.items.length, 0)
  });

  it('should success on signup POST /api/auth/signup', async() => {
    const email = `testmail-${Math.random()}@example.com`
    const response = await request(appInstance)
      .post('/api/auth/signup')
      .send({ firstName: 'Test Name', lastName: 'Test Last Name', username: 'testtest', email, password: 'TESTmail11223344++'})
    assert.strictEqual(response.status, 200);
    assert.ok(response.body);
    user = response.body;
  });

  after(() => {
    process.exit(0);
  });
});
