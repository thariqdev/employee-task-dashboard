import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from '../docs/openapi.js';

/** Mounted at /api/docs: the interactive page, plus the raw spec at /api/docs/openapi.json. */
export function docsRoutes() {
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'TaskDesk API docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  return router;
}
