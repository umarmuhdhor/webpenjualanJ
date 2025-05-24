const express = require('express');
const router = express.Router();
const bahanController = require('../controllers/bahanController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, bahanController.addBahan);
router.delete('/:id', authenticate, bahanController.deleteBahan);
router.patch('/:id', authenticate, bahanController.updateBahan);
router.get('/', authenticate, bahanController.getAllBahan);

module.exports = router;