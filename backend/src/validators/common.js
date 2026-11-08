const { z } = require('zod');
const { isValidDateString } = require('../utils/dates');

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);

const optional = (schema) => z.preprocess(emptyToUndefined, schema.optional());

const idParams = z.object({ id: z.uuid('Invalid identifier') });

const dateString = z.string().refine(isValidDateString, 'Use the YYYY-MM-DD date format');

const pagination = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((value) => [10, 25, 50, 100].includes(value), 'Limit must be 10, 25, 50 or 100')
    .default(25),
};

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(50)
  .regex(/^[a-z0-9._-]+$/, 'Username may only contain letters, numbers, dots, dashes and underscores');

const password = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

module.exports = { optional, idParams, dateString, pagination, username, password };
