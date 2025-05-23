const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'rahasia-kunci-anda-disini';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Tidak diizinkan' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token tidak valid' });
    req.user = decoded;
    next();
  });
};

module.exports = { authenticate };