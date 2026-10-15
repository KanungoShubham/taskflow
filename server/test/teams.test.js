const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { setupDb, agent, register } = require('./helpers');
const Notification = require('../src/models/Notification');
const Task = require('../src/models/Task');

setupDb();

async function ownerWithTeam() {
  const owner = agent();
  const ownerUser = await register(owner);
  const res = await owner.post('/api/teams').send({ name: 'Core Team', description: 'Main squad' });
  return { owner, ownerUser, team: res.body.data };
}

async function addMember(owner, teamId) {
  const member = agent();
  const memberUser = await register(member);
  const res = await owner.post(`/api/teams/${teamId}/members`).send({ email: memberUser.email });
  assert.equal(res.status, 201);
  return { member, memberUser };
}

describe('teams', () => {
  it('creates a team with the creator as owner and member', async () => {
    const { ownerUser, team } = await ownerWithTeam();
    assert.equal(team.name, 'Core Team');
    assert.equal(team.owner._id, ownerUser._id);
    assert.deepEqual(team.members.map((m) => m._id), [ownerUser._id]);
  });

  it('validates the team name', async () => {
    const a = agent();
    await register(a);
    const res = await a.post('/api/teams').send({ name: 'x' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.name);
  });

  it('lists only teams I belong to, with task counts', async () => {
    const { owner, team } = await ownerWithTeam();
    const other = agent();
    await register(other);
    await other.post('/api/teams').send({ name: 'Other Team' });
    await owner.post('/api/tasks').send({ title: 'T1', team: team._id });

    const res = await owner.get('/api/teams');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].name, 'Core Team');
    assert.deepEqual(res.body.data[0].taskCounts, { total: 1, done: 0 });
  });

  it('returns 404 for a non-member and for a malformed id', async () => {
    const { team } = await ownerWithTeam();
    const stranger = agent();
    await register(stranger);
    assert.equal((await stranger.get(`/api/teams/${team._id}`)).status, 404);
    assert.equal((await stranger.get('/api/teams/not-an-id')).status, 404);
  });

  it('owner adds a member by email and the member gets a notification', async () => {
    const { owner, team } = await ownerWithTeam();
    const { member, memberUser } = await addMember(owner, team._id);

    const notes = await Notification.find({ user: memberUser._id });
    assert.equal(notes.length, 1);
    assert.equal(notes[0].type, 'team_added');
    assert.equal((await member.get(`/api/teams/${team._id}`)).status, 200);
  });

  it('rejects unknown email, duplicate member, and non-owner adds', async () => {
    const { owner, team } = await ownerWithTeam();
    const unknown = await owner.post(`/api/teams/${team._id}/members`).send({ email: 'ghost@example.com' });
    assert.equal(unknown.status, 404);
    assert.ok(unknown.body.errors.email);

    const { member, memberUser } = await addMember(owner, team._id);
    const dup = await owner.post(`/api/teams/${team._id}/members`).send({ email: memberUser.email });
    assert.equal(dup.status, 409);

    const third = agent();
    const thirdUser = await register(third);
    const forbidden = await member.post(`/api/teams/${team._id}/members`).send({ email: thirdUser.email });
    assert.equal(forbidden.status, 403);
  });

  it('removing a member unassigns their tasks in the team; owner cannot be removed', async () => {
    const { owner, ownerUser, team } = await ownerWithTeam();
    const { memberUser } = await addMember(owner, team._id);
    const created = await owner.post('/api/tasks').send({ title: 'Assigned', team: team._id, assignee: memberUser._id });
    assert.equal(created.status, 201);

    const res = await owner.delete(`/api/teams/${team._id}/members/${memberUser._id}`);
    assert.equal(res.status, 200);
    const task = await Task.findById(created.body.data._id);
    assert.equal(task.assignee, null);

    const self = await owner.delete(`/api/teams/${team._id}/members/${ownerUser._id}`);
    assert.equal(self.status, 400);
  });

  it('computes progress: 2 of 4 done -> 50%', async () => {
    const { owner, ownerUser, team } = await ownerWithTeam();
    for (const status of ['todo', 'in_progress', 'done', 'done']) {
      await owner.post('/api/tasks').send({ title: status, team: team._id, status, assignee: ownerUser._id });
    }
    const res = await owner.get(`/api/teams/${team._id}/progress`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.total, 4);
    assert.equal(res.body.data.percent, 50);
    assert.deepEqual(res.body.data.byStatus, { todo: 1, in_progress: 1, done: 2 });
    const mine = res.body.data.members.find((m) => m.user._id === ownerUser._id);
    assert.equal(mine.assigned, 4);
    assert.equal(mine.done, 2);
  });

  it('owner can rename and delete the team (tasks removed); members cannot', async () => {
    const { owner, team } = await ownerWithTeam();
    const { member } = await addMember(owner, team._id);
    await owner.post('/api/tasks').send({ title: 'T', team: team._id });

    assert.equal((await member.patch(`/api/teams/${team._id}`).send({ name: 'Hacked' })).status, 403);
    const renamed = await owner.patch(`/api/teams/${team._id}`).send({ name: 'Renamed' });
    assert.equal(renamed.body.data.name, 'Renamed');

    assert.equal((await member.delete(`/api/teams/${team._id}`)).status, 403);
    assert.equal((await owner.delete(`/api/teams/${team._id}`)).status, 200);
    assert.equal(await Task.countDocuments({ team: team._id }), 0);
  });
});
