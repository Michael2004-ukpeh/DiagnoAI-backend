module.exports = function (
  data,
  res,
  statusCode,
  options = {
    result: false,
    message: false,
    accessToken: false,
    refreshToken: false,
  }
) {
  res.status(statusCode).json({
    status: 'success',
    result: options.result ? data.length : undefined,
    message: options.message ? options.message : undefined,
    accessToken: options.accessToken ? options.accessToken : undefined,
    refreshToken: options.refreshToken ? options.refreshToken : undefined,
    data,
  });
};
