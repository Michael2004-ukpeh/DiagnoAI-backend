const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const app = express();

// 1) Global Middlewares
// This is how we use middleware (app.use)

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
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);

  // The next function accepts an argument that we use as the error object
  next(err);
});

// Global Error Handling Middleware for Operational error

app.use(globalErrorHandler);

module.exports = app;
