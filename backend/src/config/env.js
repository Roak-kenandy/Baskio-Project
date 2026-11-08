const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const csvList = (fallback) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );

const booleanString = (fallback) =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5050),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    DB_HOST: z.string().min(1).default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
    DB_SSL: booleanString('false'),
    DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(100).default(10),

    CRM_MONGO_URI: z.string().min(1, 'CRM_MONGO_URI is required'),
    CRM_DB_NAME: z.string().optional(),

    JWT_ACCESS_SECRET: z.string().min(48, 'JWT_ACCESS_SECRET must be at least 48 characters'),
    JWT_ISSUER: z.string().default('baskio-reports-api'),
    JWT_AUDIENCE: z.string().default('baskio-reports-web'),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
    REFRESH_TOKEN_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(12),

    CORS_ORIGINS: csvList('http://localhost:5173'),
    COOKIE_SECURE: booleanString('true'),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
    LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    AUDIT_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(400),

    REPORT_TIMEZONE: z.string().default('Indian/Maldives'),
    REPORT_MEDIANET_TV_TAG: z.string().default('Medianet TV'),
    REPORT_MEDIANET_TV_PRODUCTS: csvList('BAISKOAFU'),
    REPORT_OTT_TAG: z.string().default('OTT'),
    REPORT_OTT_PRODUCTS: csvList('BAISKOAFU OTT'),
    REPORT_QUERY_TIMEOUT_MS: z.coerce.number().int().min(5000).max(600000).default(120000),
    EXPORT_MAX_ROWS: z.coerce.number().int().min(100).max(500000).default(50000),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV === 'production' && !cfg.COOKIE_SECURE) {
      ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'COOKIE_SECURE must be true in production' });
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: cfg.REPORT_TIMEZONE });
    } catch {
      ctx.addIssue({ code: 'custom', path: ['REPORT_TIMEZONE'], message: 'Invalid IANA timezone' });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
});

module.exports = env;
