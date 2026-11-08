const env = require('./env');
const { PERMISSIONS } = require('../constants/permissions');

const REPORT_TYPES = Object.freeze({
  'medianet-tv': Object.freeze({
    key: 'medianet-tv',
    label: 'Medianet TV',
    tag: env.REPORT_MEDIANET_TV_TAG,
    products: Object.freeze([...env.REPORT_MEDIANET_TV_PRODUCTS]),
    permission: PERMISSIONS.REPORT_MEDIANET_TV_VIEW,
  }),
  ott: Object.freeze({
    key: 'ott',
    label: 'OTT',
    tag: env.REPORT_OTT_TAG,
    products: Object.freeze([...env.REPORT_OTT_PRODUCTS]),
    permission: PERMISSIONS.REPORT_OTT_VIEW,
  }),
});

const REPORT_TYPE_KEYS = Object.freeze(Object.keys(REPORT_TYPES));

module.exports = { REPORT_TYPES, REPORT_TYPE_KEYS };
