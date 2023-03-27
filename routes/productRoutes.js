const express = require('express');
const multer = require('multer');

const router = express.Router();

const skuRoutes = require('./skuRoutes');
const { auth } = require('../controllers/authControllers');
const roles = require('../utils/roles');

const {
  createProduct,
  autocomplete,
  searchProducts,
  getProduct,
} = require('../controllers/productControllers');

const upload = multer();

router.use('/:productId/skus', skuRoutes);

// router
//   .route('/')
// .post(auth, roles(['admin']), upload.array('images', 10), createProduct)

router.get('/autocomplete', autocomplete);
router.post('/search', searchProducts);

router.get('/:productId', getProduct);

module.exports = router;
