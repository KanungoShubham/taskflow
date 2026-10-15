const { Router } = require('express');
const { myStats } = require('../controllers/stats.controller');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

/**
 * GET /api/users/me/stats
 * Access: logged in
 * Response: { data: { todo, in_progress, done, overdue, total } }
 * Counts tasks assigned to me and my personal tasks.
 */
router.get('/me/stats', asyncHandler(myStats));

module.exports = router;
