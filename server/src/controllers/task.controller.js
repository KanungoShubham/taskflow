const Task = require('../models/Task');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');
const { notify } = require('../services/notify');
const { getTeamForMember, getTaskForUser, canManageTask, isMember, sameId, USER_FIELDS } = require('../services/access');

/** Populates the fields the UI needs on every task. */
const populateTask = (query) =>
  query.populate('assignee', USER_FIELDS).populate('createdBy', USER_FIELDS).populate('team', 'name');

/** Escapes user input before using it in a RegExp. */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Mongo filter for one board column: same team (or same owner's personal list) + status. */
function columnFilter(task, status) {
  return task.team ? { team: task.team, status } : { team: null, createdBy: task.createdBy, status };
}

/** Rewrites `order` as 0..n-1 for a column so positions stay compact. */
async function normalizeColumn(filter) {
  const tasks = await Task.find(filter).sort({ order: 1, updatedAt: -1 }).select('_id order');
  const ops = tasks
    .map((t, i) => (t.order === i ? null : { updateOne: { filter: { _id: t._id }, update: { $set: { order: i } } } }))
    .filter(Boolean);
  if (ops.length) await Task.bulkWrite(ops);
}

/**
 * Due dates can't be in the past. The client sends the END of the chosen day in the user's
 * own timezone, so "is it already over?" is exact for every timezone.
 * `current` lets an already-overdue task keep its date while other fields are edited.
 */
function checkDueDate(dueDate, current = null) {
  if (!dueDate || dueDate.getTime() >= Date.now()) return;
  if (current && current.getTime() === dueDate.getTime()) return;
  throw new ApiError(400, 'Validation failed', { dueDate: 'Due date cannot be in the past' });
}

/** Ensures the assignee is valid for the task's team. */
function checkAssignee(team, assignee) {
  if (!assignee) return;
  if (!team) throw new ApiError(400, 'Validation failed', { assignee: 'Personal tasks cannot be assigned' });
  if (!isMember(team, assignee)) throw new ApiError(400, 'Validation failed', { assignee: 'Assignee must be a team member' });
}

function notifyAssigned(task, team, actor) {
  return notify({
    user: task.assignee,
    type: 'task_assigned',
    message: `${actor.name} assigned you "${task.title}" in ${team.name}`,
    task: task._id,
    team: team._id,
    actor: actor._id,
  });
}

function notifyCompleted(task, team, actor) {
  return notify({
    user: task.createdBy,
    type: 'task_completed',
    message: `${actor.name} completed "${task.title}"${team ? ` in ${team.name}` : ''}`,
    task: task._id,
    team: team ? team._id : null,
    actor: actor._id,
  });
}

/**
 * Lists tasks the user can see.
 * - team=<id>: all tasks of that team (members only)
 * - team=personal: my personal tasks
 * - no team: my personal tasks + team tasks I created or am assigned to
 */
async function listTasks(req, res) {
  const { team, status, priority, assignee, search } = req.validQuery;
  const me = req.user._id;
  const filter = {};

  if (team === 'personal') {
    Object.assign(filter, { team: null, createdBy: me });
  } else if (team) {
    await getTeamForMember(team, me);
    filter.team = team;
  } else {
    const myTeams = await Team.find({ members: me }).distinct('_id');
    filter.$or = [
      { team: null, createdBy: me },
      { team: { $in: myTeams }, $or: [{ createdBy: me }, { assignee: me }] },
    ];
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee === 'me' ? me : assignee;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  const tasks = await populateTask(Task.find(filter).sort({ order: 1, createdAt: -1 }));
  res.json({ data: tasks });
}

/** Returns one task. */
async function getTask(req, res) {
  const { task } = await getTaskForUser(req.params.id, req.user._id);
  res.json({ data: await populateTask(Task.findById(task._id)) });
}

/** Creates a personal or team task. The new card goes to the bottom of its column. */
async function createTask(req, res) {
  const { team: teamId, assignee, ...fields } = req.body;
  const team = teamId ? await getTeamForMember(teamId, req.user._id) : null;
  checkAssignee(team, assignee);
  checkDueDate(fields.dueDate);

  const draft = { ...fields, team: team ? team._id : null, assignee: assignee || null, createdBy: req.user._id };
  const last = await Task.findOne(columnFilter(draft, draft.status)).sort({ order: -1 }).select('order');
  const task = await Task.create({ ...draft, order: last ? last.order + 1 : 0 });

  if (team && task.assignee) await notifyAssigned(task, team, req.user);
  res.status(201).json({ data: await populateTask(Task.findById(task._id)) });
}

/** Edits task details (creator or team owner). Notifies on reassignment and completion. */
async function updateTask(req, res) {
  const { task, team } = await getTaskForUser(req.params.id, req.user._id);
  if (!canManageTask(task, team, req.user._id)) {
    throw new ApiError(403, 'Only the task creator or team owner can edit this task');
  }

  const updates = req.body;
  if (updates.assignee !== undefined) checkAssignee(team, updates.assignee);
  if (updates.dueDate !== undefined) checkDueDate(updates.dueDate, task.dueDate);

  const assigneeChanged = updates.assignee !== undefined && !sameId(updates.assignee, task.assignee);
  const becameDone = updates.status === 'done' && task.status !== 'done';
  const statusChanged = updates.status !== undefined && updates.status !== task.status;

  Object.assign(task, updates);
  if (statusChanged) {
    const last = await Task.findOne(columnFilter(task, task.status)).sort({ order: -1 }).select('order');
    task.order = last ? last.order + 1 : 0;
  }
  await task.save();

  if (assigneeChanged && task.assignee) await notifyAssigned(task, team, req.user);
  if (becameDone) await notifyCompleted(task, team, req.user);

  res.json({ data: await populateTask(Task.findById(task._id)) });
}

/**
 * Moves a card on the board to { status, order } (any member).
 * Cards at or below the target position shift down by one, then both columns are re-numbered.
 */
async function moveTask(req, res) {
  const { task, team } = await getTaskForUser(req.params.id, req.user._id);
  const { status, order } = req.body;
  const fromStatus = task.status;

  await Task.updateMany(
    { ...columnFilter(task, status), _id: { $ne: task._id }, order: { $gte: order } },
    { $inc: { order: 1 } }
  );
  task.status = status;
  task.order = order;
  await task.save();

  await normalizeColumn(columnFilter(task, status));
  if (fromStatus !== status) await normalizeColumn(columnFilter(task, fromStatus));
  if (status === 'done' && fromStatus !== 'done') await notifyCompleted(task, team, req.user);

  res.json({ data: await populateTask(Task.findById(task._id)) });
}

/** Deletes a task (creator or team owner). */
async function deleteTask(req, res) {
  const { task, team } = await getTaskForUser(req.params.id, req.user._id);
  if (!canManageTask(task, team, req.user._id)) {
    throw new ApiError(403, 'Only the task creator or team owner can delete this task');
  }
  await task.deleteOne();
  res.json({ data: { message: 'Task deleted' } });
}

module.exports = { listTasks, getTask, createTask, updateTask, moveTask, deleteTask };
