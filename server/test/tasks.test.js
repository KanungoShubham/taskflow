const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupDb, agent, register } = require('./helpers');
const Notification = require('../src/models/Notification');
const Task = require('../src/models/Task');

setupDb();

/** Owner + member in one team. */
async function teamSetup() {
  const owner = agent();
  const ownerUser = await register(owner);
  const team = (await owner.post('/api/teams').send({ name: 'Board Team' })).body.data;
  const member = agent();
  const memberUser = await register(member);
  await owner.post(`/api/teams/${team._id}/members`).send({ email: memberUser.email });
  return { owner, ownerUser, member, memberUser, team };
}

describe('tasks', () => {
  it('creates a personal task with defaults', async () => {
    const a = agent();
    const user = await register(a);
    const res = await a.post('/api/tasks').send({ title: '  Buy milk  ' });
    assert.equal(res.status, 201);
    const t = res.body.data;
    assert.equal(t.title, 'Buy milk');
    assert.equal(t.priority, 'medium');
    assert.equal(t.status, 'todo');
    assert.equal(t.team, null);
    assert.equal(t.createdBy._id, user._id);
  });

  it('validates title and priority', async () => {
    const a = agent();
    await register(a);
    const res = await a.post('/api/tasks').send({ title: '', priority: 'urgent' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.title);
    assert.ok(res.body.errors.priority);
  });

  it('personal tasks are invisible to other users', async () => {
    const a = agent();
    await register(a);
    const task = (await a.post('/api/tasks').send({ title: 'Secret' })).body.data;
    const b = agent();
    await register(b);
    assert.equal((await b.get(`/api/tasks/${task._id}`)).status, 404);
    assert.equal((await b.get('/api/tasks')).body.data.length, 0);
  });

  it('returns 404 for a malformed task id', async () => {
    const a = agent();
    await register(a);
    const res = await a.get('/api/tasks/abc');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Task not found');
  });

  it('rejects an assignee on a personal task', async () => {
    const a = agent();
    const user = await register(a);
    const res = await a.post('/api/tasks').send({ title: 'X', assignee: user._id });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.assignee);
  });

  it('creates a team task assigned to a member and notifies the assignee', async () => {
    const { owner, memberUser, team } = await teamSetup();
    const res = await owner.post('/api/tasks').send({ title: 'Design login', team: team._id, assignee: memberUser._id, priority: 'high' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.assignee._id, memberUser._id);
    const notes = await Notification.find({ user: memberUser._id, type: 'task_assigned' });
    assert.equal(notes.length, 1);
    assert.match(notes[0].message, /Design login/);
  });

  it('rejects an assignee who is not a team member', async () => {
    const { owner, team } = await teamSetup();
    const outsider = agent();
    const outsiderUser = await register(outsider);
    const res = await owner.post('/api/tasks').send({ title: 'X', team: team._id, assignee: outsiderUser._id });
    assert.equal(res.status, 400);
    assert.equal(res.body.errors.assignee, 'Assignee must be a team member');
  });

  it('non-members cannot create tasks in a team', async () => {
    const { team } = await teamSetup();
    const outsider = agent();
    await register(outsider);
    const res = await outsider.post('/api/tasks').send({ title: 'X', team: team._id });
    assert.equal(res.status, 404);
  });

  it('filters by status, priority and search (case-insensitive)', async () => {
    const { owner, team } = await teamSetup();
    await owner.post('/api/tasks').send({ title: 'Write API docs', team: team._id, priority: 'high' });
    await owner.post('/api/tasks').send({ title: 'Fix navbar', team: team._id, status: 'done', priority: 'low' });
    await owner.post('/api/tasks').send({ title: 'Personal errand' });

    const all = await owner.get(`/api/tasks?team=${team._id}`);
    assert.equal(all.body.data.length, 2);
    const personal = await owner.get('/api/tasks?team=personal');
    assert.equal(personal.body.data.length, 1);
    const done = await owner.get(`/api/tasks?team=${team._id}&status=done`);
    assert.deepEqual(done.body.data.map((t) => t.title), ['Fix navbar']);
    const high = await owner.get(`/api/tasks?team=${team._id}&priority=high`);
    assert.deepEqual(high.body.data.map((t) => t.title), ['Write API docs']);
    const search = await owner.get(`/api/tasks?team=${team._id}&search=api`);
    assert.deepEqual(search.body.data.map((t) => t.title), ['Write API docs']);
  });

  it('members can move a task but only the creator or owner can edit/delete', async () => {
    const { owner, member, team } = await teamSetup();
    const task = (await owner.post('/api/tasks').send({ title: 'Shared', team: team._id })).body.data;

    const moved = await member.patch(`/api/tasks/${task._id}/move`).send({ status: 'in_progress', order: 0 });
    assert.equal(moved.status, 200);
    assert.equal(moved.body.data.status, 'in_progress');

    assert.equal((await member.patch(`/api/tasks/${task._id}`).send({ title: 'Hijack' })).status, 403);
    assert.equal((await member.delete(`/api/tasks/${task._id}`)).status, 403);
    assert.equal((await owner.delete(`/api/tasks/${task._id}`)).status, 200);
    assert.equal((await owner.get(`/api/tasks/${task._id}`)).status, 404);
  });

  it('moving a task to done notifies its creator (not when the creator moves it)', async () => {
    const { owner, ownerUser, member, team } = await teamSetup();
    const task = (await owner.post('/api/tasks').send({ title: 'Ship it', team: team._id })).body.data;
    await member.patch(`/api/tasks/${task._id}/move`).send({ status: 'done', order: 0 });
    const notes = await Notification.find({ user: ownerUser._id, type: 'task_completed' });
    assert.equal(notes.length, 1);

    const own = (await owner.post('/api/tasks').send({ title: 'Mine', team: team._id })).body.data;
    await owner.patch(`/api/tasks/${own._id}/move`).send({ status: 'done', order: 0 });
    assert.equal(await Notification.countDocuments({ user: ownerUser._id, type: 'task_completed' }), 1);
  });

  it('move reorders cards inside the target column', async () => {
    const { owner, team } = await teamSetup();
    const a = (await owner.post('/api/tasks').send({ title: 'A', team: team._id })).body.data;
    const b = (await owner.post('/api/tasks').send({ title: 'B', team: team._id })).body.data;
    const c = (await owner.post('/api/tasks').send({ title: 'C', team: team._id })).body.data;
    // Initial column order: A, B, C. Move C to the top.
    await owner.patch(`/api/tasks/${c._id}/move`).send({ status: 'todo', order: 0 });
    const list = await owner.get(`/api/tasks?team=${team._id}&status=todo`);
    assert.deepEqual(list.body.data.map((t) => t.title), ['C', 'A', 'B']);
    assert.ok(a && b);
  });

  it('reassigning a task notifies the new assignee', async () => {
    const { owner, memberUser, team } = await teamSetup();
    const task = (await owner.post('/api/tasks').send({ title: 'Later', team: team._id })).body.data;
    const res = await owner.patch(`/api/tasks/${task._id}`).send({ assignee: memberUser._id });
    assert.equal(res.status, 200);
    assert.equal(await Notification.countDocuments({ user: memberUser._id, type: 'task_assigned' }), 1);
  });

  it('rejects a due date in the past on create', async () => {
    const a = agent();
    await register(a);
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const res = await a.post('/api/tasks').send({ title: 'Late', dueDate: yesterday });
    assert.equal(res.status, 400);
    assert.equal(res.body.errors.dueDate, 'Due date cannot be in the past');
  });

  it('accepts a due date later today (end of the chosen day)', async () => {
    const a = agent();
    await register(a);
    const laterToday = new Date(Date.now() + 60 * 1000).toISOString();
    const res = await a.post('/api/tasks').send({ title: 'Today', dueDate: laterToday });
    assert.equal(res.status, 201);
  });

  it('rejects changing a due date to the past, but allows other edits on an already-overdue task', async () => {
    const a = agent();
    await register(a);
    const task = (await a.post('/api/tasks').send({ title: 'Old' })).body.data;
    const past = new Date(Date.now() - 2 * 86400000);

    const bad = await a.patch(`/api/tasks/${task._id}`).send({ dueDate: past.toISOString() });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.errors.dueDate, 'Due date cannot be in the past');

    // Task became overdue over time: re-sending the same date with other edits is fine.
    await Task.updateOne({ _id: task._id }, { dueDate: past });
    const ok = await a.patch(`/api/tasks/${task._id}`).send({ title: 'Renamed', dueDate: past.toISOString() });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.title, 'Renamed');
  });
});
