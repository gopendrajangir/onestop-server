const express = require('express');
const router = express.Router({ mergeParams: true });

const { createSku } = require('../controllers/skuControllers');
const { auth } = require('../controllers/authControllers');
const roles = require('../utils/roles');

router.post('/', auth, roles(['admin']), createSku);

module.exports = router;
