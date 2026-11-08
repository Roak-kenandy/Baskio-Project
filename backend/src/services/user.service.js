const userRepository = require('../repositories/user.repository');
const tokenService = require('./token.service');
const auditService = require('./audit.service');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/permissions');
const AppError = require('../utils/AppError');

const { AUDIT_ACTIONS } = auditService;
const { toPublicUser } = userRepository;

async function getOrThrow(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function assertNotLastAdmin(user) {
  if (user.role !== ROLES.ADMIN || !user.isActive) return;
  const others = await userRepository.countActiveAdmins(user.id);
  if (others === 0) throw new AppError(409, 'At least one active administrator must remain');
}

function assertPasswordDoesNotContainUsername(password, username) {
  if (password.toLowerCase().includes(username.toLowerCase())) {
    throw new AppError(400, 'Password must not contain the username');
  }
}

const userService = {
  async list(query) {
    const { items, total } = await userRepository.list(query);
    return { items: items.map(toPublicUser), total, page: query.page, limit: query.limit };
  },

  async getById(id) {
    return toPublicUser(await getOrThrow(id));
  },

  async create(data, actor, context) {
    if (await userRepository.existsByUsername(data.username)) {
      throw new AppError(409, 'Username is already taken');
    }
    assertPasswordDoesNotContainUsername(data.password, data.username);

    const user = await userRepository.create({
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      permissions: data.role === ROLES.ADMIN ? [] : data.permissions,
      passwordHash: await hashPassword(data.password),
      mustChangePassword: true,
      createdBy: actor.id,
    });

    await auditService.record({
      actor,
      action: AUDIT_ACTIONS.USER_CREATED,
      targetType: 'user',
      targetId: user.id,
      metadata: { username: user.username, role: user.role, permissions: user.permissions },
      context,
    });
    return toPublicUser(user);
  },

  async update(id, changes, actor, context) {
    const user = await getOrThrow(id);
    const isSelf = user.id === actor.id;

    if (isSelf && changes.role && changes.role !== user.role) {
      throw new AppError(400, 'You cannot change your own role');
    }
    if (isSelf && changes.isActive === false) {
      throw new AppError(400, 'You cannot disable your own account');
    }
    const losesAdmin = (changes.role && changes.role !== ROLES.ADMIN) || changes.isActive === false;
    if (losesAdmin) await assertNotLastAdmin(user);

    const update = { ...changes };
    if ((changes.role ?? user.role) === ROLES.ADMIN) update.permissions = [];

    const deactivated = changes.isActive === false && user.isActive;
    const updated = await userRepository.update(id, update, { bumpTokenVersion: deactivated });
    if (deactivated) await tokenService.revokeAllForUser(user.id);

    await auditService.record({
      actor,
      action: AUDIT_ACTIONS.USER_UPDATED,
      targetType: 'user',
      targetId: user.id,
      metadata: {
        username: user.username,
        before: { role: user.role, permissions: user.permissions, isActive: user.isActive },
        changes,
      },
      context,
    });
    return toPublicUser(updated);
  },

  async resetPassword(id, password, actor, context) {
    const user = await getOrThrow(id);
    assertPasswordDoesNotContainUsername(password, user.username);

    const updated = await userRepository.update(
      id,
      {
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
        passwordChangedAt: new Date(),
        lockUntil: null,
        failedLoginAttempts: 0,
      },
      { bumpTokenVersion: true }
    );
    await tokenService.revokeAllForUser(user.id);

    await auditService.record({
      actor,
      action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
      targetType: 'user',
      targetId: user.id,
      metadata: { username: user.username },
      context,
    });
    return toPublicUser(updated);
  },

  async unlock(id, actor, context) {
    const user = await getOrThrow(id);
    const updated = await userRepository.update(id, { lockUntil: null, failedLoginAttempts: 0 });
    await auditService.record({
      actor,
      action: AUDIT_ACTIONS.USER_UNLOCKED,
      targetType: 'user',
      targetId: user.id,
      metadata: { username: user.username },
      context,
    });
    return toPublicUser(updated);
  },

  async remove(id, actor, context) {
    const user = await getOrThrow(id);
    if (user.id === actor.id) throw new AppError(400, 'You cannot delete your own account');
    await assertNotLastAdmin(user);

    await userRepository.deleteById(id);

    await auditService.record({
      actor,
      action: AUDIT_ACTIONS.USER_DELETED,
      targetType: 'user',
      targetId: user.id,
      metadata: { username: user.username, role: user.role },
      context,
    });
  },
};

module.exports = userService;
