const { ZodError } = require('zod');
const env = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
}

function normalise(err) {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    return new AppError(400, 'Validation failed', {
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  if (err?.type === 'entity.parse.failed') return new AppError(400, 'Malformed JSON body');
  if (err?.type === 'entity.too.large') return new AppError(413, 'Request body too large', { code: 'PAYLOAD_TOO_LARGE' });
  if (err?.code === 11000) return new AppError(409, 'A record with the same unique value already exists');
  if (err?.name === 'CastError') return new AppError(400, 'Invalid identifier');
  if (err?.name === 'MongoServerError' && err?.code === 50) {
    return new AppError(504, 'The report query took too long. Narrow the filters and try again.', { code: 'QUERY_TIMEOUT' });
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const known = normalise(err);
  const status = known?.statusCode ?? 500;

  if (status >= 500) {
    logger.error({ err, requestId: req.id, path: req.path }, 'Unhandled error');
  } else {
    logger.warn({ code: known.code, requestId: req.id, path: req.path }, known.message);
  }

  if (res.headersSent) {
    res.destroy(err);
    return;
  }

  res.status(status).json({
    error: {
      code: known?.code ?? 'INTERNAL_ERROR',
      message: known?.message ?? 'An unexpected error occurred',
      ...(known?.details && { details: known.details }),
      requestId: req.id,
      ...(!env.isProduction && !known && { debug: err?.message }),
    },
  });
}

module.exports = { notFound, errorHandler };
