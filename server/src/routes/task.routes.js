const { Router } = require('express');
const ctrl = require('../controllers/task.controller');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { createTaskSchema, updateTaskSchema, moveTaskSchema, listTasksQuery } = require('../validators/task');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();
router.use(requireAuth);

/**
 * GET /api/tasks
 * Access: logged in
 * Query: team=<teamId>|personal, status, priority, assignee=<userId>|me, search
 * Response: { data: Task[] } sorted by board order (assignee, createdBy, team populated)
 */
router.get('/', validate({ query: listTasksQuery }), asyncHandler(ctrl.listTasks));

/**
 * POST /api/tasks
 * Access: logged in; for a team task you must be a member
 * Body: { title, description?, priority?, status?, dueDate?, team?, assignee? }
 * dueDate must not be in the past (400 errors.dueDate).
 * Response: 201 { data: Task }. The assignee gets a `task_assigned` notification.
 */
router.post('/', validate({ body: createTaskSchema }), asyncHandler(ctrl.createTask));

/**
 * GET /api/tasks/:id
 * Access: creator (personal) or team members (team task)
 * Response: { data: Task }
 */
router.get('/:id', asyncHandler(ctrl.getTask));

/**
 * PATCH /api/tasks/:id
 * Access: task creator or team owner
 * Body: any of { title, description, priority, status, dueDate, assignee }
 * A changed dueDate must not be in the past (an unchanged overdue date is allowed).
 * Response: { data: Task }. Notifies a new assignee, and the creator when it becomes done.
 */
router.patch('/:id', validate({ body: updateTaskSchema }), asyncHandler(ctrl.updateTask));

/**
 * PATCH /api/tasks/:id/move
 * Access: any team member (or the creator of a personal task). Used by board drag & drop.
 * Body: { status, order }  (order = 0-based position inside the target column)
 * Response: { data: Task }. Notifies the creator when moved to done.
 */
router.patch('/:id/move', validate({ body: moveTaskSchema }), asyncHandler(ctrl.moveTask));

/**
 * DELETE /api/tasks/:id
 * Access: task creator or team owner
 * Response: { data: { message } }
 */
router.delete('/:id', asyncHandler(ctrl.deleteTask));

module.exports = router;
