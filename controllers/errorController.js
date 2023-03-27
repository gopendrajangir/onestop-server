module.exports = (err, req, res, next) => {
  console.log(err);
  if (!err.isOperational) {
    if (
      err.code === 292 &&
      err.codeName === 'QueryExceededMemoryLimitNoDiskUseAllowed'
    ) {
      err.statusCode = 500;
      err.message = 'Query is too generalized! Try to be specific';
    } else if (err.code === 'auth/id-token-expired') {
      err.statusCode = 401;
      err.message = 'Your session has expired. Login again.';
    } else {
      err.statusCode = 500;
      err.message = 'Internal Server Error';
    }
  }
  res.status(err.statusCode).json({
    status: 'failed',
    error: err.message,
  });
};
