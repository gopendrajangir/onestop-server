const { getAuth } = require('firebase-admin/auth');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');

exports.auth = catchAsync(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    console.error(
      'No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>'
    );
    next(new AppError(403, 'User not logged in'));
  }

  const idToken = req.headers.authorization.split('Bearer ')[1];
  const decodedToken = await getAuth().verifyIdToken(idToken);

  let user = await User.findOne({ uid: decodedToken.uid });

  if (!user) {
    const { uid, displayName, phoneNumber } = await getAuth().getUser(
      decodedToken.uid
    );

    user = await User.create({
      uid: uid,
      name: displayName,
      phone: phoneNumber,
      role: 'customer',
    });

    req.user = user;
  } else {
    req.user = user;
  }

  next();
});
