const catchAsync = require('../utils/catchAsync');

const AppError = require('../utils/AppError');

const Cart = require('../models/Cart');
const Sku = require('../models/Sku');

exports.fetchCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  console.log(req.user._id);

  if (cart) {
    req.cart = cart;
  } else {
    req.cart = await Cart.create({
      userId: req.user._id,
      items: [],
    });
  }
  next();
});

exports.skuAuth = catchAsync(async (req, res, next) => {
  let skuId;

  if (req.body.skuId) {
    skuId = req.body.skuId;
  } else if (req.params.skuId) {
    skuId = req.params.skuId;
  }

  const sku = await Sku.findById(skuId);

  if (!sku) {
    return next(new AppError(404, 'Sku not found'));
  }

  req.sku = sku;
  next();
});

exports.moveToWishlist = catchAsync(async (req, res, next) => {
  const { cart, wishlist } = req;
  let { skus } = req.body;

  let productIds = Array.from(new Set(skus.map(({ productId }) => productId)));

  wishlist.items.map((item, i) => {
    if (productIds.includes(item._id.toString())) {
      productIds = productIds.filter((id) => !item._id.equals(id));
    }
  });

  wishlist.items.push(productIds);

  let cartUpdated = false;

  skus.forEach(({ productId, skuId }) => {
    const itemIdx = cart.items.findIndex((item) => item.sku._id.equals(skuId));

    if (itemIdx > -1) {
      cart.items.splice(itemIdx, 1);
      cartUpdated = true;
    }
  });

  await cart.save();

  if (cartUpdated) {
    await wishlist.save();
  }
  req.wishlistItems = wishlist.items.filter(({ _id }) =>
    productIds.includes(_id.toString())
  );

  res.status(200).json({
    status: 'success',
    wishlistItems: req.wishlistItems,
  });
});

exports.getCart = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    cart: req.cart,
  });
});

exports.addItem = catchAsync(async (req, res, next) => {
  const cart = req.cart;
  const skuId = req.sku._id;

  req.updatedCart = cart;
  req.increased = false;

  const itemIdx = cart.items.findIndex((item) => item.sku._id.equals(skuId));

  if (itemIdx > -1) {
    if (req.sku.quantity >= cart.items[itemIdx].quantity + 1) {
      cart.items[itemIdx].quantity++;
      req.increased = true;
      req.cartItem = cart.items[itemIdx];
    } else {
      return next(
        new AppError(404, 'We are sorry!! No items left in inventory')
      );
    }
  } else {
    req.cartItem = cart.items.create({
      sku: req.sku._id,
      product: req.sku.productId,
      quantity: 1,
    });

    cart.items.push(req.cartItem);
  }

  await cart.save();

  next();
});

exports.sendCartResult = (req, res, next) => {
  res.status(200).json({
    status: 'success',
    cartItem: req.cartItem,
    increased: req.increased,
  });
};

exports.removeItem = catchAsync(async (req, res, next) => {
  const cart = req.cart;
  const skuId = req.sku._id;

  const itemIdx = cart.items.findIndex((item) => item.sku._id.equals(skuId));

  if (itemIdx > -1) {
    cart.items.splice(itemIdx, 1);
    await cart.save();
  }

  res.status(200).json({
    status: 'success',
  });
});

exports.removeMultiples = catchAsync(async (req, res, next) => {
  const cart = req.cart;
  const { skuIds } = req.body;

  let updated = false;

  skuIds.forEach((id) => {
    const itemIdx = cart.items.findIndex((item) => item.sku._id.equals(id));
    if (itemIdx > -1) {
      updated = true;
      cart.items.splice(itemIdx, 1);
    }
  });

  if (updated) await cart.save();

  res.status(204).json({
    status: 'success',
  });
});

exports.updateItem = catchAsync(async (req, res, next) => {
  const cart = req.cart;
  const skuId = req.sku._id;

  const { quantity, newSkuId } = req.body;

  if (quantity >= 0) {
    const itemIdx = cart.items.findIndex((item) => item.sku._id.equals(skuId));
    if (itemIdx > -1) {
      if (req.sku.quantity >= quantity) {
        if (cart.items[itemIdx].quantity !== quantity) {
          cart.items[itemIdx].quantity = quantity;
          await cart.save();
          req.cartItem = cart.items[itemIdx];
        }
      } else {
        return next(
          new AppError(404, 'We are sorry!! No items left in inventory')
        );
      }
    }
  } else if (newSkuId && !skuId.equals(newSkuId)) {
    const itemIdx = cart.items.findIndex((item) =>
      item.sku._id.equals(newSkuId)
    );

    if (itemIdx > -1) {
      cart.items.splice(itemIdx, 1);
    }

    const currentSkuItemIdx = cart.items.findIndex((item) =>
      item.sku._id.equals(skuId)
    );
    cart.items[currentSkuItemIdx].sku = newSkuId;

    await cart.save();
    req.cartItem = cart.items[currentSkuItemIdx];
  }

  res.status(200).json({
    status: 'success',
    cartItem: req.cartItem,
  });
});

exports.selectAllItems = catchAsync(async (req, res, next) => {
  const { cart } = req;
  const { shouldSelect } = req.body;

  let updatedCart = cart;

  if (!cart) {
    return next(new AppError(404, 'Cart not found'));
  }

  let updated = false;

  cart.items.map((item) => {
    if (item.selected !== !!shouldSelect) {
      item.selected = !!shouldSelect;
      updated = true;
    }
  });

  if (updated) updatedCart = await cart.save();

  res.status(200).json({
    status: 'success',
    cart: updatedCart,
  });
});

exports.selectItem = catchAsync(async (req, res, next) => {
  const { sku, cart } = req;
  const { shouldSelect } = req.body;

  let updatedCart = cart;

  if (!cart) {
    return next(new AppError(404, 'Cart not found'));
  }

  const itemIdx = cart.items.findIndex((item) => item.sku._id.equals(sku._id));

  if (cart.items[itemIdx].selected !== shouldSelect) {
    cart.items[itemIdx].selected = shouldSelect;

    updatedCart = await cart.save();
  }

  res.status(200).json({
    status: 'success',
    cart: updatedCart,
  });
});
