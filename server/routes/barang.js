const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const barangController = require('../controllers/barangController');
const { authenticate } = require('../middleware/auth');

// Ensure the images folder exists
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file JPEG, JPG, PNG, atau GIF yang diizinkan'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.get('/', barangController.getBarang);
router.post('/', authenticate, upload.single('gambar'), barangController.addBarang);
router.delete('/:id', authenticate, barangController.deleteBarang);
router.patch('/:id', authenticate, upload.single('gambar'), barangController.updateBarang);

module.exports = router;