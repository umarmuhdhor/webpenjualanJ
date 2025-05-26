const db = require('../config/db');

const BASE_COST_BORDIR = 50000;
const BASE_COST_SABLON = 30000;
const ADDITIONAL_COST_PER_DESIGN = 20000;

// Buat pesanan
const createOrder = (req, res) => {
  const { barang_id, sizes, quantity, details, designs } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Minimal pesanan adalah 1 pcs' });
  }

  if (!barang_id || isNaN(barang_id)) {
    return res.status(400).json({ error: 'barang_id harus berupa angka yang valid' });
  }

  if (!designs || !Array.isArray(designs) || designs.length === 0) {
    return res.status(400).json({ error: 'designs harus berupa array non-kosong' });
  }
  if (designs.length > 10) {
    return res.status(400).json({ error: 'Maksimal 10 desain per pesanan' });
  }
  for (const design of designs) {
    if (!design.type || !['sablon', 'bordir'].includes(design.type) || !design.url || typeof design.url !== 'string') {
      return res.status(400).json({ error: 'Setiap desain harus memiliki type (sablon/bordir) dan url (string)' });
    }
    if (design.url.length > 255) {
      return res.status(400).json({ error: 'URL desain terlalu panjang' });
    }
  }

  let parsedSizes;
  try {
    parsedSizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
    if (!Array.isArray(parsedSizes)) {
      return res.status(400).json({ error: 'sizes harus berupa array' });
    }
    if (parsedSizes.length > 10) {
      return res.status(400).json({ error: 'Maksimal 10 kombinasi ukuran per pesanan' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Format sizes tidak valid' });
  }

  const totalSizeQuantity = parsedSizes.reduce((sum, item) => sum + parseInt(item.quantity), 0);
  if (totalSizeQuantity !== parseInt(quantity)) {
    return res.status(400).json({ error: 'Total jumlah ukuran tidak sesuai dengan quantity' });
  }

  for (const item of parsedSizes) {
    if (!item.color || !item.size || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: 'Setiap entri sizes harus memiliki color, size, dan quantity positif' });
    }
    if (item.color.length > 50 || item.size.length > 10) {
      return res.status(400).json({ error: 'Color atau size terlalu panjang' });
    }
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.get('SELECT id, harga FROM barang WHERE id = ?', [barang_id], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: `Barang dengan id ${barang_id} tidak ditemukan` });
      }

      const sizeChecks = parsedSizes.map(({ color, size, quantity }) => {
        return new Promise((resolve, reject) => {
          db.get(
            'SELECT id, quantity, min_quantity FROM stock WHERE barang_id = ? AND color = ? AND size = ?',
            [barang_id, color, size],
            (err, stock) => {
              if (err) return reject(err);
              if (!stock) {
                return reject(new Error(`Stok untuk barang_id ${barang_id}, warna ${color}, ukuran ${size} tidak ditemukan`));
              }
              if (stock.quantity < quantity) {
                return reject(new Error(`Stok untuk barang_id ${barang_id}, warna ${color}, ukuran ${size} tidak cukup. Tersedia ${stock.quantity}, dibutuhkan ${quantity}`));
              }
              if (stock.quantity - quantity < stock.min_quantity) {
                console.log(`Peringatan: Stok barang_id ${barang_id}, warna ${color}, ukuran ${size} akan di bawah minimum (${stock.min_quantity}) setelah pesanan`);
              }
              resolve({ stock_id: stock.id, color, size, quantity });
            }
          );
        });
      });

      Promise.all(sizeChecks)
        .then((stockData) => {
          let totalDesignCost = 0;
          if (designs.length > 2) {
            const additionalDesigns = designs.length - 2;
            totalDesignCost = additionalDesigns * ADDITIONAL_COST_PER_DESIGN;
          }
          designs.forEach((design) => {
            if (design.type === 'bordir') totalDesignCost += BASE_COST_BORDIR;
            else totalDesignCost += BASE_COST_SABLON;
          });

          const totalPrice = (quantity * barang.harga) + totalDesignCost;

          db.run(
            'INSERT INTO orders (user_id, barang_id, sizes, quantity, details, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, barang_id, JSON.stringify(parsedSizes), quantity, details || '', totalPrice, 'diterima'],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Gagal membuat pesanan', details: err.message });
              }
              const orderId = this.lastID;

              const stockUpdates = stockData.map(({ stock_id, color, size, quantity }) => {
                return new Promise((resolve, reject) => {
                  db.run('UPDATE stock SET quantity = quantity - ? WHERE id = ?', [quantity, stock_id], (err) => {
                    if (err) return reject(err);
                    db.run(
                      'INSERT INTO stock_history (stock_id, order_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
                      [stock_id, orderId, 'out', quantity, `Pesanan #${orderId} (barang_id ${barang_id}, warna ${color}, ukuran ${size})`],
                      (err) => (err ? reject(err) : resolve())
                    );
                  });
                });
              });

              Promise.all(stockUpdates)
                .then(() => {
                  const designPromises = designs.map((design) => {
                    return new Promise((resolve, reject) => {
                      db.run(
                        'INSERT INTO order_designs (order_id, design_type, design_file) VALUES (?, ?, ?)',
                        [orderId, design.type, design.url],
                        (err) => (err ? reject(err) : resolve())
                      );
                    });
                  });

                  Promise.all(designPromises)
                    .then(() => {
                      db.run('COMMIT', (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                        }
                        res.json({ message: 'Pesanan berhasil dibuat', order_id: orderId });
                      });
                    })
                    .catch((err) => {
                      db.run('ROLLBACK');
                      res.status(500).json({ error: 'Gagal menyimpan desain', details: err.message });
                    });
                })
                .catch((err) => {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: 'Gagal memperbarui stok', details: err.message });
                });
            }
          );
        })
        .catch((err) => {
          db.run('ROLLBACK');
          res.status(400).json({ error: err.message });
        });
    });
  });
};

// Ambil semua pesanan (hanya admin)
const getAllOrders = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });
  db.all(
    'SELECT o.*, b.nama_barang FROM orders o JOIN barang b ON o.barang_id = b.id',
    (err, orders) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil pesanan', details: err.message });
      const orderPromises = orders.map(order =>
        new Promise((resolve) => {
          db.all('SELECT * FROM order_designs WHERE order_id = ?', [order.id], (err, designs) => {
            resolve({ ...order, sizes: JSON.parse(order.sizes), designs });
          });
        })
      );
      Promise.all(orderPromises).then(results =>
        res.json(results)
      );
    }
  );
};

// Ambil semua pesanan milik user
const getMyOrders = (req, res) => {
  db.all(
    'SELECT o.*, b.nama_barang FROM orders o JOIN barang b ON o.barang_id = b.id WHERE o.user_id = ?',
    [req.user.id],
    (err, orders) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil pesanan', details: err.message });
      if (!orders.length) return res.status(200).json({ message: 'Belum ada pesanan', orders: [] });

      const orderPromises = orders.map(order =>
        new Promise((resolve) => {
          db.all('SELECT * FROM order_designs WHERE order_id = ?', [order.id], (err, designs) => {
            if (err) resolve({ ...order, sizes: JSON.parse(order.sizes), designs: [] });
            resolve({ ...order, sizes: JSON.parse(order.sizes), designs });
          });
        })
      );
      Promise.all(orderPromises).then(results =>
        res.json({ orders: results })
      );
    }
  );
};

// Perbarui status pesanan (hanya admin)
const updateOrderStatus = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { status } = req.body;
  const orderId = req.params.id;
  const validStatuses = ['diterima', 'diproses', 'dibatalkan', 'selesai'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid. Harus salah satu dari: diterima, diproses, dibatalkan, selesai' });
  }

  if (status === 'dibatalkan') {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
      }

      db.get('SELECT barang_id, sizes FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Gagal memeriksa pesanan', details: err.message });
        }
        if (!order) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
        }

        const parsedSizes = JSON.parse(order.sizes);
        const stockRestores = parsedSizes.map(({ color, size, quantity }) => {
          return new Promise((resolve, reject) => {
            db.get(
              'SELECT id FROM stock WHERE barang_id = ? AND color = ? AND size = ?',
              [order.barang_id, color, size],
              (err, stock) => {
                if (err || !stock) {
                  return reject(err || new Error(`Stok untuk barang_id ${order.barang_id}, warna ${color}, ukuran ${size} tidak ditemukan`));
                }
                db.run(
                  'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
                  [quantity, stock.id],
                  (err) => {
                    if (err) return reject(err);
                    db.run(
                      'INSERT INTO stock_history (stock_id, order_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)',
                      [stock.id, orderId, 'in', quantity, `Pembatalan pesanan #${orderId} (barang_id ${order.barang_id}, warna ${color}, ukuran ${size})`],
                      (err) => (err ? reject(err) : resolve())
                    );
                  }
                );
              }
            );
          });
        });

        Promise.all(stockRestores)
          .then(() => {
            db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], function (err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Gagal memperbarui status', details: err.message });
              }
              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
              }
              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                }
                res.json({ message: `Status pesanan berhasil diperbarui menjadi ${status}` });
              });
            });
          })
          .catch((err) => {
            db.run('ROLLBACK');
            res.status(500).json({ error: 'Gagal mengembalikan stok', details: err.message });
          });
      });
    });
  } else {
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], function (err) {
      if (err) return res.status(500).json({ error: 'Gagal memperbarui status', details: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      res.json({ message: `Status pesanan berhasil diperbarui menjadi ${status}` });
    });
  }
};

module.exports = { createOrder, getAllOrders, getMyOrders, updateOrderStatus };