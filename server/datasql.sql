-- Tabel users (dari auth.js, tetap)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Tabel orders (diperbarui: hapus kolom color)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product TEXT NOT NULL,
  sizes TEXT NOT NULL, -- JSON array: [{color, size, quantity}]
  quantity INTEGER NOT NULL,
  details TEXT,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabel order_designs (tetap)
CREATE TABLE IF NOT EXISTS order_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  design_type TEXT NOT NULL,
  design_file TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Tabel stock (baru: tambah min_quantity)
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product, color, size)
);

-- Tabel stock_history (tetap)
CREATE TABLE IF NOT EXISTS stock_history (
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
CREATE INDEX IF NOT EXISTS idx_stock_product_color_size ON stock(product, color, size);
CREATE INDEX IF NOT EXISTS idx_stock_history_order_id ON stock_history(order_id);

-- Data stok awal
INSERT OR IGNORE INTO stock (product, color, size, quantity, min_quantity) VALUES 
  ('Kaos A', 'X', 'F', 15, 5),
  ('Kaos A', 'Y', 'V', 30, 5),
  ('Hoodie A', 'Z', 'G', 40, 10);