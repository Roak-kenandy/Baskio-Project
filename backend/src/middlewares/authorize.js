const AppError = require('../utils/AppError');

function requirePermissions(...required) {
  return (req, _res, next) => {
    const granted = req.user?.permissions || [];
    if (!required.every((permission) => granted.includes(permission))) {
      throw new AppError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}

function requireAnyPermission(...candidates) {
  return (req, _res, next) => {
    const granted = req.user?.permissions || [];
    if (!candidates.some((permission) => granted.includes(permission))) {
      throw new AppError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = { requirePermissions, requireAnyPermission };
