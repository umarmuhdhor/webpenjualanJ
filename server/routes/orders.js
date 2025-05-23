const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const db = new sqlite3.Database('./server/database/db.sqlite');
const { authenticate } = require('./auth');

// Biaya dasar per desain
const BASE_COST_BORDIR = 50000; // Rp50.000 per bordir
const BASE_COST_SABLON = 30000; // Rp30.000 per sablon
const ADDITIONAL_COST_PER_DESIGN = 20000; // Rp20.000 per desain tambahan (>2)

// Buat pesanan
router.post('/', authenticate, (req, res) => {
  const { barang_id, sizes, quantity, details, unitPrice, designs } = req.body;

  // Validasi minimal pesanan
  if (!quantity || quantity < 12) {
    return res.status(400).json({ error: 'Minimal pesanan adalah 12 pcs' });
  }

  // Validasi barang_id
  if (!barang_id || isNaN(barang_id)) {
    return res.status(400).json({ error: 'barang_id harus berupa angka yang valid' });
  }

  // Validasi unitPrice
  if (!unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
    return res.status(400).json({ error: 'unitPrice harus berupa angka positif' });
  }

  // Validasi designs
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

  // Validasi sizes
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

  // Validasi total quantity dari sizes
  const totalSizeQuantity = parsedSizes.reduce((sum, item) => sum + parseInt(item.quantity), 0);
  if (totalSizeQuantity !== parseInt(quantity)) {
    return res.status(400).json({ error: 'Total jumlah ukuran tidak sesuai dengan quantity' });
  }

  // Validasi format setiap entri sizes
  for (const item of parsedSizes) {
    if (!item.color || !item.size || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: 'Setiap entri sizes harus memiliki color, size, dan quantity positif' });
    }
    if (item.color.length > 50 || item.size.length > 10) {
      return res.status(400).json({ error: 'Color atau size terlalu panjang' });
    }
  }

  // Mulai transaksi
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Gagal memulai transaksi:', err.message);
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    // Validasi barang_id ada di tabel barang
    db.get('SELECT id FROM barang WHERE id = ?', [barang_id], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Gagal memeriksa barang:', err.message);
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: `Barang dengan id ${barang_id} tidak ditemukan` });
      }

      // Cek stok untuk setiap kombinasi color dan size
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
          // Hitung biaya desain
          let totalDesignCost = 0;
          if (designs.length > 2) {
            const additionalDesigns = designs.length - 2;
            totalDesignCost = additionalDesigns * ADDITIONAL_COST_PER_DESIGN;
          }
          designs.forEach((design) => {
            if (design.type === 'bordir') totalDesignCost += BASE_COST_BORDIR;
            else totalDesignCost += BASE_COST_SABLON;
          });

          const totalPrice = (quantity * unitPrice) + totalDesignCost;

          // Simpan pesanan
          db.run(
            'INSERT INTO orders (user_id, barang_id, sizes, quantity, details, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, barang_id, JSON.stringify(parsedSizes), quantity, details || '', totalPrice, 'diterima'],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('Gagal membuat pesanan:', err.message);
                return res.status(500).json({ error: 'Gagal membuat pesanan', details: err.message });
              }
              const orderId = this.lastID;

              // Kurangi stok dan catat riwayat
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
                  // Simpan desain
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
                          console.error('Gagal commit transaksi:', err.message);
                          return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                        }
                        res.json({ message: 'Pesanan berhasil dibuat', order_id: orderId });
                      });
                    })
                    .catch((err) => {
                      db.run('ROLLBACK');
                      console.error('Gagal menyimpan desain:', err.message);
                      res.status(500).json({ error: 'Gagal menyimpan desain', details: err.message });
                    });
                })
                .catch((err) => {
                  db.run('ROLLBACK');
                  console.error('Gagal memperbarui stok atau riwayat:', err.message);
                  res.status(500).json({ error: 'Gagal memperbarui stok', details: err.message });
                });
            }
          );
        })
        .catch((err) => {
          db.run('ROLLBACK');
          console.error('Gagal memeriksa stok:', err.message);
          res.status(400).json({ error: err.message });
        });
    });
  });
});

// Ambil semua pesanan (hanya admin)
router.get('/', authenticate, (req, res) => {
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
});

// Ambil semua pesanan milik user
router.get('/my-orders', authenticate, (req, res) => {
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
});

// Perbarui status pesanan (hanya admin, dengan pengembalian stok saat pembatalan)
router.patch('/:id/status', authenticate, (req, res) => {
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
        console.error('Gagal memulai transaksi:', err.message);
        return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
      }

      db.get('SELECT barang_id, sizes FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Gagal memeriksa pesanan:', err.message);
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
                console.error('Gagal memperbarui status:', err.message);
                return res.status(500).json({ error: 'Gagal memperbarui status', details: err.message });
              }
              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
              }
              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Gagal commit transaksi:', err.message);
                  return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                }
                res.json({ message: `Status pesanan berhasil diperbarui menjadi ${status}` });
              });
            });
          })
          .catch((err) => {
            db.run('ROLLBACK');
            console.error('Gagal mengembalikan stok:', err.message);
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
});

// Tambah stok (hanya admin)
router.post('/stock', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { barang_id, color, size, quantity, description } = req.body;

  // Validasi input
  if (!barang_id || isNaN(barang_id) || !color || !size || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Semua field wajib diisi dan barang_id/quantity harus valid' });
  }
  if (color.length > 50 || size.length > 10) {
    return res.status(400).json({ error: 'Color atau size terlalu panjang' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Gagal memulai transaksi:', err.message);
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    // Validasi barang_id
    db.get('SELECT id FROM barang WHERE id = ?', [barang_id], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Gagal memeriksa barang:', err.message);
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
            console.error('Gagal memeriksa stok:', err.message);
            return res.status(500).json({ error: 'Gagal memeriksa stok', details: err.message });
          }

          if (stock) {
            // Update stok yang ada
            db.run(
              'UPDATE stock SET quantity = quantity + ? WHERE id = ?',
              [quantity, stock.id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Gagal memperbarui stok:', err.message);
                  return res.status(500).json({ error: 'Gagal memperbarui stok', details: err.message });
                }
                db.run(
                  'INSERT INTO stock_history (stock_id, type, quantity, description) VALUES (?, ?, ?, ?)',
                  [stock.id, 'in', quantity, description || 'Restock'],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      console.error('Gagal mencatat riwayat stok:', err.message);
                      return res.status(500).json({ error: 'Gagal mencatat riwayat stok', details: err.message });
                    }
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        console.error('Gagal commit transaksi:', err.message);
                        return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                      }
                      res.json({ message: 'Stok berhasil ditambahkan' });
                    });
                  }
                );
              }
            );
          } else {
            // Tambah stok baru
            db.run(
              'INSERT INTO stock (barang_id, color, size, quantity, min_quantity) VALUES (?, ?, ?, ?, ?)',
              [barang_id, color, size, quantity, 0],
              function (err) {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Gagal menambah stok:', err.message);
                  return res.status(500).json({ error: 'Gagal menambah stok', details: err.message });
                }
                const stockId = this.lastID;
                db.run(
                  'INSERT INTO stock_history (stock_id, type, quantity, description) VALUES (?, ?, ?, ?)',
                  [stockId, 'in', quantity, description || 'Restock'],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      console.error('Gagal mencatat riwayat stok:', err.message);
                      return res.status(500).json({ error: 'Gagal mencatat riwayat stok', details: err.message });
                    }
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        console.error('Gagal commit transaksi:', err.message);
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
});

// Ambil daftar stok
router.get('/stock', (req, res) => {
  db.all(
    'SELECT s.barang_id, b.nama_barang, s.color, s.size, s.quantity, s.min_quantity ' +
    'FROM stock s JOIN barang b ON s.barang_id = b.id WHERE s.quantity > 0',
    [],
    (err, stocks) => {
      if (err) {
        console.error('Gagal mengambil stok:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil stok', details: err.message });
      }
      res.json({ stocks });
    }
  );
});

// Ambil riwayat stok (hanya admin)
router.get('/stock/history', authenticate, (req, res) => {
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
        console.error('Gagal mengambil riwayat stok:', err.message);
        return res.status(500).json({ error: 'Gagal mengambil riwayat stok', details: err.message });
      }
      res.json({ history });
    }
  );
});

// Ambil daftar barang beserta bahan terkait
router.get('/barang', (req, res) => {
  db.all('SELECT id, nama_barang, url_gambar, deskripsi FROM barang', [], (err, barang) => {
    if (err) {
      console.error('Gagal mengambil barang:', err.message);
      return res.status(500).json({ error: 'Gagal mengambil barang', details: err.message });
    }
    const barangPromises = barang.map(item =>
      new Promise((resolve) => {
        db.all(
          'SELECT b.id, b.nama_bahan, b.deskripsi FROM bahan b ' +
          'JOIN barang_bahan bb ON b.id = bb.bahan_id WHERE bb.barang_id = ?',
          [item.id],
          (err, bahan) => {
            resolve({ ...item, bahan });
          }
        );
      })
    );
    Promise.all(barangPromises).then(results =>
      res.json({ barang: results })
    );
  });
});

// Tambah barang baru (hanya admin)
router.post('/barang', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { nama_barang, url_gambar, deskripsi, bahan_ids } = req.body;

  // Validasi input
  if (!nama_barang || typeof nama_barang !== 'string' || nama_barang.length > 100) {
    return res.status(400).json({ error: 'nama_barang harus berupa string maksimal 100 karakter' });
  }
  if (url_gambar && (typeof url_gambar !== 'string' || url_gambar.length > 255)) {
    return res.status(400).json({ error: 'url_gambar harus berupa string maksimal 255 karakter' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }
  if (!bahan_ids || !Array.isArray(bahan_ids) || bahan_ids.length === 0) {
    return res.status(400).json({ error: 'bahan_ids harus berupa array ID bahan non-kosong' });
  }
  if (bahan_ids.some(id => isNaN(id) || id <= 0)) {
    return res.status(400).json({ error: 'bahan_ids harus berisi ID bahan yang valid' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Gagal memulai transaksi:', err.message);
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    // Validasi bahan_ids
    db.all('SELECT id FROM bahan WHERE id IN (' + bahan_ids.map(() => '?').join(',') + ')', bahan_ids, (err, bahan) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Gagal memeriksa bahan:', err.message);
        return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
      }
      if (bahan.length !== bahan_ids.length) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Satu atau lebih bahan_ids tidak valid' });
      }

      // Tambah barang
      db.run(
        'INSERT INTO barang (nama_barang, url_gambar, deskripsi) VALUES (?, ?, ?)',
        [nama_barang, url_gambar || null, deskripsi || null],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('Gagal menambah barang:', err.message);
            return res.status(500).json({ error: 'Gagal menambah barang', details: err.message });
          }
          const barangId = this.lastID;

          // Tambah relasi barang_bahan
          const insertBahan = bahan_ids.map(bahan_id => {
            return new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO barang_bahan (barang_id, bahan_id) VALUES (?, ?)',
                [barangId, bahan_id],
                (err) => (err ? reject(err) : resolve())
              );
            });
          });

          Promise.all(insertBahan)
            .then(() => {
              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Gagal commit transaksi:', err.message);
                  return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                }
                res.json({ message: 'Barang berhasil ditambahkan', barang_id: barangId });
              });
            })
            .catch((err) => {
              db.run('ROLLBACK');
              console.error('Gagal menambah relasi barang_bahan:', err.message);
              res.status(500).json({ error: 'Gagal menambah relasi bahan', details: err.message });
            });
        }
      );
    });
  });
});

// Hapus barang (hanya admin)
router.delete('/barang/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const barangId = req.params.id;

  if (isNaN(barangId) || barangId <= 0) {
    return res.status(400).json({ error: 'ID barang tidak valid' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Gagal memulai transaksi:', err.message);
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    // Cek apakah barang ada
    db.get('SELECT id FROM barang WHERE id = ?', [barangId], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Gagal memeriksa barang:', err.message);
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Barang tidak ditemukan' });
      }

      // Cek apakah barang digunakan di pesanan
      db.get('SELECT id FROM orders WHERE barang_id = ?', [barangId], (err, order) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Gagal memeriksa pesanan:', err.message);
          return res.status(500).json({ error: 'Gagal memeriksa pesanan', details: err.message });
        }
        if (order) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Barang tidak dapat dihapus karena sudah digunakan dalam pesanan' });
        }

        // Cek apakah barang memiliki stok
        db.get('SELECT id FROM stock WHERE barang_id = ?', [barangId], (err, stock) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Gagal memeriksa stok:', err.message);
            return res.status(500).json({ error: 'Gagal memeriksa stok', details: err.message });
          }
          if (stock) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Barang tidak dapat dihapus karena masih memiliki stok' });
          }

          // Hapus relasi barang_bahan
          db.run('DELETE FROM barang_bahan WHERE barang_id = ?', [barangId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Gagal menghapus relasi barang_bahan:', err.message);
              return res.status(500).json({ error: 'Gagal menghapus relasi bahan', details: err.message });
            }

            // Hapus barang
            db.run('DELETE FROM barang WHERE id = ?', [barangId], function (err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('Gagal menghapus barang:', err.message);
                return res.status(500).json({ error: 'Gagal menghapus barang', details: err.message });
              }
              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Barang tidak ditemukan' });
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Gagal commit transaksi:', err.message);
                  return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                }
                res.json({ message: 'Barang berhasil dihapus' });
              });
            });
          });
        });
      });
    });
  });
});

// Perbarui barang (hanya admin)
router.patch('/barang/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const barangId = req.params.id;
  const { nama_barang, url_gambar, deskripsi, bahan_ids } = req.body;

  if (isNaN(barangId) || barangId <= 0) {
    return res.status(400).json({ error: 'ID barang tidak valid' });
  }

  // Validasi input
  if (nama_barang && (typeof nama_barang !== 'string' || nama_barang.length > 100)) {
    return res.status(400).json({ error: 'nama_barang harus berupa string maksimal 100 karakter' });
  }
  if (url_gambar && (typeof url_gambar !== 'string' || url_gambar.length > 255)) {
    return res.status(400).json({ error: 'url_gambar harus berupa string maksimal 255 karakter' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }
  if (bahan_ids && (!Array.isArray(bahan_ids) || bahan_ids.some(id => isNaN(id) || id <= 0))) {
    return res.status(400).json({ error: 'bahan_ids harus berupa array ID bahan yang valid' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Gagal memulai transaksi:', err.message);
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    // Cek apakah barang ada
    db.get('SELECT id FROM barang WHERE id = ?', [barangId], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Gagal memeriksa barang:', err.message);
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Barang tidak ditemukan' });
      }

      // Update barang
      const updates = {};
      if (nama_barang) updates.nama_barang = nama_barang;
      if (url_gambar !== undefined) updates.url_gambar = url_gambar || null;
      if (deskripsi !== undefined) updates.deskripsi = deskripsi || null;

      if (Object.keys(updates).length > 0) {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        db.run(
          `UPDATE barang SET ${setClause} WHERE id = ?`,
          [...Object.values(updates), barangId],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Gagal memperbarui barang:', err.message);
              return res.status(500).json({ error: 'Gagal memperbarui barang', details: err.message });
            }
            if (this.changes === 0) {
              db.run('ROLLBACK');
              return res.status(404).json({ error: 'Barang tidak ditemukan' });
            }
            proceedWithBahan();
          }
        );
      } else {
        proceedWithBahan();
      }

      function proceedWithBahan() {
        if (!bahan_ids) {
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Gagal commit transaksi:', err.message);
              return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
            }
            res.json({ message: 'Barang berhasil diperbarui' });
          });
          return;
        }

        // Validasi bahan_ids
        db.all('SELECT id FROM bahan WHERE id IN (' + bahan_ids.map(() => '?').join(',') + ')', bahan_ids, (err, bahan) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Gagal memeriksa bahan:', err.message);
            return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
          }
          if (bahan.length !== bahan_ids.length) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Satu atau lebih bahan_ids tidak valid' });
          }

          // Hapus relasi barang_bahan lama
          db.run('DELETE FROM barang_bahan WHERE barang_id = ?', [barangId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Gagal menghapus relasi barang_bahan lama:', err.message);
              return res.status(500).json({ error: 'Gagal menghapus relasi bahan lama', details: err.message });
            }

            // Tambah relasi barang_bahan baru
            const insertBahan = bahan_ids.map(bahan_id => {
              return new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO barang_bahan (barang_id, bahan_id) VALUES (?, ?)',
                  [barangId, bahan_id],
                  (err) => (err ? reject(err) : resolve())
                );
              });
            });

            Promise.all(insertBahan)
              .then(() => {
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    console.error('Gagal commit transaksi:', err.message);
                    return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                  }
                  res.json({ message: 'Barang berhasil diperbarui' });
                });
              })
              .catch((err) => {
                db.run('ROLLBACK');
                console.error('Gagal menambah relasi barang_bahan baru:', err.message);
                res.status(500).json({ error: 'Gagal menambah relasi bahan baru', details: err.message });
              });
          });
        });
      }
    });
  });
});

// Tambah bahan baru (hanya admin)
router.post('/bahan', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { nama_bahan, deskripsi } = req.body;

  // Validasi input
  if (!nama_bahan || typeof nama_bahan !== 'string' || nama_bahan.length > 100) {
    return res.status(400).json({ error: 'nama_bahan harus berupa string maksimal 100 karakter' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }

  db.run(
    'INSERT INTO bahan (nama_bahan, deskripsi) VALUES (?, ?)',
    [nama_bahan, deskripsi || null],
    function (err) {
      if (err) {
        console.error('Gagal menambah bahan:', err.message);
        return res.status(500).json({ error: 'Gagal menambah bahan', details: err.message });
      }
      res.json({ message: 'Bahan berhasil ditambahkan', bahan_id: this.lastID });
    }
  );
});

// Hapus bahan (hanya admin)
router.delete('/bahan/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const bahanId = req.params.id;

  if (isNaN(bahanId) || bahanId <= 0) {
    return res.status(400).json({ error: 'ID bahan tidak valid' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Gagal memulai transaksi:', err.message);
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    // Cek apakah bahan ada
    db.get('SELECT id FROM bahan WHERE id = ?', [bahanId], (err, bahan) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Gagal memeriksa bahan:', err.message);
        return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
      }
      if (!bahan) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Bahan tidak ditemukan' });
      }

      // Cek apakah bahan digunakan di barang_bahan
      db.get('SELECT barang_id FROM barang_bahan WHERE bahan_id = ?', [bahanId], (err, barang) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Gagal memeriksa relasi barang_bahan:', err.message);
          return res.status(500).json({ error: 'Gagal memeriksa relasi barang_bahan', details: err.message });
        }
        if (barang) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Bahan tidak dapat dihapus karena masih digunakan oleh barang' });
        }

        // Hapus bahan
        db.run('DELETE FROM bahan WHERE id = ?', [bahanId], function (err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('Gagal menghapus bahan:', err.message);
            return res.status(500).json({ error: 'Gagal menghapus bahan', details: err.message });
          }
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Bahan tidak ditemukan' });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Gagal commit transaksi:', err.message);
              return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
            }
            res.json({ message: 'Bahan berhasil dihapus' });
          });
        });
      });
    });
  });
});

// Perbarui bahan (hanya admin)
router.patch('/bahan/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const bahanId = req.params.id;
  const { nama_bahan, deskripsi } = req.body;

  if (isNaN(bahanId) || bahanId <= 0) {
    return res.status(400).json({ error: 'ID bahan tidak valid' });
  }

  // Validasi input
  if (nama_bahan && (typeof nama_bahan !== 'string' || nama_bahan.length > 100)) {
    return res.status(400).json({ error: 'nama_bahan harus berupa string maksimal 100 karakter' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }
  if (!nama_bahan && deskripsi === undefined) {
    return res.status(400).json({ error: 'Setidaknya salah satu dari nama_bahan atau deskripsi harus disediakan' });
  }

  // Update bahan
  const updates = {};
  if (nama_bahan) updates.nama_bahan = nama_bahan;
  if (deskripsi !== undefined) updates.deskripsi = deskripsi || null;

  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  db.run(
    `UPDATE bahan SET ${setClause} WHERE id = ?`,
    [...Object.values(updates), bahanId],
    function (err) {
      if (err) {
        console.error('Gagal memperbarui bahan:', err.message);
        return res.status(500).json({ error: 'Gagal memperbarui bahan', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bahan tidak ditemukan' });
      }
      res.json({ message: 'Bahan berhasil diperbarui' });
    }
  );
});

module.exports = router;