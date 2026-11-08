const { z } = require('zod');
const { ROLES, ALL_PERMISSIONS } = require('../constants/permissions');
const { optional, pagination, username, password } = require('./common');

const permissions = z
  .array(z.enum(ALL_PERMISSIONS))
  .max(ALL_PERMISSIONS.length)
  .transform((list) => [...new Set(list)]);

const fullName = z.string().trim().min(2, 'Full name is required').max(100);
const email = z.preprocess((v) => (v === '' ? undefined : v), z.email('Invalid email').max(254).toLowerCase().optional());

const listUsersQuery = z.object({
  ...pagination,
  search: optional(z.string().trim().max(100)),
});

const createUserBody = z.object({
  username,
  fullName,
  email,
  role: z.enum(Object.values(ROLES)).default(ROLES.USER),
  permissions: permissions.default([]),
  password,
});

const updateUserBody = z
  .object({
    fullName: fullName.optional(),
    email,
    role: z.enum(Object.values(ROLES)).optional(),
    permissions: permissions.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), 'Nothing to update');

const resetPasswordBody = z.object({ password });

module.exports = { listUsersQuery, createUserBody, updateUserBody, resetPasswordBody };
