const mongoose = require('mongoose');
const Team = require('../models/Team');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { notify } = require('../services/notify');
const { getTeamForMember, assertOwner, isMember, sameId, USER_FIELDS } = require('../services/access');

/** Re-reads a team with owner/members populated (for responses). */
const loadTeam = (id) => Team.findById(id).populate('owner', USER_FIELDS).populate('members', USER_FIELDS);

/** Creates a team. The creator becomes its owner and first member. */
async function createTeam(req, res) {
  const team = await Team.create({ ...req.body, owner: req.user._id, members: [req.user._id] });
  res.status(201).json({ data: await loadTeam(team._id) });
}

/** Lists the teams the user belongs to, each with { total, done } task counts. */
async function listTeams(req, res) {
  const teams = await Team.find({ members: req.user._id })
    .sort({ createdAt: -1 })
    .populate('owner', USER_FIELDS)
    .populate('members', USER_FIELDS)
    .lean();

  const counts = await Task.aggregate([
    { $match: { team: { $in: teams.map((t) => t._id) } } },
    { $group: { _id: '$team', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
  ]);
  const byTeam = new Map(counts.map((c) => [String(c._id), { total: c.total, done: c.done }]));

  res.json({ data: teams.map((t) => ({ ...t, taskCounts: byTeam.get(String(t._id)) || { total: 0, done: 0 } })) });
}

/** Returns one team (members only). */
async function getTeam(req, res) {
  const team = await getTeamForMember(req.params.id, req.user._id);
  res.json({ data: team });
}

/** Renames / updates the description (owner only). */
async function updateTeam(req, res) {
  const team = await getTeamForMember(req.params.id, req.user._id);
  assertOwner(team, req.user._id);
  Object.assign(team, req.body);
  await team.save();
  res.json({ data: await loadTeam(team._id) });
}

/** Deletes the team with all its tasks and related notifications (owner only). */
async function deleteTeam(req, res) {
  const team = await getTeamForMember(req.params.id, req.user._id);
  assertOwner(team, req.user._id);
  await Promise.all([
    Task.deleteMany({ team: team._id }),
    Notification.deleteMany({ team: team._id }),
    Team.deleteOne({ _id: team._id }),
  ]);
  res.json({ data: { message: 'Team deleted' } });
}

/** Adds an existing user to the team by email (owner only) and notifies them. */
async function addMember(req, res) {
  const team = await getTeamForMember(req.params.id, req.user._id);
  assertOwner(team, req.user._id);

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new ApiError(404, 'No user found with this email', { email: 'No user found with this email. Ask them to sign up first.' });
  }
  if (isMember(team, user._id)) {
    throw new ApiError(409, 'User is already a member', { email: 'This user is already a member of the team' });
  }

  team.members.push(user._id);
  await team.save();
  await notify({
    user: user._id,
    type: 'team_added',
    message: `${req.user.name} added you to the team "${team.name}"`,
    team: team._id,
    actor: req.user._id,
  });

  res.status(201).json({ data: await loadTeam(team._id) });
}

/** Removes a member (owner only). Their tasks in this team become unassigned. */
async function removeMember(req, res) {
  const team = await getTeamForMember(req.params.id, req.user._id);
  assertOwner(team, req.user._id);

  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId) || !isMember(team, userId)) throw new ApiError(404, 'Member not found');
  if (sameId(team.owner, userId)) throw new ApiError(400, 'The team owner cannot be removed');

  team.members = team.members.filter((m) => !sameId(m, userId));
  await team.save();
  await Task.updateMany({ team: team._id, assignee: userId }, { $set: { assignee: null } });

  res.json({ data: await loadTeam(team._id) });
}

/**
 * Team progress: totals per status, percent done, and per-member { assigned, done }.
 */
async function getProgress(req, res) {
  const team = await getTeamForMember(req.params.id, req.user._id);

  const [statusRows, memberRows] = await Promise.all([
    Task.aggregate([{ $match: { team: team._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([
      { $match: { team: team._id, assignee: { $ne: null } } },
      { $group: { _id: '$assignee', assigned: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    ]),
  ]);

  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  for (const row of statusRows) byStatus[row._id] = row.count;
  const total = byStatus.todo + byStatus.in_progress + byStatus.done;
  const percent = total === 0 ? 0 : Math.round((byStatus.done / total) * 100);

  const statsByUser = new Map(memberRows.map((r) => [String(r._id), r]));
  const members = team.members.map((m) => {
    const row = statsByUser.get(String(m._id));
    return { user: m, assigned: row ? row.assigned : 0, done: row ? row.done : 0 };
  });

  res.json({ data: { total, byStatus, percent, members } });
}

module.exports = { createTeam, listTeams, getTeam, updateTeam, deleteTeam, addMember, removeMember, getProgress };
