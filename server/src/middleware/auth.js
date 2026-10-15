const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Requires a valid login cookie. Sets req.user = { _id, name, email }.
 * Responds 401 if the cookie is missing, invalid, expired, or the user no longer exists.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies.token;
  if (!token) throw new ApiError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await User.findById(payload.id).lean();
  if (!user) throw new ApiError(401, 'Not authenticated');

  req.user = { _id: user._id, name: user.name, email: user.email };
  next();
});

module.exports = { requireAuth };
