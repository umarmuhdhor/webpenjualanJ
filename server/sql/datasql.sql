-- Hapus tabel jika sudah ada
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_designs;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS stock_history;
DROP TABLE IF EXISTS barang;
DROP TABLE IF EXISTS bahan;
DROP TABLE IF EXISTS barang_bahan;

-- Tabel users (tetap)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE barang (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_barang TEXT NOT NULL,
  url_gambar TEXT,
  deskripsi TEXT,
  harga INTEGER NOT NULL DEFAULT 0 -- Harga dalam satuan terkecil, misalnya Rupiah
);

-- Tabel bahan (baru)
CREATE TABLE bahan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_bahan TEXT NOT NULL,
  deskripsi TEXT
);

-- Tabel barang_bahan (pivot untuk relasi many-to-many antara barang dan bahan)
CREATE TABLE barang_bahan (
  barang_id INTEGER NOT NULL,
  bahan_id INTEGER NOT NULL,
  PRIMARY KEY (barang_id, bahan_id),
  FOREIGN KEY (barang_id) REFERENCES barang(id),
  FOREIGN KEY (bahan_id) REFERENCES bahan(id)
);

-- Tabel orders (ganti product dengan barang_id)
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  barang_id INTEGER NOT NULL,
  sizes TEXT NOT NULL, -- JSON array: [{color, size, quantity}]
  quantity INTEGER NOT NULL,
  details TEXT,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (barang_id) REFERENCES barang(id)
);

-- Tabel order_designs (tetap)
CREATE TABLE order_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  design_type TEXT NOT NULL,
  design_file TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Tabel stock (ganti product dengan barang_id)
CREATE TABLE stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barang_id INTEGER NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(barang_id, color, size),
  FOREIGN KEY (barang_id) REFERENCES barang(id)
);

-- Tabel stock_history (tetap)
CREATE TABLE stock_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id INTEGER NOT NULL,
  order_id INTEGER,
  type TEXT NOT NULL, -- 'in' atau 'out'
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  FOREIGN KEY (stock_id) REFERENCES stock(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Indeks untuk performa
CREATE INDEX idx_stock_barang_id_color_size ON stock(barang_id, color, size);
CREATE INDEX idx_stock_history_order_id ON stock_history(order_id);
CREATE INDEX idx_barang_bahan_barang_id ON barang_bahan(barang_id);

-- Data awal untuk bahan
INSERT INTO bahan (nama_bahan, deskripsi) VALUES 
  ('Katun', 'Bahan lembut, menyerap keringat, cocok untuk pakaian sehari-hari'),
  ('Parasut', 'Bahan tahan air, ringan, sering digunakan untuk jaket'),
  ('Wol', 'Bahan hangat, cocok untuk pakaian musim dingin'),
  ('Lotto', 'Bahan elastis, sering digunakan untuk pakaian olahraga');

-- Data awal untuk barang
-- Perbarui data awal untuk barang dengan harga
INSERT INTO barang (nama_barang, url_gambar, deskripsi, harga) VALUES 
  ('Kaos A', '/images/kaos_a.jpg', 'Kaos polos berkualitas tinggi, cocok untuk custom sablon atau bordir', 75000),
  ('Hoodie A', '/images/hoodie_a.jpg', 'Hoodie nyaman dengan bahan tebal, ideal untuk cuaca dingin', 150000);

-- Data awal untuk barang_bahan (relasi)
INSERT INTO barang_bahan (barang_id, bahan_id) VALUES 
  (1, 1), -- Kaos A: Katun
  (1, 4), -- Kaos A: Lotto
  (2, 1), -- Hoodie A: Katun
  (2, 3); -- Hoodie A: Wol

-- Data stok awal (menggunakan barang_id, warna realistis: hitam, biru, merah)
INSERT INTO stock (barang_id, color, size, quantity, min_quantity) VALUES 
  (1, 'Hitam', 'S', 20, 5), -- Kaos A
  (1, 'Hitam', 'M', 25, 5),
  (1, 'Hitam', 'L', 15, 5),
  (1, 'Biru', 'S', 18, 5),
  (1, 'Biru', 'M', 22, 5),
  (1, 'Biru', 'L', 12, 5),
  (1, 'Merah', 'S', 15, 5),
  (1, 'Merah', 'M', 20, 5),
  (1, 'Merah', 'L', 10, 5),
  (2, 'Hitam', 'M', 30, 10), -- Hoodie A
  (2, 'Hitam', 'L', 25, 10),
  (2, 'Biru', 'M', 20, 10),
  (2, 'Biru', 'L', 15, 10),
  (2, 'Merah', 'M', 18, 10),
  (2, 'Merah', 'L', 12, 10);
  
  
  SELECT * FROM barang