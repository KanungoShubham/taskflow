const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupDb, agent, register } = require('./helpers');

setupDb();

describe('auth', () => {
  it('registers a user, sets an httpOnly cookie and hides the password', async () => {
    const a = agent();
    const res = await a.post('/api/auth/register').send({ name: 'Asha', email: 'Asha@Example.com', password: 'secret123' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.email, 'asha@example.com');
    assert.equal(res.body.data.password, undefined);
    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /token=/);
    assert.match(cookie, /HttpOnly/i);
  });

  it('rejects a duplicate email with 409 and a field error', async () => {
    await register(agent(), { email: 'dup@example.com' });
    const res = await agent().post('/api/auth/register').send({ name: 'Other', email: 'dup@example.com', password: 'secret123' });
    assert.equal(res.status, 409);
    assert.equal(res.body.message, 'Email already registered');
    assert.ok(res.body.errors.email);
  });

  it('validates register fields', async () => {
    const res = await agent().post('/api/auth/register').send({ name: 'A', email: 'not-an-email', password: '123' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.name);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.password);
  });

  it('logs in with correct credentials and rejects a wrong password', async () => {
    await register(agent(), { email: 'login@example.com', password: 'secret123' });
    const bad = await agent().post('/api/auth/login').send({ email: 'login@example.com', password: 'wrongpass' });
    assert.equal(bad.status, 401);
    assert.equal(bad.body.message, 'Invalid email or password');
    const good = await agent().post('/api/auth/login').send({ email: 'login@example.com', password: 'secret123' });
    assert.equal(good.status, 200);
    assert.equal(good.body.data.email, 'login@example.com');
  });

  it('GET /me returns the user with a cookie and 401 without one', async () => {
    const a = agent();
    const user = await register(a);
    const me = await a.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.data._id, user._id);
    const anon = await agent().get('/api/auth/me');
    assert.equal(anon.status, 401);
  });

  it('GET /me with a garbage cookie returns 401', async () => {
    const res = await agent().get('/api/auth/me').set('Cookie', 'token=garbage');
    assert.equal(res.status, 401);
  });

  it('logout clears the cookie', async () => {
    const a = agent();
    await register(a);
    const out = await a.post('/api/auth/logout');
    assert.equal(out.status, 200);
    const me = await a.get('/api/auth/me');
    assert.equal(me.status, 401);
  });
});
