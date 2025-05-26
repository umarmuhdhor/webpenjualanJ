const db = require('../config/db');
const path = require('path');
const fs = require('fs');

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

  const { nama_barang, deskripsi, bahan_ids, harga } = req.body;
  const gambar = req.file ? `images/${req.file.filename}` : null;

  // Validasi input
  if (!nama_barang || typeof nama_barang !== 'string' || nama_barang.length > 100) {
    return res.status(400).json({ error: 'nama_barang harus berupa string maksimal 100 karakter' });
  }
  if (!gambar) {
    return res.status(400).json({ error: 'Gambar diperlukan' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }
  if (!bahan_ids) {
    return res.status(400).json({ error: 'bahan_ids diperlukan' });
  }
  let bahanIdsArray;
  try {
    bahanIdsArray = JSON.parse(bahan_ids);
    if (!Array.isArray(bahanIdsArray) || bahanIdsArray.length === 0) {
      return res.status(400).json({ error: 'bahan_ids harus berupa array ID bahan non-kosong' });
    }
    if (bahanIdsArray.some(id => isNaN(id) || id <= 0)) {
      return res.status(400).json({ error: 'bahan_ids harus berisi ID bahan yang valid' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'bahan_ids harus berupa string JSON array yang valid' });
  }
  if (!harga || isNaN(harga) || harga <= 0) {
    return res.status(400).json({ error: 'harga harus berupa angka positif' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.all('SELECT id FROM bahan WHERE id IN (' + bahanIdsArray.map(() => '?').join(',') + ')', bahanIdsArray, (err, bahan) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
      }
      if (bahan.length !== bahanIdsArray.length) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Satu atau lebih bahan_ids tidak valid' });
      }

      db.run(
        'INSERT INTO barang (nama_barang, url_gambar, deskripsi, harga) VALUES (?, ?, ?, ?)',
        [nama_barang, gambar, deskripsi || null, harga],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal menambah barang', details: err.message });
          }
          const barangId = this.lastID;

          const insertBahan = bahanIdsArray.map(bahan_id => {
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
                // Fetch the newly created barang with bahan for response
                db.get('SELECT id, nama_barang, url_gambar, deskripsi, harga FROM barang WHERE id = ?', [barangId], (err, item) => {
                  if (err) {
                    return res.status(500).json({ error: 'Gagal mengambil barang', details: err.message });
                  }
                  db.all(
                    'SELECT b.id, b.nama_bahan, b.deskripsi FROM bahan b ' +
                    'JOIN barang_bahan bb ON b.id = bb.bahan_id WHERE bb.barang_id = ?',
                    [barangId],
                    (err, bahan) => {
                      if (err) {
                        return res.status(500).json({ error: 'Gagal mengambil bahan', details: err.message });
                      }
                      res.json({ message: 'Barang berhasil ditambahkan', barang: { ...item, bahan } });
                    }
                  );
                });
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

    db.get('SELECT id, url_gambar FROM barang WHERE id = ?', [barangId], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Barang tidak ditemukan' });
      }

      db.get("SELECT id FROM orders WHERE barang_id = ? AND status = 'diproses'", [barangId], (err, order) => {
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

          // Delete image file
          if (barang.url_gambar) {
            const imagePath = path.join(__dirname, '../public', barang.url_gambar);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
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
  const { nama_barang, deskripsi, bahan_ids, harga } = req.body;
  const gambar = req.file ? `images/${req.file.filename}` : undefined;

  if (isNaN(barangId) || barangId <= 0) {
    return res.status(400).json({ error: 'ID barang tidak valid' });
  }

  if (nama_barang && (typeof nama_barang !== 'string' || nama_barang.length > 100)) {
    return res.status(400).json({ error: 'nama_barang harus berupa string maksimal 100 karakter' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }
  if (bahan_ids) {
    let bahanIdsArray;
    try {
      bahanIdsArray = JSON.parse(bahan_ids);
      if (!Array.isArray(bahanIdsArray) || bahanIdsArray.some(id => isNaN(id) || id <= 0)) {
        return res.status(400).json({ error: 'bahan_ids harus berupa array ID bahan yang valid' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'bahan_ids harus berupa string JSON array yang valid' });
    }
  }
  if (harga !== undefined && (isNaN(harga) || harga <= 0)) {
    return res.status(400).json({ error: 'harga harus berupa angka positif' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.get('SELECT id, url_gambar FROM barang WHERE id = ?', [barangId], (err, barang) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa barang', details: err.message });
      }
      if (!barang) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Barang tidak ditemukan' });
      }

      // Delete old image if a new one is uploaded
      if (gambar && barang.url_gambar) {
        const oldImagePath = path.join(__dirname, '../public', barang.url_gambar);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const updates = {};
      if (nama_barang) updates.nama_barang = nama_barang;
      if (gambar !== undefined) updates.url_gambar = gambar;
      if (deskripsi !== undefined) updates.deskripsi = deskripsi || null;
      if (harga !== undefined) updates.harga = harga;

      const proceedWithBahan = () => {
        if (!bahan_ids) {
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
            }
            // Fetch updated barang with bahan
            db.get('SELECT id, nama_barang, url_gambar, deskripsi, harga FROM barang WHERE id = ?', [barangId], (err, item) => {
              if (err) {
                return res.status(500).json({ error: 'Gagal mengambil barang', details: err.message });
              }
              db.all(
                'SELECT b.id, b.nama_bahan, b.deskripsi FROM bahan b ' +
                'JOIN barang_bahan bb ON b.id = bb.bahan_id WHERE bb.barang_id = ?',
                [barangId],
                (err, bahan) => {
                  if (err) {
                    return res.status(500).json({ error: 'Gagal mengambil bahan', details: err.message });
                  }
                  res.json({ message: 'Barang berhasil diperbarui', barang: { ...item, bahan } });
                }
              );
            });
          });
          return;
        }

        let bahanIdsArray;
        try {
          bahanIdsArray = JSON.parse(bahan_ids);
        } catch (error) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'bahan_ids harus berupa string JSON array yang valid' });
        }

        db.all('SELECT id FROM bahan WHERE id IN (' + bahanIdsArray.map(() => '?').join(',') + ')', bahanIdsArray, (err, bahan) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
          }
          if (bahan.length !== bahanIdsArray.length) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Satu atau lebih bahan_ids tidak valid' });
          }

          db.run('DELETE FROM barang_bahan WHERE barang_id = ?', [barangId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Gagal menghapus relasi barang_bahan lama', details: err.message });
            }

            const insertBahan = bahanIdsArray.map(bahan_id => {
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
                  // Fetch updated barang with bahan
                  db.get('SELECT id, nama_barang, url_gambar, deskripsi, harga FROM barang WHERE id = ?', [barangId], (err, item) => {
                    if (err) {
                      return res.status(500).json({ error: 'Gagal mengambil barang', details: err.message });
                    }
                    db.all(
                      'SELECT b.id, b.nama_bahan, b.deskripsi FROM bahan b ' +
                      'JOIN barang_bahan bb ON b.id = bb.bahan_id WHERE bb.barang_id = ?',
                      [barangId],
                      (err, bahan) => {
                        if (err) {
                          return res.status(500).json({ error: 'Gagal mengambil bahan', details: err.message });
                        }
                        res.json({ message: 'Barang berhasil diperbarui', barang: { ...item, bahan } });
                      }
                    );
                  });
                });
              })
              .catch((err) => {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Gagal menambah relasi barang_bahan baru', details: err.message });
              });
          });
        });
      };

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
    });
  });
};

module.exports = { getBarang, addBarang, deleteBarang, updateBarang };