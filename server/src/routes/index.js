const { Router } = require('express');
const authRoutes = require('./auth.routes');
const teamRoutes = require('./team.routes');
const taskRoutes = require('./task.routes');
const notificationRoutes = require('./notification.routes');
const userRoutes = require('./user.routes');

const router = Router();

/**
 * GET /api/health
 * Access: public
 * Response: { data: { status: 'ok' } } (used by uptime checks)
 */
router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

module.exports = router;
