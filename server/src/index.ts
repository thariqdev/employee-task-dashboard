import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`TaskDesk API listening on http://localhost:${config.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
