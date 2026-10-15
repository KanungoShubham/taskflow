const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { getApp } = require('./helpers');

describe('app', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(getApp()).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { data: { status: 'ok' } });
  });

  it('unknown route returns 404 with message', async () => {
    const res = await request(getApp()).get('/api/nope');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Route not found: GET /api/nope');
  });
});
