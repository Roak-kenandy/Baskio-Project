const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const { requirePermissions } = require('../middlewares/authorize');
const { PERMISSIONS } = require('../constants/permissions');
const { idParams } = require('../validators/common');
const { listUsersQuery, createUserBody, updateUserBody, resetPasswordBody } = require('../validators/user.validator');

const router = Router();

router.use(requirePermissions(PERMISSIONS.USERS_MANAGE));

router.get('/', validate({ query: listUsersQuery }), userController.list);
router.post('/', validate({ body: createUserBody }), userController.create);
router.get('/:id', validate({ params: idParams }), userController.get);
router.patch('/:id', validate({ params: idParams, body: updateUserBody }), userController.update);
router.post('/:id/reset-password', validate({ params: idParams, body: resetPasswordBody }), userController.resetPassword);
router.post('/:id/unlock', validate({ params: idParams }), userController.unlock);
router.delete('/:id', validate({ params: idParams }), userController.remove);

module.exports = router;
