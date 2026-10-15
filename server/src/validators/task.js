const { z } = require('zod');
const { PRIORITIES, STATUSES } = require('../models/Task');

/** Empty string / undefined -> null, so forms can send "" to clear a field. */
const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

const objectId = (label) => z.string().regex(/^[a-f\d]{24}$/i, `Invalid ${label}`);

const title = z
  .string({ required_error: 'Title is required' })
  .trim()
  .min(1, 'Title is required')
  .max(120, 'Title must be at most 120 characters');
const description = z.string().trim().max(2000, 'Description must be at most 2000 characters');
const priority = z.enum(PRIORITIES, { errorMap: () => ({ message: 'Priority must be low, medium or high' }) });
const status = z.enum(STATUSES, { errorMap: () => ({ message: 'Status must be todo, in_progress or done' }) });
const dueDate = z.preprocess(
  emptyToNull,
  z.coerce.date({ errorMap: () => ({ message: 'Invalid due date' }) }).nullable()
);
const assignee = z.preprocess(emptyToNull, objectId('assignee').nullable());

const createTaskSchema = z.object({
  title,
  description: description.optional().default(''),
  priority: priority.optional().default('medium'),
  status: status.optional().default('todo'),
  dueDate: dueDate.optional(),
  team: z.preprocess(emptyToNull, objectId('team').nullable()).optional(),
  assignee: assignee.optional(),
});

const updateTaskSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    priority: priority.optional(),
    status: status.optional(),
    dueDate: dueDate.optional(),
    assignee: assignee.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const moveTaskSchema = z.object({
  status,
  order: z.coerce.number({ invalid_type_error: 'Order must be a number' }).int().min(0, 'Order must be 0 or more'),
});

const listTasksQuery = z.object({
  team: z.union([z.literal('personal'), objectId('team')]).optional(),
  status: status.optional(),
  priority: priority.optional(),
  assignee: z.union([z.literal('me'), objectId('assignee')]).optional(),
  search: z.string().trim().max(100).optional(),
});

module.exports = { createTaskSchema, updateTaskSchema, moveTaskSchema, listTasksQuery };
