// Must run before any app code is required: env is read at import time.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod;

async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Index builds must finish so unique constraints are enforced in tests.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}

async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let counter = 0;
/** Registers a fresh user and returns a supertest agent that carries their session cookie. */
async function signUp(app, overrides = {}) {
  counter += 1;
  const body = {
    name: `Test User ${counter}`,
    phone: String(9000000000 + counter),
    email: `user${counter}@example.test`,
    password: 'Passw0rdTest',
    ...overrides,
  };
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`signUp failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user, body };
}

module.exports = { startDb, stopDb, clearDb, signUp, request };
