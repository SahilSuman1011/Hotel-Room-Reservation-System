# Hotel Room Reservation System

This is a full-stack web application designed to manage and book hotel rooms intelligently based on proximity and availability rules. It prioritizes booking rooms on the same floor and minimizes travel time between booked rooms when spanning floors.

## Features

*   **Intelligent Room Booking:** Books up to 5 rooms per guest based on specified rules.
*   **Optimization Logic:** Prioritizes same-floor bookings and minimizes travel time between the first and last booked room.
*   **Real-time Visualization:** Displays a grid layout of the hotel showing available (green) and booked (red) rooms.
*   **Management Controls:**
    *   **Book:** Enter number of rooms and book them.
    *   **Reset:** Clear all bookings and mark all rooms as available.
    *   **Random Occupancy:** Generate random bookings for testing.
*   **Responsive UI:** Modern, dark/light mode toggle, and intuitive interface.
*   **Travel Time Calculation:** Dynamically calculates and displays the total travel time for the booked set.

## Tech Stack

*   **Frontend:**
    *   **Framework:** [React.js](https://reactjs.org/)
    *   **Build Tool:** [Vite](https://vitejs.dev/)
    *   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    *   **API Client:** [Axios](https://axios-http.com/)
    *   **Icons:** [MUI Icons](https://mui.com/material-ui/material-icons/)
    *   **Notifications:** [React Toastify](https://www.npmjs.com/package/react-toastify)
*   **Backend:**
    *   **Runtime:** [Node.js](https://nodejs.org/)
    *   **Framework:** [Express.js](https://expressjs.com/)
*   **Database:**
    *   **System:** [PostgreSQL](https://www.postgresql.org/)

## Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   [PostgreSQL](https://www.postgresql.org/) (running locally or accessible via host/port)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hotel-reservation-system.git
cd hotel-reservation-system
```

### 2. Setup Backend

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory and configure your database connection:
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=hotel_reservation
    DB_USER=your_postgres_username
    DB_PASSWORD=your_postgres_password
    ```
4.  Ensure your PostgreSQL server is running.
5.  Create the database and tables:
    *   Connect to your PostgreSQL instance (using `psql` or a GUI like pgAdmin).
    *   Create a database named `hotel_reservation`.
    *   Execute the contents of the `schema.sql` file located in the `server` directory *within* the `hotel_reservation` database context. Example using `psql`:
        ```bash
        psql -U your_postgres_username -d hotel_reservation -f /path/to/your/schema.sql
        ```
        Or paste the SQL commands from `schema.sql` directly into your SQL client connected to the `hotel_reservation` database.
6.  Start the backend server:
    ```bash
    npm run dev # Uses nodemon for development
    # OR
    npm start # Standard start
    ```
    The backend server should now be running on `http://localhost:5000`.

### 3. Setup Frontend

1.  Open a *new* terminal window/tab and navigate to the `client` directory:
    ```bash
    cd client # Assuming you are in the project root
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `client` directory (optional if backend is on `http://localhost:5000`):
    ```env
    VITE_API_BASE_URL=http://localhost:5000 # Point to your backend server
    ```
4.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend should now be running on `http://localhost:5173` and automatically open in your browser.

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`. You should see the Hotel Room Reservation System interface.

## Project Structure

```
hotel-reservation-system/
├── client/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js/Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── schema.sql
│   └── package.json
├── README.md
└── INTERVIEW_PREP.md
```

## API Endpoints

The backend provides the following RESTful API endpoints:

*   `GET /api/rooms`: Get all rooms with their status.
*   `GET /api/available-rooms`: Get only available rooms.
*   `POST /api/book`: Book rooms. Expects `{ "numRooms": N, "guestId": "..." }` in the request body.
*   `POST /api/random-occupancy`: Generate random occupancy.
*   `POST /api/reset`: Reset all bookings.

## Environment Variables

### Backend (`server/.env`)

*   `PORT`: Port for the backend server (default: 5000).
*   `DB_HOST`: PostgreSQL host (default: localhost).
*   `DB_PORT`: PostgreSQL port (default: 5432).
*   `DB_NAME`: PostgreSQL database name.
*   `DB_USER`: PostgreSQL username.
*   `DB_PASSWORD`: PostgreSQL password.

### Frontend (`client/.env`)

*   `VITE_API_BASE_URL`: Base URL for the backend API (default: http://localhost:5000).

## Key Logic

### Booking Rules

1.  A single guest can book up to 5 rooms at a time.
2.  Priority is given to booking rooms on the same floor first.
3.  If rooms are not available on the same floor, priority is to book rooms that minimize the total travel time between the first and last room in the booking.
4.  Travel time is calculated as:
    *   1 minute per room horizontally (on the same floor).
    *   2 minutes per floor vertically (between floors).

### Travel Time Calculation

The travel time is calculated between the numerically *first* and *last* room numbers in the set of selected rooms for a booking:
*   `Total_Time = Vertical_Time + Horizontal_Time`
*   `Vertical_Time = |Floor_Last_Room - Floor_First_Room| * 2`
*   `Horizontal_Time = |Room_Number_Last_Room - Room_Number_First_Room| * 1` (only if both rooms are on the same floor)

### Concurrency Handling

To prevent double-booking, the backend uses database transactions with row-level locking (`SELECT ... FOR UPDATE`) during the booking process, ensuring atomicity and consistency.

## Usage

1.  Enter the number of rooms you want to book (1-5) in the input field.
2.  Click the "Book" button.
3.  View the hotel layout to see the booked rooms highlighted in red.
4.  Use the "Reset" button to clear all bookings.
5.  Use the "Random Occupancy" button to simulate random bookings for testing.
6.  Toggle the dark/light mode using the button in the top-right corner.

## License

This project is licensed under the MIT License.
```

These files provide comprehensive documentation and interview preparation material for your project.