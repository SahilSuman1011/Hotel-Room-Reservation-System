-- Create database (if not exists, you might need to connect to default db first)
-- CREATE DATABASE hotel_reservation;

-- Connect to database (assuming it's created)
-- \c hotel_reservation;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;

-- Create rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    floor INTEGER NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial room data based on problem statement
-- Floors 1-9: 10 rooms each (101-110, 201-210, ..., 901-910)
INSERT INTO rooms (room_number, floor, is_booked)
SELECT
    floor_num::TEXT || LPAD(room_num::TEXT, 2, '0') AS room_number,
    floor_num AS floor,
    FALSE AS is_booked
FROM
    generate_series(1, 9) AS floor_num,
    generate_series(1, 10) AS room_num;

-- Floor 10: 7 rooms (1001-1007)
INSERT INTO rooms (room_number, floor, is_booked)
SELECT
    '100' || room_num::TEXT AS room_number,
    10 AS floor,
    FALSE AS is_booked
FROM
    generate_series(1, 7) AS room_num;

-- Create bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    guest_id VARCHAR(50) NOT NULL,
    room_numbers TEXT[] NOT NULL, -- Store as array of text
    total_travel_time INTEGER DEFAULT 0,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add indexes for performance
CREATE INDEX idx_rooms_floor ON rooms (floor);
CREATE INDEX idx_rooms_booked ON rooms (is_booked);
CREATE INDEX idx_rooms_number ON rooms (room_number);