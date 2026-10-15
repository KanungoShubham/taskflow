const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    dueDate: { type: Date, default: null },
    // null = personal task (only visible to its creator)
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Position of the card inside its board column (lower = higher up).
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ team: 1, status: 1, order: 1 });
taskSchema.index({ createdBy: 1, team: 1 });
taskSchema.index({ assignee: 1 });

module.exports = mongoose.model('Task', taskSchema);
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
