const { z } = require('zod');
const { password } = require('./common');

const loginBody = z.object({
  username: z.string().trim().toLowerCase().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required').max(128),
});

const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

module.exports = { loginBody, changePasswordBody };
