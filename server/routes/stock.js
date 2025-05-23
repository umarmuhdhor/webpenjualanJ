const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, stockController.addStock);
router.get('/', stockController.getStock);
router.get('/history', authenticate, stockController.getStockHistory);

module.exports = router;