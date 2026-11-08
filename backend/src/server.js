const env = require('./config/env');
const logger = require('./utils/logger');
const { connectAppDb, connectCrmDb, disconnectAll } = require('./config/database');
const { startMaintenance } = require('./services/maintenance.service');
const createApp = require('./app');

async function start() {
  await Promise.all([connectAppDb(), connectCrmDb()]);
  startMaintenance();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Baskio Reports API listening');
  });

  server.headersTimeout = 65000;
  server.requestTimeout = env.REPORT_QUERY_TIMEOUT_MS + 60000;

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectAll();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 15000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

start().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
