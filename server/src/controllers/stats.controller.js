const Task = require('../models/Task');

/**
 * Dashboard numbers for the logged-in user.
 * Counts "my work": tasks assigned to me + my personal tasks.
 * Overdue = not done and due date in the past.
 */
async function myStats(req, res) {
  const me = req.user._id;
  const match = { $or: [{ assignee: me }, { team: null, createdBy: me }] };

  const [rows, overdue] = await Promise.all([
    Task.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.countDocuments({ ...match, status: { $ne: 'done' }, dueDate: { $ne: null, $lt: new Date() } }),
  ]);

  const stats = { todo: 0, in_progress: 0, done: 0 };
  for (const row of rows) stats[row._id] = row.count;
  res.json({ data: { ...stats, overdue, total: stats.todo + stats.in_progress + stats.done } });
}

module.exports = { myStats };
