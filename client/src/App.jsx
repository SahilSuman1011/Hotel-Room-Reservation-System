import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numRooms, setNumRooms] = useState(1);
  const [darkMode, setDarkMode] = useState(true); 

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/rooms`);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Failed to fetch rooms. Please check the backend connection.');
      toast.error('Failed to fetch rooms. Please check the backend connection.'); // Show error toast
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (numRooms < 1 || numRooms > 5) {
      setError('Number of rooms must be between 1 and 5');
      toast.error('Number of rooms must be between 1 and 5');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/book`, {
        numRooms: parseInt(numRooms),
        guestId: `guest_${Date.now()}`
      });

      toast.success(
        `Booking Successful! Rooms: ${response.data.selectedRooms.map(r => r.room_number).join(', ')}. Travel time: ${response.data.totalTravelTime} mins.`
      );

      fetchRooms();
    } catch (err) {
      console.error('Booking failed:', err);
      const errorMessage = err.response?.data?.error || 'Booking failed due to an error.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomOccupancy = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/random-occupancy`);
      toast.info('Random occupancy generated.');
      fetchRooms();
    } catch (err) {
      console.error('Random occupancy failed:', err);
      setError('Failed to generate random occupancy.');
      toast.error('Failed to generate random occupancy.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/reset`);
      toast.info('All bookings reset successfully.');
      fetchRooms(); 
    } catch (err) {
      console.error('Reset failed:', err);
      setError('Failed to reset bookings.');
      toast.error('Failed to reset bookings.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle dark/light mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Group rooms by floor for rendering
  const roomsByFloor = {};
  rooms.forEach(room => {
    if (!roomsByFloor[room.floor]) {
      roomsByFloor[room.floor] = [];
    }
    roomsByFloor[room.floor].push(room);
  });

  // Ensure all floors (1-10) are represented, even if empty
  const allFloors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  allFloors.forEach(floor => {
    if (!roomsByFloor[floor]) {
      roomsByFloor[floor] = [];
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 p-4">

      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
      >
        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </button>

      <div className="main-container">
        <div className="header">
          <h1>Hotel Room Reservation System</h1>
        </div>

        <div className="control-panel">
          <div className="input-group">
            <label htmlFor="numRooms">No of Rooms:</label>
            <input
              id="numRooms"
              type="number"
              min="1"
              max="5"
              value={numRooms}
              onChange={(e) => setNumRooms(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleBook}
            disabled={loading || numRooms < 1 || numRooms > 5}
            className="book-btn"
          >
            {loading ? 'Processing...' : 'Book'}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="reset-btn"
          >
            {loading ? 'Processing...' : 'Reset'}
          </button>

          <button
            onClick={handleRandomOccupancy}
            disabled={loading}
            className="random-btn"
          >
            {loading ? 'Processing...' : 'Random Occupancy'}
          </button>
        </div>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        <div className="hotel-layout-container">
          <h2 className="hotel-layout-title">Hotel Layout</h2>
          <div className="space-y-3">
            {allFloors.map(floor => (
              <div key={floor} className="floor-row">
             
                <div className="lift-symbol">
                  ⬇️
                </div>
           
                <div className="floor-label">{floor}</div>
              
                <div className="flex flex-wrap gap-3">
                  {roomsByFloor[floor].map(room => (
                    <div
                      key={room.id}
                      className={`room-tile ${room.is_booked ? 'booked' : 'available'}`}
                      title={`Room ${room.room_number} - ${room.is_booked ? 'Booked' : 'Available'}`}
                    >
                      {room.room_number}
                    </div>
                  ))}
                  {/* Show empty slots for floors with fewer rooms (like floor 10) */}
                  {floor === 10 && Array.from({ length: 3 }).map((_, i) => (
                    <div key={`empty-${i}`} className="room-tile" style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={5000} // Close after 5 seconds
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? "dark" : "light"}
        />
      </div>
    </div>
  );
}

export default App;