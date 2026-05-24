CREATE DATABASE IF NOT EXISTS transport_booking;
USE transport_booking;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Transports table
CREATE TABLE transports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('bus', 'train', 'metro') NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    price_per_km DECIMAL(10,2) DEFAULT 0.00,
    features JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(10,2) NOT NULL,
    transport_type ENUM('bus', 'train', 'metro') NOT NULL,
    estimated_duration_min INT,
    UNIQUE KEY (source, destination, transport_type)
);

-- Bookings table 
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transport_id INT, 
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(10,2),
    date DATE NOT NULL,
    departure_time TIME,
    transport_mode VARCHAR(50) NOT NULL,
    seat VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

INSERT INTO transports (name, type, capacity, base_price, price_per_km, features) VALUES
('Express Bus', 'bus', 50, 2.50, 0.15, '{"wifi": true, "ac": true, "wheelchair": true}'),
('Local Train', 'train', 200, 1.80, 0.08, '{"wifi": false, "ac": false, "wheelchair": true}'),
('City Metro', 'metro', 300, 2.20, 0.10, '{"wifi": true, "ac": true, "wheelchair": true}');

INSERT INTO routes (source, destination, distance_km, transport_type, estimated_duration_min) VALUES
('Chennai', 'Coimbatore', 500, 'bus', 420),
('Chennai', 'Madurai', 450, 'train', 360),
('Chennai Central', 'Airport', 25, 'metro', 45);