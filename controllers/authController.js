const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');
const sendEmail = require('../utils/sendEmail');
const AppError = require('../utils/AppError');
const User = require('./../models/userModel');
const Token = require('./../models/tokenModel');
const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  return { token, refreshToken };
};

const createAndSendToken = async (data, statusCode, res, next) => {
  // Sign Token
  const { token: accessToken, refreshToken } = signToken(data._id);
  //   // Remove Password from output
  //   data.password = undefined;

  // Send Response
  sendResponse(data, res, statusCode, {
    accessToken,
    refreshToken,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { fullName, email, yearOfBirth, gender, password } = req.body;
  let payload = { fullName, email, yearOfBirth, gender, password };
  const newUser = await User.create(payload);
  createAndSendToken(newUser, 201, res, next);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  let user;

  if (email && password) {
    user = await User.findOne({
      email,
    }).select('+password');

    if (!user || !(await user.isCorrectPassword(password, user.password))) {
      return next(new AppError('Email or Password is incorrect', 401));
    }
    if (user.isVerified === false) {
      return next(new AppError('Please verify your email', 401));
    }
    const { token, refreshToken } = signToken(user._id);

    res.status(200).json({
      status: 'success',
      accessToken: token,
      refreshToken,
      data: user,
    });
  } else {
    next(new AppError('Please provide email and password', 401));
  }
});

exports.protect = catchAsync(async (req, res, next) => {
  let token = null;
  // 1) Check if json web token exists and get token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // If there's no token then throw exception
    return next(
      new AppError(
        'You are not logged in! Please log in to access this resource',
        401
      )
    );
  }
  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("Can't find user with that token. Please try again", 401)
    );
  }
  // 4) Check if user changed password after json web token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401)
    );
  }
  // Grant Access
  req.user = currentUser;

  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // This Method allows the user update his password without having to forget it

  // Finds the user by the id of the currently logged in user
  const user = await User.findById(req.user._id).select('password');
  const { currentPassword, newPassword, newConfirmPassword } = req.body;
  // Checks if the current password matches the one in the database
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }
  // Changes the password
  user.password = newPassword;
  user.confirmPassword = newConfirmPassword;
  // Saves the user document
  await user.save();

  // Sends Response with email
  // const emailOptions = {
  //   subject: 'Your Password Has Been Changed',
  //   message: `Dear ${user.firstName}, Your password was recently changed`,
  //   email: user.email,
  // };
  // createAndSendTokenWithEmail(user, 200, res, next, emailOptions);

  // 4) Log user in, send JWT
  createAndSendToken(user, 200, res);
});
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const decoded = await promisify(jwt.verify)(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );
  const { token } = signToken(decoded.id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError(`Can't find user with email:${email}`, 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // The instance method above modifies the user data (passowrdResetToken && passwordResetTokenExpires fields)
  // because of the data modification done by the instance method we need to save the document again
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email,
      subject: 'Forgot Password. Valid For 10 minutes',
      text: `Your password reset token is ${resetToken}`,
    });
    sendResponse(null, res, 200, {
      message: 'Reset Token Sent to Email',
    });
  } catch (err) {
    // If error sending mail remove the passwordResetToken and expiry time from db
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // Throw error
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const { resetToken } = req.params;
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // (Get user with resetToken if the token is not yet expired)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  // 2) If resetToken is not yet expired and there is a user, set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  await sendEmail({
    email: user.email,
    subject: 'Password has been reset',
    text: 'Your password has been reset',
  });

  req.user = user;
  createAndSendToken(user, 200, res);
});

exports.googleAuth = (
  req,
  res,
  next,
  accessToken,
  refreshToken,
  profile,
  done
) => {
  catchAsync(
    async (req, res, next, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Log user in
          done(null, user);

          res.status(200).json({
            status: 'success',
            token: accessToken,
            refreshToken,
            user,
          });
        } else {
          // Sign user Up
          const newUser = await User.create({
            fullName: profile.displayName,
            email: profile.emails[0].value,
          });
          done(null, user);
          return res.status(201).json({
            status: 'success',
            token: accessToken,
            refreshToken,
            user: newUser,
          });
        }
      } catch (error) {
        next(new AppError(error.message, 400));
      }
    }
  );
};

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token, email } = req.params;

  const userToken = await Token.findOne({ token });
  if (!userToken) {
    next(new AppError('Link is invalid', 400));
  } else {
    if (Date.now() > userToken.expireAt) {
      next(new AppError('Verification Link has expired', 400));
    } else {
      await User.updateOne(
        { email },
        {
          isVerified: true,
        },
        { new: true, runValidators: true }
      );
      await Token.findByIdAndDelete(token._id);
      res.redirect(process.env.HOMEPAGE_URL);
    }
  }
});
