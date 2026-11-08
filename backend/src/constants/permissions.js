const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

const PERMISSIONS = Object.freeze({
  REPORT_MEDIANET_TV_VIEW: 'reports.medianet_tv.view',
  REPORT_OTT_VIEW: 'reports.ott.view',
  REPORT_EXPORT: 'reports.export',
  REPORT_PII_VIEW: 'reports.pii.view',
  USERS_MANAGE: 'users.manage',
  AUDIT_VIEW: 'audit.view',
});

const PERMISSION_CATALOG = Object.freeze([
  {
    key: PERMISSIONS.REPORT_MEDIANET_TV_VIEW,
    group: 'Reports',
    label: 'View Medianet TV report',
    description: 'Medianet TV tagged customers subscribed to BAISKOAFU.',
  },
  {
    key: PERMISSIONS.REPORT_OTT_VIEW,
    group: 'Reports',
    label: 'View OTT report',
    description: 'OTT tagged customers subscribed to BAISKOAFU OTT.',
  },
  {
    key: PERMISSIONS.REPORT_EXPORT,
    group: 'Reports',
    label: 'Export reports (CSV)',
    description: 'Download the reports the user is allowed to view.',
  },
  {
    key: PERMISSIONS.REPORT_PII_VIEW,
    group: 'Reports',
    label: 'View full contact details',
    description: 'Without this, phone numbers and emails are masked.',
  },
  {
    key: PERMISSIONS.USERS_MANAGE,
    group: 'Administration',
    label: 'Manage users',
    description: 'Create, edit, disable, unlock users and reset passwords.',
  },
  {
    key: PERMISSIONS.AUDIT_VIEW,
    group: 'Administration',
    label: 'View audit logs',
    description: 'See logins, report access, exports and admin actions.',
  },
]);

const ALL_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS));

function resolvePermissions(user) {
  if (user.role === ROLES.ADMIN) return [...ALL_PERMISSIONS];
  return (user.permissions || []).filter((permission) => ALL_PERMISSIONS.includes(permission));
}

module.exports = {
  ROLES,
  PERMISSIONS,
  PERMISSION_CATALOG,
  ALL_PERMISSIONS,
  resolvePermissions,
};
