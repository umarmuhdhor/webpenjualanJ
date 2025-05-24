const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SECRET_KEY = process.env.SECRET_KEY || 'rahasia-kunci-anda-disini';

// Registrasi pengguna baru
const register = async (req, res) => {
  const { name, phone_number, email, password } = req.body;

  // Validasi input
  if (!name || !phone_number || !email || !password) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  const phoneRegex = /^\d{10,15}$/;
  if (!phoneRegex.test(phone_number)) {
    return res.status(400).json({ error: 'Nomor telepon harus berupa angka dan antara 10-15 digit' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password harus minimal 8 karakter' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
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
    res.status(500).json({ error: 'Gagal mendaftar' });
  }
};

// Login pengguna
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal login', details: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Email atau password salah' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, phone_number: user.phone_number },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      res.json({ token, role: user.role, name: user.name, phone_number: user.phone_number });
    } catch (error) {
      res.status(500).json({ error: 'Gagal login', details: error.message });
    }
  });
};

// Ambil semua pengguna (hanya admin)
const getUsers = (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya untuk admin' });

  db.all('SELECT id, name, phone_number, email, role FROM users', (err, users) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data pengguna', details: err.message });
    if (!users.length) return res.status(200).json({ message: 'Belum ada pengguna', users: [] });
    res.json({ users });
  });
};

module.exports = { register, login, getUsers };