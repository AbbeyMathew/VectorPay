const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, stopDb, clearDb, signUp, request } = require('./helpers');

const app = require('../src/app');

const rupees = (n) => n * 100;
const balanceOf = async (agent) => (await agent.get('/api/wallet')).body.wallet.balance;

describe('wallet', () => {
  before(startDb);
  after(stopDb);
  beforeEach(clearDb);

  it('tops up a wallet', async () => {
    const { agent } = await signUp(app);
    const res = await agent.post('/api/wallet/topup').send({ amount: rupees(500) });
    assert.equal(res.status, 201);
    assert.equal(res.body.wallet.balance, rupees(500));
  });

  it('rejects invalid amounts', async () => {
    const { agent } = await signUp(app);
    for (const amount of [0, -100, 12.5, '500', rupees(100001)]) {
      const res = await agent.post('/api/wallet/topup').send({ amount });
      assert.equal(res.status, 400, `amount ${JSON.stringify(amount)} should be rejected`);
    }
  });

  it('moves money between two users and records it for both', async () => {
    const alice = await signUp(app);
    const bob = await signUp(app);
    await alice.agent.post('/api/wallet/topup').send({ amount: rupees(1000) });

    const res = await alice.agent
      .post('/api/wallet/transfer')
      .send({ toPhone: bob.user.phone, amount: rupees(250), note: 'Dinner' });
    assert.equal(res.status, 201);
    assert.equal(res.body.balance, rupees(750));
    assert.equal(await balanceOf(bob.agent), rupees(250));

    const aliceFeed = (await alice.agent.get('/api/wallet/transactions?type=sent')).body.transactions;
    assert.equal(aliceFeed.length, 1);
    assert.equal(aliceFeed[0].direction, 'out');
    assert.equal(aliceFeed[0].counterparty.name, bob.user.name);

    const bobFeed = (await bob.agent.get('/api/wallet/transactions?type=received')).body.transactions;
    assert.equal(bobFeed[0].direction, 'in');
    assert.equal(bobFeed[0].note, 'Dinner');
  });

  it('refuses transfers larger than the balance', async () => {
    const alice = await signUp(app);
    const bob = await signUp(app);
    await alice.agent.post('/api/wallet/topup').send({ amount: rupees(100) });

    const res = await alice.agent.post('/api/wallet/transfer').send({ toPhone: bob.user.phone, amount: rupees(101) });
    assert.equal(res.status, 400);
    assert.equal(await balanceOf(alice.agent), rupees(100));
    assert.equal(await balanceOf(bob.agent), 0);
  });

  it("refuses sending to yourself or to a number that isn't registered", async () => {
    const alice = await signUp(app);
    await alice.agent.post('/api/wallet/topup').send({ amount: rupees(100) });

    const self = await alice.agent.post('/api/wallet/transfer').send({ toPhone: alice.user.phone, amount: rupees(10) });
    assert.equal(self.status, 400);
    const unknown = await alice.agent.post('/api/wallet/transfer').send({ toPhone: '9111111111', amount: rupees(10) });
    assert.equal(unknown.status, 404);
  });

  it('never lets simultaneous transfers overdraw the wallet', async () => {
    const alice = await signUp(app);
    const bob = await signUp(app);
    await alice.agent.post('/api/wallet/topup').send({ amount: rupees(100) });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        alice.agent.post('/api/wallet/transfer').send({ toPhone: bob.user.phone, amount: rupees(30) })
      )
    );
    const succeeded = results.filter((r) => r.status === 201).length;
    assert.equal(succeeded, 3);
    assert.equal(await balanceOf(alice.agent), rupees(10));
    assert.equal(await balanceOf(bob.agent), rupees(90));
  });

  it('paginates the activity feed with a cursor', async () => {
    const alice = await signUp(app);
    for (let i = 0; i < 5; i += 1) await alice.agent.post('/api/wallet/topup').send({ amount: rupees(10 + i) });

    const first = (await alice.agent.get('/api/wallet/transactions?limit=3')).body;
    assert.equal(first.transactions.length, 3);
    assert.ok(first.nextCursor);

    const second = (await alice.agent.get(`/api/wallet/transactions?limit=3&before=${first.nextCursor}`)).body;
    assert.equal(second.transactions.length, 2);
    assert.equal(second.nextCursor, null);
  });

  it('summarises daily spend for the heatmap', async () => {
    const alice = await signUp(app);
    const bob = await signUp(app);
    await alice.agent.post('/api/wallet/topup').send({ amount: rupees(500) });
    await alice.agent.post('/api/wallet/transfer').send({ toPhone: bob.user.phone, amount: rupees(120) });

    const start = new Date(Date.now() - 2 * 86400000).toISOString();
    const end = new Date(Date.now() + 86400000).toISOString();
    const res = await alice.agent.get('/api/wallet/spend/daily').query({ start, end, tz: 'UTC' });
    assert.equal(res.status, 200);
    assert.equal(Object.values(res.body.days).reduce((a, b) => a + b, 0), rupees(120));

    const summary = await alice.agent.get('/api/wallet/summary').query({ start, end });
    assert.deepEqual(summary.body, { sent: rupees(120), received: 0 });
  });

  it('requires sign-in for balances and recipient lookup', async () => {
    assert.equal((await request(app).get('/api/wallet')).status, 401);
    assert.equal((await request(app).get('/api/users/lookup?phone=9876543210')).status, 401);
  });

  it('looks up a recipient name only', async () => {
    const alice = await signUp(app);
    const bob = await signUp(app);
    const res = await alice.agent.get(`/api/users/lookup?phone=${bob.user.phone}`);
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body).sort(), ['found', 'isSelf', 'name']);
    assert.equal((await alice.agent.get('/api/users/lookup?phone=9111111111')).status, 404);
  });
});
