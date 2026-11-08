const env = require('../config/env');
const { REPORT_TYPES } = require('../config/reports');
const { PERMISSIONS } = require('../constants/permissions');
const subscriptionReportRepository = require('../repositories/subscriptionReport.repository');
const auditService = require('./audit.service');
const { maskPhone, maskEmail } = require('../utils/mask');
const { dayBoundary, formatDay } = require('../utils/dates');
const { toCsvRow } = require('../utils/csv');
const AppError = require('../utils/AppError');

const { AUDIT_ACTIONS } = auditService;
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

async function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

function waitForDrain(res) {
  return new Promise((resolve) => {
    const done = () => {
      res.off('drain', done);
      res.off('close', done);
      resolve();
    };
    res.on('drain', done);
    res.on('close', done);
  });
}

function getReportOrThrow(type, user) {
  const report = REPORT_TYPES[type];
  if (!report) throw new AppError(404, 'Report not found');
  if (!user.permissions.includes(report.permission)) {
    throw new AppError(403, 'You do not have access to this report');
  }
  return report;
}

/** Converts validated YYYY-MM-DD query values into UTC instants in the report timezone. */
function toRepositoryFilters(query) {
  const tz = env.REPORT_TIMEZONE;
  return {
    ...query,
    startFrom: query.startFrom ? dayBoundary(query.startFrom, tz) : undefined,
    startTo: query.startTo ? dayBoundary(query.startTo, tz, true) : undefined,
    endFrom: query.endFrom ? dayBoundary(query.endFrom, tz) : undefined,
    endTo: query.endTo ? dayBoundary(query.endTo, tz, true) : undefined,
  };
}

function toRow(raw, report, canViewPii, now = Date.now()) {
  const contact = raw.contact || {};
  const end = raw.endDate ? new Date(raw.endDate) : null;
  return {
    contactId: raw.contactId,
    contactCode: raw.contactCode ?? null,
    customerName: contact.name ?? null,
    customerType: contact.type ?? null,
    phone: canViewPii ? contact.phone ?? null : maskPhone(contact.phone) ?? null,
    email: canViewPii ? contact.email ?? null : maskEmail(contact.email) ?? null,
    island: contact.island ?? null,
    atoll: contact.atoll ?? null,
    address: canViewPii ? contact.address ?? null : null,
    tag: report.tag,
    serviceId: raw.serviceId ?? null,
    package: raw.package ?? null,
    status: raw.status ?? null,
    price: typeof raw.price === 'number' ? Math.round(raw.price * 100) / 100 : null,
    startDate: raw.startDate ?? null,
    endDate: raw.endDate ?? null,
    daysRemaining: end ? Math.ceil((end.getTime() - now) / 86400000) : null,
  };
}

const CSV_COLUMNS = [
  ['Contact Code', (r) => r.contactCode],
  ['Contact ID', (r) => r.contactId],
  ['Customer Name', (r) => r.customerName],
  ['Customer Type', (r) => r.customerType],
  ['Phone', (r) => r.phone],
  ['Email', (r) => r.email],
  ['Island', (r) => r.island],
  ['Atoll', (r) => r.atoll],
  ['Address', (r) => r.address],
  ['Tag', (r) => r.tag],
  ['Package', (r) => r.package],
  ['Status', (r) => r.status],
  ['Price', (r) => r.price],
  ['Subscription Start Date', (r) => formatDay(r.startDate, env.REPORT_TIMEZONE)],
  ['Subscription End Date', (r) => formatDay(r.endDate, env.REPORT_TIMEZONE)],
  ['Days Remaining', (r) => r.daysRemaining],
];

const reportService = {
  listAvailable(user) {
    return Object.values(REPORT_TYPES)
      .filter((report) => user.permissions.includes(report.permission))
      .map(({ key, label, tag, products }) => ({ key, label, tag, products }));
  },

  async getSubscriptions(type, query, user, context) {
    const report = getReportOrThrow(type, user);
    const canViewPii = user.permissions.includes(PERMISSIONS.REPORT_PII_VIEW);

    const { rows, total } = await subscriptionReportRepository.findPage(report, toRepositoryFilters(query));

    await auditService.record({
      actor: user,
      action: AUDIT_ACTIONS.REPORT_VIEW,
      targetType: 'report',
      targetId: report.key,
      metadata: { filters: query, resultCount: total },
      context,
    });

    return {
      report: { key: report.key, label: report.label, tag: report.tag, products: report.products },
      items: rows.map((row) => toRow(row, report, canViewPii)),
      total,
      page: query.page,
      limit: query.limit,
      piiMasked: !canViewPii,
    };
  },

  getStates(type, user) {
    const report = getReportOrThrow(type, user);
    return cached(`states:${report.key}`, () => subscriptionReportRepository.distinctStates(report));
  },

  async getSummary(user) {
    const reports = Object.values(REPORT_TYPES).filter((r) => user.permissions.includes(r.permission));
    const summaries = await Promise.all(
      reports.map(async (report) => ({
        key: report.key,
        label: report.label,
        tag: report.tag,
        products: report.products,
        ...(await cached(`summary:${report.key}`, () => subscriptionReportRepository.summary(report))),
      }))
    );
    return { reports: summaries, generatedAt: new Date().toISOString() };
  },

  /** Streams CSV rows straight from the database cursor so large exports stay memory-bounded. */
  async exportSubscriptions(type, query, user, context, res) {
    const report = getReportOrThrow(type, user);
    const canViewPii = user.permissions.includes(PERMISSIONS.REPORT_PII_VIEW);
    const filters = toRepositoryFilters(query);
    const cursor = subscriptionReportRepository.exportCursor(report, filters, env.EXPORT_MAX_ROWS);

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${report.key}-subscriptions-${stamp}.csv"`);

    let count = 0;
    let aborted = false;
    res.on('close', () => {
      if (!res.writableFinished) {
        aborted = true;
        cursor.close().catch(() => {});
      }
    });

    try {
      res.write('\uFEFF');
      res.write(toCsvRow(CSV_COLUMNS.map(([header]) => header)));
      const now = Date.now();
      for await (const raw of cursor) {
        if (aborted) break;
        const row = toRow(raw, report, canViewPii, now);
        if (!res.write(toCsvRow(CSV_COLUMNS.map(([, pick]) => pick(row))))) {
          await waitForDrain(res);
        }
        count += 1;
      }
      res.end();
    } finally {
      await cursor.close().catch(() => {});
      await auditService.record({
        actor: user,
        action: AUDIT_ACTIONS.REPORT_EXPORT,
        status: aborted ? 'failure' : 'success',
        targetType: 'report',
        targetId: report.key,
        metadata: { filters: query, rowCount: count, piiMasked: !canViewPii, truncated: count >= env.EXPORT_MAX_ROWS },
        context,
      });
    }
  },
};

module.exports = reportService;
