import { Router } from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from '../validators/employee.js';

export function employeeRoutes() {
  const router = Router();

  // Every employee route needs a logged-in admin.
  router.use(requireAuth);

  router.get('/', validate(listEmployeesQuerySchema, 'query'), employeeController.list);
  router.post('/', validate(createEmployeeSchema), employeeController.create);
  router.patch(
    '/:id',
    validate(employeeIdParamSchema, 'params'),
    validate(updateEmployeeSchema),
    employeeController.update,
  );
  router.delete('/:id', validate(employeeIdParamSchema, 'params'), employeeController.remove);

  return router;
}
