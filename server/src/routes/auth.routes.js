const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// Slows down password guessing and reset abuse: 10 attempts per 15 minutes per IP (per route).
const authLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  });

/**
 * POST /api/auth/register
 * Access: public
 * Body: { name, email, password }
 * Response: 201 { data: user } and sets the `token` cookie. 409 if the email is taken.
 */
router.post('/register', validate({ body: registerSchema }), asyncHandler(ctrl.register));

/**
 * POST /api/auth/login
 * Access: public (rate limited)
 * Body: { email, password }
 * Response: 200 { data: user } and sets the `token` cookie. 401 on wrong credentials.
 */
router.post('/login', authLimiter(), validate({ body: loginSchema }), asyncHandler(ctrl.login));

/**
 * POST /api/auth/forgot-password
 * Access: public (rate limited)
 * Body: { email }
 * Response: 200 { data: { resetToken, expiresAt } } (token valid 15 min, single use).
 * 404 { errors.email } if no account uses this email.
 */
router.post('/forgot-password', authLimiter(), validate({ body: forgotPasswordSchema }), asyncHandler(ctrl.forgotPassword));

/**
 * POST /api/auth/reset-password
 * Access: public (rate limited)
 * Body: { token, password }
 * Response: 200 { data: user } and sets the `token` cookie (logged in).
 * 400 if the token is invalid, used or expired.
 */
router.post('/reset-password', authLimiter(), validate({ body: resetPasswordSchema }), asyncHandler(ctrl.resetPassword));

/**
 * POST /api/auth/logout
 * Access: public
 * Response: 200 and clears the `token` cookie.
 */
router.post('/logout', ctrl.logout);

/**
 * GET /api/auth/me
 * Access: logged in
 * Response: 200 { data: { _id, name, email } }
 */
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
