// Shared test helpers: spins up an in-memory MongoDB and builds supertest agents.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

const { before, after, beforeEach } = require('node:test');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod;

/** Registers before/after hooks that connect to a fresh in-memory DB and wipe it between tests. */
function setupDb() {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });
  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });
  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });
}

function getApp() {
  return require('../src/app');
}

/** Returns a supertest agent (keeps cookies between requests). */
function agent() {
  return request.agent(getApp());
}

let counter = 0;
/** Registers a user through the API with the given agent and returns the created user. */
async function register(a, overrides = {}) {
  counter += 1;
  const body = {
    name: overrides.name || `User ${counter}`,
    email: overrides.email || `user${counter}@example.com`,
    password: overrides.password || 'secret123',
  };
  const res = await a.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
}

module.exports = { setupDb, getApp, agent, register };
