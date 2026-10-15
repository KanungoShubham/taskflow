/**
 * Access control helpers. Every controller loads teams/tasks through these, so the
 * "who can see what" rules live in one place.
 *
 * Non-members get 404 (not 403) so the API does not reveal that a team or task exists.
 */
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

const USER_FIELDS = 'name email';

const sameId = (a, b) => String(a && a._id ? a._id : a) === String(b && b._id ? b._id : b);

/** True if userId is the team's owner. */
function isOwner(team, userId) {
  return sameId(team.owner, userId);
}

/** True if userId is in team.members (works for populated and plain ids). */
function isMember(team, userId) {
  return team.members.some((m) => sameId(m, userId));
}

/** Loads a team the user belongs to (owner/members populated) or throws 404. */
async function getTeamForMember(teamId, userId) {
  if (!mongoose.isValidObjectId(teamId)) throw new ApiError(404, 'Team not found');
  const team = await Team.findById(teamId).populate('owner', USER_FIELDS).populate('members', USER_FIELDS);
  if (!team || !isMember(team, userId)) throw new ApiError(404, 'Team not found');
  return team;
}

/** Throws 403 unless the user owns the team. */
function assertOwner(team, userId) {
  if (!isOwner(team, userId)) throw new ApiError(403, 'Only the team owner can do this');
}

/**
 * Loads a task the user may see:
 * - personal task: only its creator
 * - team task: any team member
 * Returns { task, team } (team is null for personal tasks) or throws 404.
 */
async function getTaskForUser(taskId, userId) {
  if (!mongoose.isValidObjectId(taskId)) throw new ApiError(404, 'Task not found');
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  if (!task.team) {
    if (!sameId(task.createdBy, userId)) throw new ApiError(404, 'Task not found');
    return { task, team: null };
  }

  const team = await Team.findById(task.team);
  if (!team || !isMember(team, userId)) throw new ApiError(404, 'Task not found');
  return { task, team };
}

/** Creator of the task, or owner of its team, may edit details or delete it. */
function canManageTask(task, team, userId) {
  return sameId(task.createdBy, userId) || (team && isOwner(team, userId));
}

module.exports = { sameId, isOwner, isMember, getTeamForMember, assertOwner, getTaskForUser, canManageTask, USER_FIELDS };
