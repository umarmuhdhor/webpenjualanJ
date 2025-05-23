const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barangController');
const { authenticate } = require('../middleware/auth');

router.get('/', barangController.getBarang);
router.post('/', authenticate, barangController.addBarang);
router.delete('/:id', authenticate, barangController.deleteBarang);
router.patch('/:id', authenticate, barangController.updateBarang);

module.exports = router;