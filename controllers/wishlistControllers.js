const Wishlist = require('../models/Wishlist');

const catchAsync = require('../utils/catchAsync');

exports.fetchWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ userId: req.user._id });

  if (wishlist) {
    req.wishlist = wishlist;
  } else {
    req.wishlist = await Wishlist.create({
      userId: req.user._id,
      items: [],
    });
  }

  next();
});

exports.moveToCart = catchAsync(async (req, res, next) => {
  const { wishlist } = req;
  const { productId } = req.params;

  const itemIdx = wishlist.items.findIndex((item) =>
    item._id.equals(productId)
  );

  if (itemIdx > -1) {
    wishlist.items.splice(itemIdx, 1);
    await wishlist.save();
  }
  next();
});

exports.sendMoveToCartResponse = (req, res, next) => {
  res.status(200).json({
    status: 'succes',
    cartItem: req.cartItem,
    increased: req.increased,
  });
};

exports.addToWishlist = catchAsync(async (req, res, next) => {
  const wishlist = req.wishlist;
  const { productId } = req.params;

  let updatedWishlist = wishlist;

  const itemIdx = wishlist.items.findIndex((item) =>
    item._id.equals(productId)
  );

  if (itemIdx === -1) {
    wishlist.items.push(productId);
    updatedWishlist = await wishlist.save();
  }

  const wishlistItem = updatedWishlist.items.filter((item) =>
    item._id.equals(productId)
  )[0];

  res.status(200).json({
    status: 'success',
    wishlistItem,
  });
});

exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const wishlist = req.wishlist;
  const { productId } = req.params;

  const itemIdx = wishlist.items.findIndex((item) =>
    item._id.equals(productId)
  );

  if (itemIdx > -1) {
    wishlist.items.splice(itemIdx, 1);
    await wishlist.save();
  }

  res.status(204).json({
    status: 'success',
  });
});

exports.removeAllFromWishlist = catchAsync(async (req, res, next) => {
  const wishlist = req.wishlist;

  wishlist.items = [];
  await wishlist.save();

  res.status(204).json({
    status: 'success',
  });
});
