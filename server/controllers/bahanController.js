const db = require('../config/db');

const getAllBahan = (req, res) => {
  db.all('SELECT * FROM bahan', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil data bahan', details: err.message });
    }
    res.json({ bahan: rows });
  });
};

// Tambah bahan baru (hanya admin)
const addBahan = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const { nama_bahan, deskripsi } = req.body;

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
        return res.status(500).json({ error: 'Gagal menambah bahan', details: err.message });
      }
      res.json({ message: 'Bahan berhasil ditambahkan', bahan_id: this.lastID });
    }
  );
};

// Hapus bahan (hanya admin)
const deleteBahan = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const bahanId = req.params.id;

  if (isNaN(bahanId) || bahanId <= 0) {
    return res.status(400).json({ error: 'ID bahan tidak valid' });
  }

  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal memulai transaksi', details: err.message });
    }

    db.get('SELECT id FROM bahan WHERE id = ?', [bahanId], (err, bahan) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Gagal memeriksa bahan', details: err.message });
      }
      if (!bahan) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Bahan tidak ditemukan' });
      }

      db.get('SELECT barang_id FROM barang_bahan WHERE bahan_id = ?', [bahanId], (err, barang) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Gagal memeriksa relasi barang_bahan', details: err.message });
        }
        if (barang) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Bahan tidak dapat dihapus karena masih digunakan oleh barang' });
        }

        db.run('DELETE FROM bahan WHERE id = ?', [bahanId], function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Gagal menghapus bahan', details: err.message });
          }
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Bahan tidak ditemukan' });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Gagal menyelesaikan transaksi', details: err.message });
            }
            res.json({ message: 'Bahan berhasil dihapus' });
          });
        });
      });
    });
  });
};

// Perbarui bahan (hanya admin)
const updateBahan = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  const bahanId = req.params.id;
  const { nama_bahan, deskripsi } = req.body;

  if (isNaN(bahanId) || bahanId <= 0) {
    return res.status(400).json({ error: 'ID bahan tidak valid' });
  }

  if (nama_bahan && (typeof nama_bahan !== 'string' || nama_bahan.length > 100)) {
    return res.status(400).json({ error: 'nama_bahan harus berupa string maksimal 100 karakter' });
  }
  if (deskripsi && (typeof deskripsi !== 'string' || deskripsi.length > 1000)) {
    return res.status(400).json({ error: 'deskripsi harus berupa string maksimal 1000 karakter' });
  }
  if (!nama_bahan && deskripsi === undefined) {
    return res.status(400).json({ error: 'Setidaknya salah satu dari nama_bahan atau deskripsi harus disediakan' });
  }

  const updates = {};
  if (nama_bahan) updates.nama_bahan = nama_bahan;
  if (deskripsi !== undefined) updates.deskripsi = deskripsi || null;

  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  db.run(
    `UPDATE bahan SET ${setClause} WHERE id = ?`,
    [...Object.values(updates), bahanId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Gagal memperbarui bahan', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bahan tidak ditemukan' });
      }
      res.json({ message: 'Bahan berhasil diperbarui' });
    }
  );
};

module.exports = { addBahan, deleteBahan, updateBahan, getAllBahan };