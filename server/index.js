const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const stockRoutes = require('./routes/stock');
const barangRoutes = require('./routes/barang');
const bahanRoutes = require('./routes/bahan');

const app = express();
app.use(cors());
app.use(express.json());
console.log('Public path:', path.join(__dirname, 'public', 'images'));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Rute API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/bahan', bahanRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));