const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  sku: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Sku',
    required: true,
  },
  product: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  selected: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.post('save', async (doc, next) => {
  if (doc) {
    return await doc.populate({
      path: 'items',
      populate: [
        {
          path: 'product',
          select: 'brand name media mrp discount',
          populate: {
            path: 'skus',
          },
        },
        {
          path: 'sku',
        },
      ],
    });
  }
  next();
});

cartSchema.post('findOne', async (doc, next) => {
  if (doc) {
    return await doc.populate({
      path: 'items',
      populate: [
        {
          path: 'product',
          select: 'brand name media mrp discount',
          populate: {
            path: 'skus',
          },
        },
        {
          path: 'sku',
        },
      ],
    });
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
