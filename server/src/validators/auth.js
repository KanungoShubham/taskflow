const { z } = require('zod');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address');

const password = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password is too long');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email,
  password,
});

const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }).trim().min(1, 'Reset token is required'),
  password,
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, email };
