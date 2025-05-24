const db = require('../config/db');

// Ambil daftar barang beserta bahan terkait
const getBarang = (req, res) => {
  db.all('SELECT id, nama_barang, url_gambar, deskripsi, harga FROM barang', [], (err, barang) => {
    if (err) {
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
};

// Tambah barang baru (hanya admin)
const addBarang = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { nama_barang, url_gambar, deskripsi, bahan_ids, harga } = req.body;

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
  if (!harga || isNaN(harga) || harga <= 0) {
    return res.status(400).json({ error: 'harga harus berupa angka positif' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.all('SELECT id FROM bahan WHERE id IN (' + bahan_ids.map(() => '?').join(',') + ')', bahan_ids, (err, bahan) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
      }
      if (bahan.length !== bahan_ids.length) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Satu atau lebih bahan_ids tidak valid' });
      }

      db.run(
        'INSERT INTO barang (nama_barang, url_gambar, deskripsi, harga) VALUES (?, ?, ?, ?)',
        [nama_barang, url_gambar || null, deskripsi || null, harga],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal menambah barang', details: err.message });
          }
          const barangId = this.lastID;

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
                  return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                }
                res.json({ message: 'Barang berhasil ditambahkan', barang_id: barangId });
              });
            })
            .catch((err) => {
              db.run('ROLLBACK');
              res.status(500).json({ error: 'Gagal menambah relasi barang_bahan', details: err.message });
            });
        }
      );
    });
  });
};

// Hapus barang (hanya admin)
const deleteBarang = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const barangId = req.params.id;

  if (isNaN(barangId) || barangId <= 0) {
    return res.status(400).json({ error: 'ID barang tidak valid' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.get('SELECT id FROM barang WHERE id = ?', [barangId], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Barang tidak ditemukan' });
      }

      db.get('SELECT id FROM orders WHERE barang_id = ?', [barangId], (err, order) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Gagal memeriksa pesanan', details: err.message });
        }
        if (order) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Barang tidak dapat dihapus karena sudah digunakan dalam pesanan' });
        }

        db.get('SELECT id FROM stock WHERE barang_id = ?', [barangId], (err, stock) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal memeriksa stok', details: err.message });
          }
          if (stock) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Barang tidak dapat dihapus karena masih memiliki stok' });
          }

          db.run('DELETE FROM barang_bahan WHERE barang_id = ?', [barangId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Gagal menghapus relasi barang_bahan', details: err.message });
            }

            db.run('DELETE FROM barang WHERE id = ?', [barangId], function (err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Gagal menghapus barang', details: err.message });
              }
              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Barang tidak ditemukan' });
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
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
};

// Perbarui barang (hanya admin)
const updateBarang = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const barangId = req.params.id;
  const { nama_barang, url_gambar, deskripsi, bahan_ids, harga } = req.body;

  if (isNaN(barangId) || barangId <= 0) {
    return res.status(400).json({ error: 'ID barang tidak valid' });
  }

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
  if (harga !== undefined && (isNaN(harga) || harga <= 0)) {
    return res.status(400).json({ error: 'harga harus berupa angka positif' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.get('SELECT id FROM barang WHERE id = ?', [barangId], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Barang tidak ditemukan' });
      }

      const updates = {};
      if (nama_barang) updates.nama_barang = nama_barang;
      if (url_gambar !== undefined) updates.url_gambar = url_gambar || null;
      if (deskripsi !== undefined) updates.deskripsi = deskripsi || null;
      if (harga !== undefined) updates.harga = harga;

      if (Object.keys(updates).length > 0) {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        db.run(
          `UPDATE barang SET ${setClause} WHERE id = ?`,
          [...Object.values(updates), barangId],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
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
              return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
            }
            res.json({ message: 'Barang berhasil diperbarui' });
          });
          return;
        }

        db.all('SELECT id FROM bahan WHERE id IN (' + bahan_ids.map(() => '?').join(',') + ')', bahan_ids, (err, bahan) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
          }
          if (bahan.length !== bahan_ids.length) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Satu atau lebih bahan_ids tidak valid' });
          }

          db.run('DELETE FROM barang_bahan WHERE barang_id = ?', [barangId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Gagal menghapus relasi barang_bahan lama', details: err.message });
            }

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
                    return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
                  }
                  res.json({ message: 'Barang berhasil diperbarui' });
                });
              })
              .catch((err) => {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Gagal menambah relasi barang_bahan baru', details: err.message });
              });
          });
        });
      }
    });
  });
};

module.exports = { getBarang, addBarang, deleteBarang, updateBarang };