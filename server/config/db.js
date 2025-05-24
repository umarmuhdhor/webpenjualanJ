const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/database/db.sqlite', (err) => {
  if (err) {
    console.error('Gagal membuka database:', err.message);
  } else {
    console.log('Berhasil terhubung ke database SQLite');
  }
});

module.exports = db;