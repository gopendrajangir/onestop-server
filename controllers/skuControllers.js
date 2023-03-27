const Product = require('../models/Product');
const Sku = require('../models/Sku');

const catchAsync = require('../utils/catchAsync');

exports.createSku = catchAsync(async (req, res) => {
  const productId = req.params.productId;

  const body = {
    variant: { size: 'LG' },
    sku: 'OS-TS-CH-HN-G-LG',
    quantity: 3,
    mrp: 2765,
  };

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product with this id doesn't exist");
  }

  let sku = await Sku.findOne({
    productId,
    variant: body.variant,
    sku: body.sku,
  });

  if (sku) {
    throw new Error('Sku already exist with this sku value');
  }

  sku = await Sku.create({
    productId,
    variant: body.variant,
    sku: body.sku,
    mrp: body.mrp,
    quantity: body.quantity,
  });

  res.status(204).json({
    status: 'success',
    data: sku,
  });
});
