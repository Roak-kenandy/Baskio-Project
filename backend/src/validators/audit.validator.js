const { z } = require('zod');
const { optional, dateString, pagination } = require('./common');

const listAuditLogsQuery = z.object({
  ...pagination,
  action: optional(
    z
      .string()
      .max(60)
      .regex(/^[a-z_.]+$/, 'Invalid action')
  ),
  username: optional(z.string().trim().toLowerCase().max(50)),
  status: optional(z.enum(['success', 'failure'])),
  from: optional(dateString),
  to: optional(dateString),
});

module.exports = { listAuditLogsQuery };
