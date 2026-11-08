const env = require('../config/env');
const { getCrmDb } = require('../config/database');
const { escapeRegex } = require('../utils/regex');

const COLLECTIONS = Object.freeze({
  SUBSCRIPTIONS: 'Subscriptions',
  CONTACTS: 'ContactProfiles',
  JOURNALS: 'Journals',
});

const SORT_FIELDS = Object.freeze({
  startDate: 'startDate',
  endDate: 'endDate',
  customerName: 'contact.name',
  status: 'status',
  package: 'package',
});

const AGG_OPTIONS = () => ({ maxTimeMS: env.REPORT_QUERY_TIMEOUT_MS, allowDiskUse: true });

const TWO_POW_32 = 4294967296;

// CRM stores service_terms dates as Unix seconds, either as a plain number/string
// or as a serialised 64-bit Long object ({ low, high, unsigned }) with signed 32-bit halves.
const epochSecondsToLong = (field) => ({
  $cond: [
    { $eq: [{ $type: field }, 'object'] },
    {
      $add: [
        {
          $let: {
            vars: { low: { $convert: { input: `${field}.low`, to: 'long', onError: 0, onNull: 0 } } },
            in: { $cond: [{ $lt: ['$$low', 0] }, { $add: ['$$low', TWO_POW_32] }, '$$low'] },
          },
        },
        { $multiply: [{ $convert: { input: `${field}.high`, to: 'long', onError: 0, onNull: 0 } }, TWO_POW_32] },
      ],
    },
    { $convert: { input: field, to: 'long', onError: null, onNull: null } },
  ],
});

const epochSecondsToDate = (field) => ({
  $toDate: { $multiply: [epochSecondsToLong(field), 1000] },
});

const firstValue = (field) => ({
  $cond: [{ $isArray: field }, { $arrayElemAt: [field, 0] }, field],
});

function serviceMatch(report, filters) {
  const match = { 'product.name': { $in: [...report.products] } };
  if (filters.state) match.state = filters.state;
  return match;
}

function dateConditions(filters, now) {
  const conditions = [];
  if (filters.startFrom) conditions.push({ startDate: { $gte: filters.startFrom } });
  if (filters.startTo) conditions.push({ startDate: { $lte: filters.startTo } });
  if (filters.endFrom) conditions.push({ endDate: { $gte: filters.endFrom } });
  if (filters.endTo) conditions.push({ endDate: { $lte: filters.endTo } });
  if (filters.expiry === 'active') conditions.push({ endDate: { $gte: now } });
  if (filters.expiry === 'expired') conditions.push({ endDate: { $lt: now } });
  return conditions;
}

/**
 * Subscriptions → unwind services → keep only the report's products →
 * join the contact only if it carries the report's tag.
 */
function buildBasePipeline(report, filters, now = new Date()) {
  const service = serviceMatch(report, filters);
  const unwoundMatch = Object.fromEntries(Object.entries(service).map(([k, v]) => [`services.${k}`, v]));

  const pipeline = [
    { $match: { services: { $elemMatch: service } } },
    { $project: { _id: 0, contact_id: 1, services: 1 } },
    { $unwind: '$services' },
    { $match: unwoundMatch },
    {
      $project: {
        contactId: '$contact_id',
        serviceId: { $ifNull: ['$services.id', '$services.service_id'] },
        package: '$services.product.name',
        status: '$services.state',
        price: { $convert: { input: '$services.price_terms.price', to: 'double', onError: null, onNull: null } },
        startDate: epochSecondsToDate('$services.service_terms.start_date'),
        endDate: epochSecondsToDate('$services.service_terms.end_date'),
      },
    },
  ];

  const conditions = dateConditions(filters, now);
  if (conditions.length) pipeline.push({ $match: { $and: conditions } });

  pipeline.push(
    {
      $lookup: {
        from: COLLECTIONS.CONTACTS,
        localField: 'contactId',
        foreignField: 'contact_id',
        as: 'contact',
        pipeline: [
          { $match: { 'tags.name': report.tag } },
          {
            $project: {
              _id: 0,
              name: '$profile.name',
              type: '$profile.type',
              phone: firstValue('$phone'),
              email: firstValue('$email'),
              island: '$location.city',
              atoll: '$location.province',
              address: '$location.address_line1',
            },
          },
          { $limit: 1 },
        ],
      },
    },
    { $unwind: '$contact' }
  );

  if (filters.search) {
    const rx = new RegExp(escapeRegex(filters.search), 'i');
    pipeline.push({
      $match: {
        $or: [{ 'contact.name': rx }, { 'contact.phone': rx }, { 'contact.email': rx }, { contactId: rx }],
      },
    });
  }

  return pipeline;
}

const contactCodeStages = [
  {
    $lookup: {
      from: COLLECTIONS.JOURNALS,
      localField: 'contactId',
      foreignField: 'contact_id',
      as: 'journal',
      pipeline: [{ $project: { _id: 0, contact_code: 1 } }, { $limit: 1 }],
    },
  },
  {
    $project: {
      _id: 0,
      contactCode: { $toString: { $arrayElemAt: ['$journal.contact_code', 0] } },
      contactId: 1,
      serviceId: 1,
      package: 1,
      status: 1,
      price: 1,
      startDate: 1,
      endDate: 1,
      contact: 1,
    },
  },
];

function sortStage(filters) {
  const direction = filters.sortOrder === 'asc' ? 1 : -1;
  return { $sort: { [SORT_FIELDS[filters.sortBy]]: direction, contactId: 1, serviceId: 1 } };
}

const subscriptionReportRepository = {
  SORT_FIELDS,

  async findPage(report, filters) {
    const pipeline = [
      ...buildBasePipeline(report, filters),
      sortStage(filters),
      {
        $facet: {
          meta: [{ $count: 'total' }],
          rows: [{ $skip: (filters.page - 1) * filters.limit }, { $limit: filters.limit }, ...contactCodeStages],
        },
      },
    ];
    const [result] = await getCrmDb()
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .aggregate(pipeline, AGG_OPTIONS())
      .toArray();
    return { rows: result?.rows ?? [], total: result?.meta?.[0]?.total ?? 0 };
  },

  exportCursor(report, filters, maxRows) {
    const pipeline = [...buildBasePipeline(report, filters), sortStage(filters), { $limit: maxRows }, ...contactCodeStages];
    return getCrmDb()
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .aggregate(pipeline, { ...AGG_OPTIONS(), batchSize: 500 });
  },

  async summary(report) {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const pipeline = [
      ...buildBasePipeline(report, {}, now),
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          customers: { $addToSet: '$contactId' },
          active: { $sum: { $cond: [{ $gte: ['$endDate', now] }, 1, 0] } },
          expired: {
            $sum: { $cond: [{ $and: [{ $eq: [{ $type: '$endDate' }, 'date'] }, { $lt: ['$endDate', now] }] }, 1, 0] },
          },
          expiringIn30Days: {
            $sum: { $cond: [{ $and: [{ $gte: ['$endDate', now] }, { $lte: ['$endDate', soon] }] }, 1, 0] },
          },
        },
      },
      { $project: { _id: 0, total: 1, active: 1, expired: 1, expiringIn30Days: 1, customers: { $size: '$customers' } } },
    ];
    const [result] = await getCrmDb()
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .aggregate(pipeline, AGG_OPTIONS())
      .toArray();
    return result ?? { total: 0, customers: 0, active: 0, expired: 0, expiringIn30Days: 0 };
  },

  async distinctStates(report) {
    const service = serviceMatch(report, {});
    const pipeline = [
      { $match: { services: { $elemMatch: service } } },
      { $unwind: '$services' },
      { $match: { 'services.product.name': { $in: [...report.products] } } },
      { $group: { _id: '$services.state' } },
      { $match: { _id: { $type: 'string' } } },
      { $sort: { _id: 1 } },
    ];
    const rows = await getCrmDb()
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .aggregate(pipeline, AGG_OPTIONS())
      .toArray();
    return rows.map((row) => row._id);
  },
};

module.exports = subscriptionReportRepository;
