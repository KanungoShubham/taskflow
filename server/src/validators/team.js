const { z } = require('zod');
const { email } = require('./auth');

const name = z
  .string({ required_error: 'Team name is required' })
  .trim()
  .min(2, 'Team name must be at least 2 characters')
  .max(60, 'Team name must be at most 60 characters');

const description = z.string().trim().max(300, 'Description must be at most 300 characters');

const createTeamSchema = z.object({ name, description: description.optional().default('') });

const updateTeamSchema = z
  .object({ name: name.optional(), description: description.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const addMemberSchema = z.object({ email });

module.exports = { createTeamSchema, updateTeamSchema, addMemberSchema };
