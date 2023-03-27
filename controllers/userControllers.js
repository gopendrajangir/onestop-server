const multer = require('multer');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.updateUser = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { name, email, gender } = req.body;

  if (name) {
    user.name = name;
  }
  if (email) {
    user.email = email;
  }
  if (gender) {
    user.gender = gender;
  }

  const updatedUser = await user.save();

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

const getDefaultAddress = (addresses) => {
  return addresses.find(({ isDefault }) => isDefault);
};

const getCurrentAddress = (addresses) => {
  return addresses.find(({ isCurrent }) => isCurrent);
};

exports.addNewAddress = catchAsync(async (req, res, next) => {
  const { address } = req.body;
  const { user } = req;

  let updatedUser = user;

  const defaultAddress = getDefaultAddress(user.addresses);
  const currentAddress = getCurrentAddress(user.addresses);

  if (defaultAddress && address.isDefault) {
    defaultAddress.isDefault = false;
  }

  if (currentAddress && address.isCurrent) {
    currentAddress.isCurrent = false;
  }

  user.addresses.push(address);

  updatedUser = await user.save();

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const { address } = req.body;
  const { user } = req;
  const { addressId } = req.params;

  let updatedUser = user;

  const defaultAddress = getDefaultAddress(user.addresses);

  if (defaultAddress && address.isDefault) {
    defaultAddress.isDefault = false;
  }

  const addr = user.addresses.id(addressId);

  if (addr) {
    let isUpdated = false;
    Object.keys(address).map((key) => {
      if (addr[key] !== address[key]) {
        addr[key] = address[key];
        isUpdated = true;
      }
    });
    if (isUpdated) {
      updatedUser = await user.save();
    }
  }

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.removeAddress = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { addressId } = req.params;

  user.addresses.id(addressId).remove();

  const updatedUser = await user.save();

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.setAddressAsDefault = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { addressId } = req.params;

  let updatedUser = user;

  const defaultAddress = getDefaultAddress(user.addresses);

  if (defaultAddress) {
    defaultAddress.isDefault = false;
  }

  const address = user.addresses.id(addressId);

  if (address) {
    address.isDefault = true;
  }

  updatedUser = await updatedUser.save();

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.setAddressAsCurrent = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { addressId } = req.params;

  let updatedUser = user;

  const currentAddress = getCurrentAddress(user.addresses);

  if (currentAddress) {
    currentAddress.isCurrent = false;
  }

  const address = user.addresses.id(addressId);

  if (address) {
    address.isCurrent = true;
  }

  updatedUser = await updatedUser.save();

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});
