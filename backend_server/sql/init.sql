CREATE DATABASE IF NOT EXISTS restaurant_payments;
USE restaurant_payments;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(30),
  note TEXT,
  pickup_type VARCHAR(30),
  datetime DATETIME,
  subtotal DECIMAL(10,2),
  total DECIMAL(10,2),
  stripe_payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  dish_id INT,
  dish_name VARCHAR(100),
  dish_price DECIMAL(10,2),
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS order_item_sides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT,
  side_name VARCHAR(100),
  side_price DECIMAL(10,2),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);