// @ts-nocheck

const router = require('express').Router();
const {
  addItem,
  removeItem,
  updateItem,
  selectItem,
  fetchCart,
  skuAuth,
  selectAllItems,
  removeMultiples,
  sendCartResult,
  moveToWishlist,
} = require('../controllers/cartControllers');
const { auth } = require('../controllers/authControllers');
const { fetchWishlist } = require('../controllers/wishlistControllers');

router.use(auth);

router.use(fetchCart);

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    cart: req.cart,
  });
});

router.patch('/moveToWishlist', fetchWishlist, moveToWishlist);

router.delete('/removeMultiples', removeMultiples);

router.patch('/selectAllItems', selectAllItems);

router.patch('/:skuId/selectItem', skuAuth, selectItem);

router.route('/:skuId').delete(skuAuth, removeItem).patch(skuAuth, updateItem);

router.use(skuAuth);

router.patch('/', addItem, sendCartResult);

module.exports = router;
