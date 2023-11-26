const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getUserOwn = catchAsync(async (req, res, next) => {
  req.query.user = req.user.id;

  next();
});
