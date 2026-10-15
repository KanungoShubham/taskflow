const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');

/** Latest 20 notifications for the user plus the total unread count. */
async function listNotifications(req, res) {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ data: { items, unreadCount } });
}

/** Marks one of the user's notifications as read. */
async function markRead(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Notification not found');
  const note = await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { read: true }, { new: true });
  if (!note) throw new ApiError(404, 'Notification not found');
  res.json({ data: note });
}

/** Marks all of the user's notifications as read. */
async function markAllRead(req, res) {
  const result = await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ data: { updated: result.modifiedCount } });
}

module.exports = { listNotifications, markRead, markAllRead };
