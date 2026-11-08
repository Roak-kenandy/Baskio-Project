const userService = require('../services/user.service');
const { contextFrom } = require('../services/audit.service');

const userController = {
  async list(req, res) {
    res.json(await userService.list(req.validated.query));
  },

  async get(req, res) {
    res.json({ user: await userService.getById(req.validated.params.id) });
  },

  async create(req, res) {
    const user = await userService.create(req.validated.body, req.user, contextFrom(req));
    res.status(201).json({ user });
  },

  async update(req, res) {
    const user = await userService.update(req.validated.params.id, req.validated.body, req.user, contextFrom(req));
    res.json({ user });
  },

  async resetPassword(req, res) {
    const user = await userService.resetPassword(
      req.validated.params.id,
      req.validated.body.password,
      req.user,
      contextFrom(req)
    );
    res.json({ user });
  },

  async unlock(req, res) {
    const user = await userService.unlock(req.validated.params.id, req.user, contextFrom(req));
    res.json({ user });
  },

  async remove(req, res) {
    await userService.remove(req.validated.params.id, req.user, contextFrom(req));
    res.status(204).end();
  },
};

module.exports = userController;
