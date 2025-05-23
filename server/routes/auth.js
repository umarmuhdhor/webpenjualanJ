const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./server/database/db.sqlite');
const SECRET_KEY = process.env.SECRET_KEY || 'rahasia-kunci-anda-disini';

// Middleware untuk autentikasi (dipindah ke sini agar bisa digunakan di auth.js)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Tidak diizinkan' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token tidak valid' });
    req.user = decoded;
    next();
  });
};

// Registrasi pengguna baru
router.post('/register', async (req, res) => {
  const { name, phone_number, email, password } = req.body;

  // Validasi input
  if (!name || !phone_number || !email || !password) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  // Validasi format nomor telepon (contoh: hanya angka, minimal 10 digit)
  const phoneRegex = /^\d{10,15}$/;
  if (!phoneRegex.test(phone_number)) {
    return res.status(400).json({ error: 'Nomor telepon harus berupa angka dan antara 10-15 digit' });
  }

  // Validasi panjang password (minimal 8 karakter)
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password harus minimal 8 karakter' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hash password berhasil:', hashedPassword);

    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        console.error('Gagal memeriksa struktur tabel:', err.message);
      } else {
        console.log('Kolom di tabel users:', columns.map(col => col.name));
      }
    });

    // Simpan pengguna ke database
    db.run(
      'INSERT INTO users (name, phone_number, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, phone_number, email, hashedPassword, 'user'],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email sudah terdaftar' });
          }
          return res.status(500).json({ error: 'Gagal mendaftar', details: err.message });
        }
        res.status(201).json({ message: 'Pengguna berhasil terdaftar' });
      }
    );
  } catch (error) {
    console.error('Error saat registrasi:', error.message);
    res.status(500).json({ error: 'Gagal mendaftar' });
  }
});

// Login pengguna
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  // Cari pengguna berdasarkan email
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Error saat mencari pengguna:', err.message);
      return res.status(500).json({ error: 'Gagal login', details: err.message });
    }
    if (!user) {
      console.log(`Pengguna dengan email ${email} tidak ditemukan`);
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Verifikasi password
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Password salah untuk email ${email}`);
        return res.status(401).json({ error: 'Email atau password salah' });
      }

      // Buat token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, phone_number: user.phone_number },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      console.log(`Login berhasil untuk ${email}, token: ${token}`);
      res.json({ token, role: user.role, name: user.name, phone_number: user.phone_number });
    } catch (error) {
      console.error('Error saat verifikasi password:', error.message);
      res.status(500).json({ error: 'Gagal login', details: error.message });
    }
  });
});

// Ambil semua pengguna (hanya admin)
router.get('/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  db.all('SELECT id, name, phone_number, email, role FROM users', (err, users) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data pengguna', details: err.message });
    if (!users.length) return res.status(200).json({ message: 'Belum ada pengguna', users: [] });
    res.json({ users });
  });
});

module.exports = { router, authenticate };