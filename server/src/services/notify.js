const Notification = require('../models/Notification');

/**
 * Creates an in-app notification.
 * - Skips it when the recipient is the person who triggered it (no "you assigned yourself").
 * - Never throws: a failed notification must not fail the main action.
 *
 * @param {{ user, type, message, task?, team?, actor? }} input
 */
async function notify({ user, type, message, task = null, team = null, actor = null }) {
  if (!user) return null;
  if (actor && String(user) === String(actor)) return null;
  try {
    return await Notification.create({ user, type, message, task, team });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') console.error('Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { notify };
