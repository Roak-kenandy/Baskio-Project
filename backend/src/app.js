const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');
const { isHealthy } = require('./config/database');
const { requestId, noStore } = require('./middlewares/requestContext');
const sanitizeBody = require('./middlewares/sanitize');
const { csrfProtection } = require('./middlewares/csrf');
const { apiLimiter } = require('./middlewares/rateLimiters');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('query parser', 'simple');

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: { ignore: (req) => req.url.startsWith('/healthz') },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url.split('?')[0], ip: req.remoteAddress }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    })
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new AppError(403, 'Origin not allowed', { code: 'CORS_REJECTED' }));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id'],
      exposedHeaders: ['Content-Disposition', 'X-Request-Id'],
      maxAge: 600,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '20kb', strict: true }));
  app.use(cookieParser());
  app.use(sanitizeBody);

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => {
    const ready = await isHealthy();
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
  });

  app.use('/api/v1', noStore, apiLimiter, csrfProtection, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
