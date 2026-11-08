const { z } = require('zod');
const { REPORT_TYPE_KEYS } = require('../config/reports');
const { optional, dateString, pagination } = require('./common');

const SORT_BY = ['startDate', 'endDate', 'customerName', 'status', 'package'];

const reportParams = z.object({ type: z.enum(REPORT_TYPE_KEYS) });

const filterFields = {
  search: optional(z.string().trim().max(100)),
  state: optional(
    z
      .string()
      .trim()
      .max(50)
      .regex(/^[A-Za-z0-9 _-]+$/, 'Invalid status')
  ),
  expiry: z.enum(['all', 'active', 'expired']).default('all'),
  startFrom: optional(dateString),
  startTo: optional(dateString),
  endFrom: optional(dateString),
  endTo: optional(dateString),
  sortBy: z.enum(SORT_BY).default('endDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
};

const rangesAreOrdered = (data) =>
  (!data.startFrom || !data.startTo || data.startFrom <= data.startTo) &&
  (!data.endFrom || !data.endTo || data.endFrom <= data.endTo);

const rangeMessage = { message: '"From" date must be on or before the "To" date', path: ['dates'] };

const reportQuery = z.object({ ...pagination, ...filterFields }).refine(rangesAreOrdered, rangeMessage);

const exportQuery = z.object(filterFields).refine(rangesAreOrdered, rangeMessage);

module.exports = { reportParams, reportQuery, exportQuery };
