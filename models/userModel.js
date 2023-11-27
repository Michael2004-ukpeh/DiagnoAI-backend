const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Token = require('./../models/tokenModel');
const sendEmail = require('./../utils/sendEmail');
const tokenEncrypt = require('./../utils/tokenEncrypt');
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: [true, 'Email is  already in use'],
      validate: [
        validator.isEmail,
        'Email address provided must be a valid email address',
      ],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    yearOfBirth: {
      type: Date,
      required: true,
    },
    // role: {
    //   type: String,
    //   enum: ['participant', 'organizer'],
    //   default: 'organizer',
    // },
    password: {
      type: String,
      minlength: [8, 'Password must be 8 or more characters'],
      select: false,
    },
    active: { type: Boolean, default: true },

    passwordResetTokenExpires: Date,
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: String,

    status: {
      type: String,
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: Number,

    otpExpiration: Date,
  },
  {
    strict: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },

    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (this.isNew === true) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
userSchema.pre('save', async function (next) {
  if (this.isDirectModified('password') === false || this.isNew) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.post('save', async function () {
  const userToken = await Token.create({
    userId: this.id,
    token: crypto.randomBytes(16).toString('hex'),
    expireAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  await sendEmail({
    email: this.email,
    subject: 'DiagnoAi - Confirm Sign Up',
    text: `
    Welcome to Diagno . Confirm you signed up
    
    Please click ${process.env.BASE_HOST}/verifyEmail/${this.email}/${userToken.token}
    It expires in a day
      `,
  });
});

userSchema.methods.isCorrectPassword = async function (
  plainPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // This checks if the password was changed after the token has been signed and sent
  if (this.passwordChangedAt) {
    // Convert the pasword changed time to timestamp
    // The Reason why we divide by 1000 is because the changedTimestamp is in milliseconds while
    // the JWTTimestamp is in seconds so we need to make sure they're both in the same format
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means the password has not been changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = tokenEncrypt(resetToken);
  // Set the password reset token to expire in 10 minutes
  this.passwordResetToken = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.calculateAge = function () {
  let currentDate = new Date();
  let age = currentDate.getFullYear() - this.yearOfBirth.getFullYear();
  if (
    currentDate <
    new Date(
      currentDate.getFullYear(),
      this.yearOfBirth.getMonth(),
      this.yearOfBirth.getDate()
    )
  ) {
    age--;
  }
  return age;
};
const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
