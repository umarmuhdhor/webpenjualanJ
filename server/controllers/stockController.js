const db = require('../config/db');

// Tambah stok (hanya admin)
const addStock = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { barang_id, color, size, quantity, description } = req.body;

  if (!barang_id || isNaN(barang_id) || !color || !size || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Semua field wajib diisi dan nama_id/quantity harus valid' });
  }
  if (color.length > 50 || size.length > 10) {
    return res.status(400).json({ error: 'Color atau size terlalu panjang' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.get('SELECT id FROM barang WHERE id = ?', [barang_id], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: `Barang dengan id ${barang_id} tidak ditemukan` });
      }

      db.get(
        'SELECT id, quantity FROM stock WHERE barang_id = ? AND color = ? AND size = ?',
        [barang_id, color, size],
        (err, stock) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal memeriksa stok', details: err.message });
          }

          if (stock) {
            db.run(
              'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
              [quantity, stock.id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Gagal memperbarui stok', details: err.message });
                }
                db.run(
                  'INSERT INTO stock_history (stock_id, type, quantity, description) VALUES (?, ?, ?, ?)',
                  [stock.id, 'in', quantity, description || 'Restock'],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Gagal mencatat riwayat stok', details: err.message });
                    }
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                      }
                      res.json({ message: 'Stok berhasil ditambahkan' });
                    });
                  }
                );
              }
            );
          } else {
            db.run(
              'INSERT INTO stock (barang_id, color, size, quantity, min_quantity) VALUES (?, ?, ?, ?, ?)',
              [barang_id, color, size, quantity, 0],
              function (err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Gagal menambah stok', details: err.message });
                }
                const stockId = this.lastID;
                db.run(
                  'INSERT INTO stock_history (stock_id, type, quantity, description) VALUES (?, ?, ?, ?)',
                  [stockId, 'in', quantity, description || 'Restock'],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Gagal mencatat riwayat stok', details: err.message });
                    }
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                      }
                      res.json({ message: 'Stok berhasil ditambahkan' });
                    });
                  }
                );
              }
            );
          }
        }
      );
    });
  });
};

// Ambil daftar stok
const getStock = (req, res) => {
  db.all(
    'SELECT s.barang_id, b.nama_barang, b.harga, s.color, s.size, s.quantity, s.min_quantity ' +
    'FROM stock s JOIN barang b ON s.barang_id = b.id WHERE s.quantity > 0',
    [],
    (err, stocks) => {
      if (err) {
        return res.status(500).json({ error: 'Gagal mengambil stok', details: err.message });
      }
      res.json({ stocks });
    }
  );
};



// Ambil riwayat stok (hanya admin)
const getStockHistory = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  db.all(
    `SELECT sh.id, sh.stock_id, sh.order_id, sh.type, sh.quantity, sh.created_at, sh.description,
            s.barang_id, b.nama_barang, s.color, s.size
     FROM stock_history sh
     JOIN stock s ON sh.stock_id = s.id
     JOIN barang b ON s.barang_id = b.id`,
    [],
    (err, history) => {
      if (err) {
        return res.status(500).json({ error: 'Gagal mengambil riwayat stok', details: err.message });
      }
      res.json({ history });
    }
  );
};

module.exports = { addStock, getStock, getStockHistory };