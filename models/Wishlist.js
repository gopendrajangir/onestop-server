const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [
        {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Product',
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.post('save', async (doc, next) => {
  if (doc)
    return await doc.populate({
      path: 'items',
      select: 'brand name media mrp discount',
      populate: {
        path: 'skus',
      },
    });
  next();
});

wishlistSchema.post('findOne', async (doc, next) => {
  if (doc)
    return await doc.populate({
      path: 'items',
      select: 'brand name media mrp discount',
      populate: {
        path: 'skus',
      },
    });
  next();
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
