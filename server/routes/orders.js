const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticate, upload.array('designs', 10), orderController.createOrder);
router.get('/', authenticate, orderController.getAllOrders);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.patch('/:id/status', authenticate, orderController.updateOrderStatus);

module.exports = router;