const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupDb, agent, register } = require('./helpers');
const Task = require('../src/models/Task');

setupDb();

/** Owner assigns 2 tasks to a member -> member has 3 notifications (team_added + 2 assigned). */
async function memberWithNotifications() {
  const owner = agent();
  await register(owner);
  const team = (await owner.post('/api/teams').send({ name: 'Notify Team' })).body.data;
  const member = agent();
  const memberUser = await register(member);
  await owner.post(`/api/teams/${team._id}/members`).send({ email: memberUser.email });
  await owner.post('/api/tasks').send({ title: 'One', team: team._id, assignee: memberUser._id });
  await owner.post('/api/tasks').send({ title: 'Two', team: team._id, assignee: memberUser._id });
  return { owner, member, memberUser, team };
}

describe('notifications', () => {
  it('lists newest first with an unread count', async () => {
    const { member } = await memberWithNotifications();
    const res = await member.get('/api/notifications');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.items.length, 3);
    assert.equal(res.body.data.unreadCount, 3);
    assert.match(res.body.data.items[0].message, /Two/);
  });

  it('marks one as read, then all as read', async () => {
    const { member } = await memberWithNotifications();
    const { items } = (await member.get('/api/notifications')).body.data;
    const one = await member.patch(`/api/notifications/${items[0]._id}/read`);
    assert.equal(one.status, 200);
    assert.equal(one.body.data.read, true);
    assert.equal((await member.get('/api/notifications')).body.data.unreadCount, 2);

    assert.equal((await member.patch('/api/notifications/read-all')).status, 200);
    assert.equal((await member.get('/api/notifications')).body.data.unreadCount, 0);
  });

  it("cannot mark someone else's notification", async () => {
    const { member, owner } = await memberWithNotifications();
    const { items } = (await member.get('/api/notifications')).body.data;
    assert.equal((await owner.patch(`/api/notifications/${items[0]._id}/read`)).status, 404);
    assert.equal((await owner.patch('/api/notifications/bad-id/read')).status, 404);
  });

  it('requires login', async () => {
    assert.equal((await agent().get('/api/notifications')).status, 401);
  });
});

describe('stats', () => {
  it('counts my tasks by status and overdue', async () => {
    const { member, team } = await memberWithNotifications();
    // The API refuses past due dates, so make these tasks overdue directly in the DB.
    const late = (await member.post('/api/tasks').send({ title: 'Personal late' })).body.data;
    const doneTask = (await member.post('/api/tasks').send({ title: 'Personal done', status: 'done' })).body.data;
    const yesterday = new Date(Date.now() - 86400000);
    await Task.updateMany({ _id: { $in: [late._id, doneTask._id] } }, { dueDate: yesterday });
    // Team task created by member but not assigned to them: not counted.
    await member.post('/api/tasks').send({ title: 'Unassigned team', team: team._id });

    const res = await member.get('/api/users/me/stats');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, { todo: 3, in_progress: 0, done: 1, overdue: 1, total: 4 });
  });
});
