import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { docsRoutes } from './routes/docs.js';
import { employeeRoutes } from './routes/employees.js';
import { taskRoutes } from './routes/tasks.js';

/** Builds the Express app (kept separate from index.ts so tests can import it). */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api/docs', docsRoutes());
  app.use('/api/auth', authRoutes());
  app.use('/api/employees', employeeRoutes());
  app.use('/api/tasks', taskRoutes());

  // Must stay last: unmatched routes, then the error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
