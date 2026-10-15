const mongoose = require('mongoose');

const TYPES = ['task_assigned', 'team_added', 'task_completed'];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
    type: { type: String, enum: TYPES, required: true },
    message: { type: String, required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES = TYPES;
