const passport = require('passport');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const express = require('express');
const router = express.Router();

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);

router.route(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);
router.route(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/v1/users/login' })
);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:resetToken', authController.resetPassword);

router.patch(
  '/update-my-password',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
router.post('/refresh-token', authController.refreshToken);

router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.route('/').get(userController.getAllUsers);
router.route('/:id').get(userController.getUser);

module.exports = router;
