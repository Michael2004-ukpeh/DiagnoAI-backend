const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const userRouter = require('./routes/userRoutes');
const emailRouter = require('./routes/emailRouter');
const globalErrorHandler = require('./controllers/errorController');
const { googleAuth } = require('./controllers/authController');
const app = express();

// 1) Global Middlewares
// This is how we use middleware (app.use)

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
    // store:
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/users/google/callback',
      scope: ['profile', 'email'],
    },
    googleAuth
  )
);

// Set security HTTP Header (Helmet )
app.use(helmet());

// Use Morgan to log api request in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many request from this IP. Please try again in an hour!',
// });

// Enabling CORS
app.use(cors());

// Limit request from the same API
// app.use('/api', limiter);

// Body Parser (To parse body form the request that was made || Reading Request from the body || PUT, POST, PATCH requests)
app.use(express.json());

// Data Sanitization against NOSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Preventing Parameter Pollution
app.use(
  hpp({
    whitelist: ['ratingsAverage', 'ratingsQuantity', 'price'],
  })
);

// Routes
app.use('/verifyEmail', emailRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);

  // The next function accepts an argument that we use as the error object
  next(err);
});

// Global Error Handling Middleware for Operational error

app.use(globalErrorHandler);

module.exports = app;
