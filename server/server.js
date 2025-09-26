import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hotel_reservation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_postgres_password', // Use your actual password here
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// Helper function to extract floor and room number from room number string
const parseRoomNumber = (roomNumber) => {
  // Handle Floor 10 (1001-1007) specifically
  if (roomNumber.startsWith('10')) {
    return { floor: 10, roomOnFloor: parseInt(roomNumber.slice(2)) };
  }
  // Handle Floors 1-9 (101-910)
  const floor = parseInt(roomNumber.charAt(0));
  const roomOnFloor = parseInt(roomNumber.slice(1));
  return { floor, roomOnFloor };
};

// Corrected function to calculate travel time between FIRST and LAST booked rooms
const calculateTravelTimeBetweenFirstAndLast = (roomNumbers) => {
  if (roomNumbers.length <= 1) return 0;

  // Sort room numbers numerically to find first and last
  const sortedNumbers = [...roomNumbers].sort((a, b) => parseInt(a) - parseInt(b));
  const firstRoom = sortedNumbers[0];
  const lastRoom = sortedNumbers[sortedNumbers.length - 1];

  const firstParsed = parseRoomNumber(firstRoom);
  const lastParsed = parseRoomNumber(lastRoom);

  // Calculate vertical travel time
  const verticalTravel = Math.abs(lastParsed.floor - firstParsed.floor) * 2;

  // Calculate horizontal travel time
  // If they are on the same floor, it's the difference in room numbers on that floor
  let horizontalTravel = 0;
  if (firstParsed.floor === lastParsed.floor) {
      horizontalTravel = Math.abs(lastParsed.roomOnFloor - firstParsed.roomOnFloor);
  }

  return verticalTravel + horizontalTravel;
};

// Helper function to get available rooms
const getAvailableRooms = async () => {
  const query = 'SELECT * FROM rooms WHERE is_booked = FALSE ORDER BY floor, room_number';
  const result = await pool.query(query);
  return result.rows;
};

// Corrected function to find optimal room assignment based on FIRST-LAST rule
const findOptimalRooms = (availableRooms, numRooms) => {
  if (numRooms > 5) {
    throw new Error('Cannot book more than 5 rooms at a time');
  }

  if (availableRooms.length < numRooms) {
    throw new Error('Not enough available rooms');
  }

  // Group rooms by floor
  const roomsByFloor = {};
  availableRooms.forEach(room => {
    if (!roomsByFloor[room.floor]) {
      roomsByFloor[room.floor] = [];
    }
    roomsByFloor[room.floor].push(room);
  });

  // 1. Try to find enough rooms on the same floor (Priority Rule 2)
  for (const floorNum in roomsByFloor) {
    const floorRooms = roomsByFloor[floorNum];
    if (floorRooms.length >= numRooms) {
      // For same floor, pick the first 'numRooms' rooms numerically to minimize intra-floor travel
      const selected = floorRooms.slice(0, numRooms);
      return selected;
    }
  }

  // 2. If no single floor has enough, find combination minimizing travel time between first and last booked
  // Heuristic: Pick rooms from the lowest possible floors and numerically closest rooms first.
  const allAvailableSorted = [...availableRooms].sort((a, b) => {
      const parseA = parseRoomNumber(a.room_number);
      const parseB = parseRoomNumber(b.room_number);
      if (parseA.floor !== parseB.floor) {
          return parseA.floor - parseB.floor;
      }
      return parseA.roomOnFloor - parseB.roomOnFloor;
  });

  if (allAvailableSorted.length >= numRooms) {
      const selected = allAvailableSorted.slice(0, numRooms);
      return selected;
  }

  // Fallback (should not happen if initial check passes)
  throw new Error('Not enough available rooms after grouping.');
};

// API Routes

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const query = 'SELECT * FROM rooms ORDER BY floor, room_number';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get available rooms
app.get('/api/available-rooms', async (req, res) => {
  try {
    const availableRooms = await getAvailableRooms();
    res.json(availableRooms);
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Book rooms
app.post('/api/book', async (req, res) => {
  try {
    const { numRooms, guestId } = req.body;

    if (!numRooms || numRooms < 1 || numRooms > 5) {
      return res.status(400).json({ error: 'Number of rooms must be between 1 and 5' });
    }

    if (!guestId) {
      return res.status(400).json({ error: 'Guest ID is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const availableRooms = await getAvailableRooms(); // Fetch within transaction

      if (availableRooms.length < numRooms) {
        return res.status(400).json({ error: 'Not enough available rooms' });
      }

      // Find optimal rooms
      const selectedRooms = findOptimalRooms(availableRooms, numRooms);
      const selectedRoomNumbers = selectedRooms.map(r => r.room_number);

      // Calculate total travel time between first and last booked room
      const totalTravelTime = calculateTravelTimeBetweenFirstAndLast(selectedRoomNumbers);

      // Mark rooms as booked
      const updateQuery = `
        UPDATE rooms
        SET is_booked = TRUE
        WHERE room_number = ANY($1)
      `;
      await client.query(updateQuery, [selectedRoomNumbers]);

      const bookingQuery = `
        INSERT INTO bookings (guest_id, room_numbers, total_travel_time)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const bookingResult = await client.query(bookingQuery, [guestId, selectedRoomNumbers, totalTravelTime]);

      await client.query('COMMIT');

      res.json({
        success: true,
        booking: bookingResult.rows[0],
        selectedRooms: selectedRooms,
        totalTravelTime: totalTravelTime
      });
    } catch (txError) {
        await client.query('ROLLBACK');
        console.error('Transaction failed:', txError);
        throw txError; 
    } finally {
        client.release();
    }
  } catch (error) {
    console.error('Error during booking:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});


// Generate random occupancy
app.post('/api/random-occupancy', async (req, res) => {
  try {
    // Get all rooms
    const allRoomsQuery = 'SELECT * FROM rooms';
    const allRoomsResult = await pool.query(allRoomsQuery);
    const allRooms = allRoomsResult.rows;

    // Randomly mark some rooms as booked (e.g., 30%)
    const roomsToBook = [];
    allRooms.forEach(room => {
      if (Math.random() < 0.3) { 
        roomsToBook.push(room.room_number);
      }
    });

    if (roomsToBook.length > 0) {
      const updateQuery = `
        UPDATE rooms
        SET is_booked = TRUE
        WHERE room_number = ANY($1)
      `;
      await pool.query(updateQuery, [roomsToBook]);
    }

    res.json({
      success: true,
      message: `Marked ${roomsToBook.length} rooms as booked`,
      roomsBooked: roomsToBook
    });
  } catch (error) {
    console.error('Error generating random occupancy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Reset all bookings
app.post('/api/reset', async (req, res) => {
  try {
    // Reset all rooms to unbooked
    const resetQuery = 'UPDATE rooms SET is_booked = FALSE';
    await pool.query(resetQuery);

    const clearBookingsQuery = 'DELETE FROM bookings';
    await pool.query(clearBookingsQuery);

    res.json({
      success: true,
      message: 'All bookings reset successfully'
    });
  } catch (error) {
    console.error('Error resetting bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;