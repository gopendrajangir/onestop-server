module.exports = (err, req, res, next) => {
  console.log(err);
  if (!err.isOperational) {
    if (
      err.code === 292 &&
      err.codeName === 'QueryExceededMemoryLimitNoDiskUseAllowed'
    ) {
      err.statusCode = 500;
      err.message =
        "You searched for a very generalized category. We are on a free tier mongo service, can't process this much generalized category. Try to be specific like (tshirts, shirts)";
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
