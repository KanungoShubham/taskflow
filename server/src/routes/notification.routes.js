const { Router } = require('express');
const ctrl = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

/**
 * GET /api/notifications
 * Access: logged in
 * Response: { data: { items: Notification[] (latest 20), unreadCount } }
 */
router.get('/', asyncHandler(ctrl.listNotifications));

/**
 * PATCH /api/notifications/read-all
 * Access: logged in
 * Response: { data: { updated } } (number of notifications marked read)
 */
router.patch('/read-all', asyncHandler(ctrl.markAllRead));

/**
 * PATCH /api/notifications/:id/read
 * Access: the notification's recipient
 * Response: { data: Notification }. 404 if it is not yours.
 */
router.patch('/:id/read', asyncHandler(ctrl.markRead));

module.exports = router;
