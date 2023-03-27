const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
  productId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Product',
  },
  skuId: {
    type: String,
    required: true,
    unique: true,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    min: 0,
    required: true,
  },
  priority: {
    type: Number,
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

const Sku = mongoose.model('Sku', skuSchema);
module.exports = Sku;
