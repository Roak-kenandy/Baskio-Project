const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { applySchema } = require('../database/schema');

mongoose.set('strictQuery', true);

let pool = null;
let crmConnection = null;

/** MySQL holds the application's own data: users, sessions and the audit trail. */
async function connectAppDb() {
  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    timezone: 'Z',
    charset: 'utf8mb4',
    multipleStatements: false,
    enableKeepAlive: true,
  });
  await pool.query('SELECT 1');
  await applySchema(pool);
  logger.info({ host: env.DB_HOST, database: env.DB_NAME }, 'Connected to application database (MySQL)');
}

function getPool() {
  if (!pool) throw new AppError(503, 'Application database is currently unavailable');
  return pool;
}

/**
 * The CRM database is only ever read. Use a MongoDB user with the `read` role
 * in CRM_MONGO_URI so a bug here can never modify CRM data.
 */
async function connectCrmDb() {
  const options = {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: env.REPORT_QUERY_TIMEOUT_MS + 30000,
    readPreference: 'secondaryPreferred',
    retryReads: true,
  };
  if (env.CRM_DB_NAME) options.dbName = env.CRM_DB_NAME;

  crmConnection = mongoose.createConnection(env.CRM_MONGO_URI, options);
  await crmConnection.asPromise();
  logger.info('Connected to CRM database (read-only usage)');
}

function getCrmDb() {
  if (!crmConnection || crmConnection.readyState !== 1) {
    throw new AppError(503, 'CRM database is currently unavailable');
  }
  return crmConnection.db;
}

async function isHealthy() {
  if (!pool || crmConnection?.readyState !== 1) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

async function disconnectAll() {
  await Promise.allSettled([pool?.end(), crmConnection?.close()]);
}

module.exports = { connectAppDb, connectCrmDb, getPool, getCrmDb, isHealthy, disconnectAll };
