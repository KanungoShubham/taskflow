const { Router } = require('express');
const ctrl = require('../controllers/team.controller');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { createTeamSchema, updateTeamSchema, addMemberSchema } = require('../validators/team');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

/**
 * GET /api/teams
 * Access: logged in
 * Response: { data: Team[] } teams I belong to, each with taskCounts: { total, done }
 */
router.get('/', asyncHandler(ctrl.listTeams));

/**
 * POST /api/teams
 * Access: logged in (creator becomes owner)
 * Body: { name, description? }
 * Response: 201 { data: Team }
 */
router.post('/', validate({ body: createTeamSchema }), asyncHandler(ctrl.createTeam));

/**
 * GET /api/teams/:id
 * Access: team members
 * Response: { data: Team } with owner and members populated. 404 for non-members.
 */
router.get('/:id', asyncHandler(ctrl.getTeam));

/**
 * PATCH /api/teams/:id
 * Access: team owner
 * Body: { name?, description? }
 * Response: { data: Team }
 */
router.patch('/:id', validate({ body: updateTeamSchema }), asyncHandler(ctrl.updateTeam));

/**
 * DELETE /api/teams/:id
 * Access: team owner. Also deletes all tasks of the team.
 * Response: { data: { message } }
 */
router.delete('/:id', asyncHandler(ctrl.deleteTeam));

/**
 * GET /api/teams/:id/progress
 * Access: team members
 * Response: { data: { total, byStatus: { todo, in_progress, done }, percent, members: [{ user, assigned, done }] } }
 */
router.get('/:id/progress', asyncHandler(ctrl.getProgress));

/**
 * POST /api/teams/:id/members
 * Access: team owner
 * Body: { email } of an existing user
 * Response: 201 { data: Team }. 404 if no such user, 409 if already a member.
 * Side effect: the new member gets a `team_added` notification.
 */
router.post('/:id/members', validate({ body: addMemberSchema }), asyncHandler(ctrl.addMember));

/**
 * DELETE /api/teams/:id/members/:userId
 * Access: team owner (the owner cannot be removed)
 * Response: { data: Team }. The member's tasks in this team become unassigned.
 */
router.delete('/:id/members/:userId', asyncHandler(ctrl.removeMember));

module.exports = router;
