const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Product',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    minLength: [1, 'Review must be atleast 1 characters long'],
    maxLength: [1000, 'Review must be less than or equal to 1000 characters'],
  },
  images: {
    type: [String],
    default: null,
  },
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
