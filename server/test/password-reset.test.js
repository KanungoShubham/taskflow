const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupDb, agent, register } = require('./helpers');
const User = require('../src/models/User');

setupDb();

async function requestReset(email) {
  return agent().post('/api/auth/forgot-password').send({ email });
}

describe('forgot / reset password', () => {
  it('returns 404 with a field error when no account has that email', async () => {
    const res = await requestReset('nobody@example.com');
    assert.equal(res.status, 404);
    assert.equal(res.body.errors.email, 'No account found with this email');
  });

  it('validates the email format', async () => {
    const res = await requestReset('not-an-email');
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.email);
  });

  it('issues a reset token for an existing email and stores only its hash', async () => {
    await register(agent(), { email: 'reset@example.com' });
    const res = await requestReset('Reset@Example.com');
    assert.equal(res.status, 200);
    assert.match(res.body.data.resetToken, /^[a-f0-9]{64}$/);
    const user = await User.findOne({ email: 'reset@example.com' }).select('+resetPasswordToken');
    assert.ok(user.resetPasswordToken);
    assert.notEqual(user.resetPasswordToken, res.body.data.resetToken);
  });

  it('resets the password, logs the user in, and the old password stops working', async () => {
    await register(agent(), { email: 'swap@example.com', password: 'oldpass1' });
    const { resetToken } = (await requestReset('swap@example.com')).body.data;

    const a = agent();
    const res = await a.post('/api/auth/reset-password').send({ token: resetToken, password: 'newpass1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'swap@example.com');
    assert.equal((await a.get('/api/auth/me')).status, 200);

    const oldLogin = await agent().post('/api/auth/login').send({ email: 'swap@example.com', password: 'oldpass1' });
    assert.equal(oldLogin.status, 401);
    const newLogin = await agent().post('/api/auth/login').send({ email: 'swap@example.com', password: 'newpass1' });
    assert.equal(newLogin.status, 200);
  });

  it('a token works only once', async () => {
    await register(agent(), { email: 'once@example.com' });
    const { resetToken } = (await requestReset('once@example.com')).body.data;
    assert.equal((await agent().post('/api/auth/reset-password').send({ token: resetToken, password: 'newpass1' })).status, 200);
    const again = await agent().post('/api/auth/reset-password').send({ token: resetToken, password: 'another1' });
    assert.equal(again.status, 400);
    assert.equal(again.body.message, 'Reset link is invalid or has expired. Please start again.');
  });

  it('rejects an expired token', async () => {
    await register(agent(), { email: 'expired@example.com' });
    const { resetToken } = (await requestReset('expired@example.com')).body.data;
    await User.updateOne({ email: 'expired@example.com' }, { resetPasswordExpires: new Date(Date.now() - 1000) });
    const res = await agent().post('/api/auth/reset-password').send({ token: resetToken, password: 'newpass1' });
    assert.equal(res.status, 400);
  });

  it('validates the new password', async () => {
    const res = await agent().post('/api/auth/reset-password').send({ token: 'abc', password: '123' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.password);
  });
});
