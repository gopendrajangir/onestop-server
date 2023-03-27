// @ts-nocheck

const mongoose = require('mongoose');
const validator = require('validator');

const addressSchema = new mongoose.Schema({
  completeAddress: {
    type: String,
    minLength: [10, 'Address must be atleast 10 characters long'],
    maxLength: [256, 'Address must be less than or equal to 256 characters'],
    trim: true,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    minLength: [6, 'Pincode must be 6 digits long'],
    maxLength: [6, 'Pincode must be 6 digits long'],
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
  },
  isCurrent: {
    type: Boolean,
  },
});

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    maxLength: [
      100,
      'Name should be less than or equal to 100 characters long',
    ],
  },
  phone: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
    required: true,
    select: false,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  addresses: {
    type: [addressSchema],
    default: [],
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
