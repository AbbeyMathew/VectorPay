const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, stopDb, clearDb, signUp, request } = require('./helpers');

const app = require('../src/app');
const { outbox } = require('../src/utils/mailer');

describe('auth', () => {
  before(startDb);
  after(stopDb);
  beforeEach(async () => { await clearDb(); outbox.length = 0; });

  it('registers a user, opens a wallet and signs them in with an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Rao', phone: '98765 43210', email: 'Asha@Example.test', password: 'Passw0rdTest',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.phone, '9876543210');
    assert.equal(res.body.user.email, 'asha@example.test');
    assert.equal(res.body.user.password, undefined);
    assert.match(res.headers['set-cookie'][0], /vp_session=.*HttpOnly/i);
  });

  it('rejects weak passwords and bad phone numbers with field messages', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Rao', phone: '123', email: 'asha@example.test', password: 'short',
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.phone);
    assert.ok(res.body.errors.password);
  });

  it('refuses duplicate phone numbers', async () => {
    const { body } = await signUp(app);
    const res = await request(app).post('/api/auth/register').send({ ...body, email: 'other@example.test' });
    assert.equal(res.status, 409);
    assert.ok(res.body.errors.phone);
  });

  it('logs in, reads the session, and logs out', async () => {
    const { body } = await signUp(app);
    const agent = request.agent(app);

    const login = await agent.post('/api/auth/login').send({ phone: body.phone, password: body.password });
    assert.equal(login.status, 200);

    assert.equal((await agent.get('/api/auth/me')).status, 200);
    await agent.post('/api/auth/logout');
    assert.equal((await agent.get('/api/auth/me')).status, 401);
  });

  it('gives the same error for a wrong password and an unknown phone number', async () => {
    const { body } = await signUp(app);
    const wrongPassword = await request(app).post('/api/auth/login').send({ phone: body.phone, password: 'nope12345' });
    const unknownPhone = await request(app).post('/api/auth/login').send({ phone: '9111111111', password: 'nope12345' });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownPhone.status, 401);
    assert.equal(wrongPassword.body.message, unknownPhone.body.message);
  });

  it('protects admin routes from regular users', async () => {
    const { agent } = await signUp(app);
    assert.equal((await agent.get('/api/admin/users')).status, 403);
    assert.equal((await request(app).get('/api/admin/users')).status, 401);
  });

  describe('password reset', () => {
    const readCode = () => outbox.at(-1).text.match(/\b(\d{6})\b/)[1];

    it('completes the email -> code -> new password flow and signs out old sessions', async () => {
      const { agent, body } = await signUp(app);
      // Session tokens carry a 1-second timestamp, so let the old session age past that.
      await new Promise((r) => setTimeout(r, 1100));

      const forgot = await request(app).post('/api/auth/forgot').send({ email: body.email });
      assert.equal(forgot.status, 200);
      assert.equal(outbox.length, 1);

      const verify = await request(app).post('/api/auth/verify-otp').send({ email: body.email, otp: readCode() });
      assert.equal(verify.status, 200);

      const reset = await request(app)
        .post('/api/auth/reset')
        .send({ resetToken: verify.body.resetToken, password: 'BrandNew123' });
      assert.equal(reset.status, 200);

      // Old session is revoked; new password works.
      assert.equal((await agent.get('/api/auth/me')).status, 401);
      const login = await request(app).post('/api/auth/login').send({ phone: body.phone, password: 'BrandNew123' });
      assert.equal(login.status, 200);
    });

    it('does not reveal whether an email has an account', async () => {
      const res = await request(app).post('/api/auth/forgot').send({ email: 'nobody@example.test' });
      assert.equal(res.status, 200);
      assert.equal(outbox.length, 0);
    });

    it('locks a code after too many wrong guesses', async () => {
      const { body } = await signUp(app);
      await request(app).post('/api/auth/forgot').send({ email: body.email });
      const good = readCode();
      const bad = good === '000000' ? '111111' : '000000';

      for (let i = 0; i < 5; i += 1) {
        assert.equal((await request(app).post('/api/auth/verify-otp').send({ email: body.email, otp: bad })).status, 400);
      }
      const locked = await request(app).post('/api/auth/verify-otp').send({ email: body.email, otp: good });
      assert.equal(locked.status, 429);
    });
  });
});
