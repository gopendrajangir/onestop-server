// @ts-nocheck

const express = require('express');

const router = express.Router();

const {
  addToWishlist,
  removeFromWishlist,
  fetchWishlist,
  removeAllFromWishlist,
  moveToCart,
  sendMoveToCartResponse,
} = require('../controllers/wishlistControllers');

const { auth } = require('../controllers/authControllers');
const {
  fetchCart,
  skuAuth,
  addItem,
} = require('../controllers/cartControllers');

router.use(auth);

router.use(fetchWishlist);

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    wishlist: req.wishlist,
  });
});

router.delete('/removeAllFromWishlist', removeAllFromWishlist);

router
  .route('/:productId/moveToCart')
  .patch(fetchCart, skuAuth, moveToCart, addItem, sendMoveToCartResponse);

router.route('/:productId').patch(addToWishlist).delete(removeFromWishlist);

module.exports = router;
