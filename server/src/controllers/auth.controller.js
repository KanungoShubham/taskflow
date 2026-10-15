const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const cookieOptions = () => ({
  httpOnly: true, // not readable from JavaScript -> safer against XSS
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});

/** Signs a JWT for the user and stores it in the `token` cookie. */
function sendAuthCookie(res, user) {
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { ...cookieOptions(), maxAge: SEVEN_DAYS });
}

/** Creates an account and logs the user in. */
async function register(req, res) {
  const { name, email, password } = req.body;
  const exists = await User.exists({ email });
  if (exists) {
    throw new ApiError(409, 'Email already registered', { email: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email, password });
  sendAuthCookie(res, user);
  res.status(201).json({ data: user });
}

/** Checks credentials and logs the user in. Same message for unknown email and wrong password. */
async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  sendAuthCookie(res, user);
  res.json({ data: user });
}

/**
 * Step 1 of "forgot password": checks the email exists and issues a one-time reset token.
 * Only a SHA-256 hash of the token is stored, so a database leak can't be used to reset passwords.
 *
 * NOTE: for this assessment the token is returned in the response (no email service).
 * In production it would be emailed as a link and the response would be the same for
 * every email, so it can't be used to discover which emails have accounts.
 */
async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new ApiError(404, 'No account found with this email', { email: 'No account found with this email' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL);
  await User.updateOne({ _id: user._id }, { resetPasswordToken: hashToken(resetToken), resetPasswordExpires: expiresAt });

  res.json({ data: { resetToken, expiresAt } });
}

/**
 * Step 2: sets a new password using a valid, unexpired token, then logs the user in.
 * The token is deleted so it can't be used twice.
 */
async function resetPassword(req, res) {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired. Please start again.');

  user.password = req.body.password; // hashed by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendAuthCookie(res, user);
  res.json({ data: user });
}

/** Clears the login cookie. */
function logout(req, res) {
  res.clearCookie('token', cookieOptions());
  res.json({ data: { message: 'Logged out' } });
}

/** Returns the logged-in user. */
function me(req, res) {
  res.json({ data: req.user });
}

module.exports = { register, login, logout, me, forgotPassword, resetPassword };
