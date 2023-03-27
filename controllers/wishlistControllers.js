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
    req.updatedWishlist = await wishlist.save();
  }
  next();
});

exports.sendMoveToCartResponse = (req, res, next) => {
  res.status(200).json({
    status: 'succes',
    cart: req.updatedCart,
    wishlist: req.wishlist,
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

  res.status(200).json({
    status: 'success',
    wishlist: updatedWishlist,
  });
});

exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const wishlist = req.wishlist;
  const { productId } = req.params;

  let updatedWishlist = wishlist;

  const itemIdx = wishlist.items.findIndex((item) =>
    item._id.equals(productId)
  );

  if (itemIdx > -1) {
    wishlist.items.splice(itemIdx, 1);
    updatedWishlist = await wishlist.save();
  }

  res.status(200).json({
    status: 'success',
    wishlist: updatedWishlist,
  });
});

exports.removeAllFromWishlist = catchAsync(async (req, res, next) => {
  const wishlist = req.wishlist;

  let updatedWishlist = wishlist;

  wishlist.items = [];
  updatedWishlist = await wishlist.save();

  res.status(200).json({
    status: 'success',
    wishlist: updatedWishlist,
  });
});
