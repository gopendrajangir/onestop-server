const AppError = require('./AppError');
const catchAsync = require('./catchAsync');

module.exports = (roles) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;

    if (roles.includes(user.role)) {
      next();
    } else {
      throw new AppError(403, "You don't have permission to access this route");
    }
  });
};
