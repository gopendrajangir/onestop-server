// @ts-nocheck

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  updateUser,
  uploadUserPhoto,
  addNewAddress,
  updateAddress,
  setAddressAsDefault,
  setAddressAsCurrent,
  removeAddress,
} = require('../controllers/userControllers');
const { auth } = require('../controllers/authControllers');

router.use(auth);

router.patch('/me', uploadUserPhoto, updateUser);

router.post('/addresses', addNewAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', removeAddress);
router.patch('/addresses/:addressId/setAsDefault', setAddressAsDefault);
router.patch('/addresses/:addressId/setAsCurrent', setAddressAsCurrent);

router.get('/me', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

module.exports = router;
