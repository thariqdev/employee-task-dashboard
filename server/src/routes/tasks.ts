import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from '../validators/task.js';

export function taskRoutes() {
  const router = Router();

  // Every task route needs a logged-in admin.
  router.use(requireAuth);

  router.get('/', validate(listTasksQuerySchema, 'query'), taskController.list);
  router.post('/', validate(createTaskSchema), taskController.create);
  router.patch(
    '/:id',
    validate(taskIdParamSchema, 'params'),
    validate(updateTaskSchema),
    taskController.update,
  );
  router.delete('/:id', validate(taskIdParamSchema, 'params'), taskController.remove);

  return router;
}
