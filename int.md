# Hotel Room Reservation System - Interview Preparation Guide

This guide covers essential concepts, potential interview questions, and their detailed answers related to the Hotel Room Reservation System project. It's designed to help you understand the project deeply and prepare for technical interviews.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Core Concepts](#core-concepts)
3.  [Technical Architecture](#technical-architecture)
4.  [Key Algorithms & Logic](#key-algorithms--logic)
5.  [Database Design](#database-design)
6.  [API Design](#api-design)
7.  [Frontend Implementation](#frontend-implementation)
8.  [Common Problems & Solutions](#common-problems--solutions)
9.  [Interview Questions & Answers](#interview-questions--answers)
10. [Enhancement Ideas](#enhancement-ideas)

---

## Project Overview

The Hotel Room Reservation System is a full-stack web application designed to manage and book hotel rooms intelligently based on proximity and availability rules. It consists of a React frontend for user interaction and visualization, a Node.js/Express backend for business logic and API handling, and a PostgreSQL database for persistent data storage.

### Key Features

*   **Intelligent Booking:** Prioritizes booking rooms on the same floor. If not possible, minimizes travel time between the first and last booked rooms.
*   **Visualization:** Displays a visual grid of the hotel layout, showing room availability (green) and bookings (red).
*   **Booking Management:** Allows booking up to 5 rooms, resetting all bookings, and generating random occupancy for testing.
*   **Travel Time Calculation:** Dynamically calculates travel time based on horizontal (1 min/room) and vertical (2 min/floor) movement.

---

## Core Concepts

### 1. Room Numbering System

The hotel uses a logical numbering system:
*   **Floors 1-9:** Rooms are numbered as `FloorNumber` followed by a two-digit room number (e.g., Floor 1: 101-110).
*   **Floor 10:** Rooms are numbered as `100` followed by a single-digit room number (e.g., Floor 10: 1001-1007).
*   **Purpose:** This system allows easy identification of the floor and relative position of a room within that floor.

### 2. Travel Time Calculation

Travel time is calculated using two components:
*   **Horizontal Travel:** Moving between adjacent rooms on the *same* floor takes 1 minute per room. For example, moving from room 101 to 105 on Floor 1 takes 4 minutes.
*   **Vertical Travel:** Moving between *different* floors takes 2 minutes per floor. For example, moving from Floor 1 to Floor 3 takes 4 minutes.
*   **Formula:** `Total_Travel_Time = Vertical_Time + Horizontal_Time`
    *   `Vertical_Time = |Floor_Number_Last_Room - Floor_Number_First_Room| * 2`
    *   `Horizontal_Time = |Room_Number_Last_Room - Room_Number_First_Room| * 1` (only if both rooms are on the same floor)
*   **Application:** The system calculates the travel time between the *first* and *last* room in the *set* of rooms selected for a booking (based on numerical order of room numbers) to determine the optimal assignment.

### 3. Booking Rules

The system follows these prioritized rules for assigning rooms:
1.  **Maximum Rooms:** A single guest can book up to 5 rooms at a time.
2.  **Same Floor Priority:** It first attempts to find all requested rooms on a single floor.
3.  **Minimize First-Last Travel Time:** If rooms are not available on one floor, it selects a set of rooms that minimizes the total travel time between the first and last room in the booking.
4.  **Span Floors:** If required, the booking can span across multiple floors, still prioritizing the minimization of the combined vertical and horizontal travel time between the first and last booked rooms.

---

## Technical Architecture

### MERN Stack

*   **Frontend (Client-Side):**
    *   **React.js:** A JavaScript library for building user interfaces. It manages the state of the application (e.g., room availability, number of rooms to book) and renders the UI components (e.g., room grid, buttons).
    *   **Vite:** A modern build tool that provides a faster and leaner development experience for modern web projects.
    *   **Tailwind CSS:** A utility-first CSS framework for rapidly building custom user interfaces directly in the component markup.
    *   **Axios:** A promise-based HTTP client for making API requests from the frontend to the backend.
*   **Backend (Server-Side):**
    *   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine, allowing JavaScript to run outside the browser.
    *   **Express.js:** A fast, unopinionated, minimalist web framework for Node.js, used to create the API endpoints and handle routing.
*   **Database:**
    *   **PostgreSQL:** A powerful, open-source object-relational database system. It stores information about rooms and bookings.

### Communication Flow

1.  The frontend (React app) sends HTTP requests (e.g., GET, POST) to specific endpoints on the backend (Express server) using Axios.
2.  The backend receives the request, processes the logic (e.g., booking algorithm, database queries), and sends back an HTTP response (e.g., success, error, data).
3.  The frontend receives the response and updates the UI accordingly.

---

## Key Algorithms & Logic

### 1. Room Selection Algorithm (`findOptimalRooms`)

This is the core logic for selecting rooms based on the booking rules.

1.  **Input Validation:** Check if the requested number of rooms is between 1 and 5.
2.  **Fetch Available Rooms:** Query the database for rooms where `is_booked = FALSE`.
3.  **Same Floor Check:**
    *   Group the available rooms by their `floor`.
    *   Iterate through the groups. If any group (floor) has `>=` the number of requested rooms, select the first N rooms from that floor (sorted numerically). This satisfies Rule 2 (Same Floor Priority).
4.  **Travel Time Optimization (Fallback):**
    *   If no single floor has enough rooms, implement a heuristic or algorithm to find the best combination across floors.
    *   A simple heuristic (used in the example) is to sort all available rooms by `floor` and then by `room_number` and pick the first N rooms. This tends to minimize the first-to-last travel time.
    *   A more complex algorithm might generate all possible combinations of N rooms and calculate the travel time for each, selecting the combination with the minimum time (though this is computationally expensive).
5.  **Return Selected Rooms:** Return the array of room objects selected for the booking.

### 2. Travel Time Calculation (`calculateTravelTimeBetweenFirstAndLast`)

1.  **Input:** An array of room numbers selected for the booking.
2.  **Sort:** Sort the room numbers numerically to identify the "first" and "last" rooms in the booking set.
3.  **Extract Floor/Room:** Parse the floor number and room number on the floor for both the first and last rooms.
4.  **Calculate Vertical Time:** `|floor_last - floor_first| * 2`.
5.  **Calculate Horizontal Time:** If `floor_first === floor_last`, then `|room_number_last - room_number_first|`. Otherwise, it's 0.
6.  **Sum:** Return `vertical_time + horizontal_time`.

### 3. Concurrency Handling (Race Condition Prevention)

When multiple users try to book the same room simultaneously, a race condition can occur, leading to double-booking. This is prevented using **database transactions** with **row-level locking**.

1.  **Start Transaction:** `BEGIN`
2.  **Lock Available Rooms:** Execute `SELECT * FROM rooms WHERE is_booked = FALSE FOR UPDATE;`. This locks the rows for available rooms, preventing other transactions from modifying them until the current transaction commits or rolls back.
3.  **Execute Booking Logic:** Run the `findOptimalRooms` algorithm using the locked data.
4.  **Update Database:** Mark the selected rooms as booked (`UPDATE rooms SET is_booked = TRUE WHERE room_number IN (...)`) and insert the booking record (`INSERT INTO bookings ...`).
5.  **Commit:** `COMMIT` to apply all changes permanently and release the locks. If any error occurs, `ROLLBACK` to undo the changes and release locks.

---

## Database Design

### Schema

#### `rooms` table

*   `id` (SERIAL, Primary Key): A unique auto-incrementing identifier for each room.
*   `room_number` (VARCHAR(10), UNIQUE): The unique room number string (e.g., '101', '1005').
*   `floor` (INTEGER): The floor number the room is on (1-10).
*   `is_booked` (BOOLEAN, Default FALSE): A flag indicating if the room is currently booked.
*   `created_at` (TIMESTAMP, Default CURRENT_TIMESTAMP): The time the room record was created.

#### `bookings` table

*   `id` (SERIAL, Primary Key): A unique auto-incrementing identifier for each booking.
*   `guest_id` (VARCHAR(50)): An identifier for the guest who made the booking.
*   `room_numbers` (TEXT[]): An array of text strings representing the room numbers booked (e.g., {'101', '102', '103'}).
*   `total_travel_time` (INTEGER, Default 0): The calculated travel time between the first and last booked room.
*   `booked_at` (TIMESTAMP, Default CURRENT_TIMESTAMP): The time the booking was made.

### Indexes

*   `CREATE INDEX idx_rooms_floor ON rooms (floor);` - For faster queries grouped by floor.
*   `CREATE INDEX idx_rooms_booked ON rooms (is_booked);` - For faster queries finding available/occupied rooms.
*   `CREATE INDEX idx_rooms_number ON rooms (room_number);` - For faster lookups by room number.

---

## API Design

The backend provides a RESTful API.

### Endpoints

*   `GET /api/rooms`: Fetches all rooms with their current booking status.
    *   **Response:** `200 OK` with an array of room objects.
*   `GET /api/available-rooms`: Fetches only the rooms that are currently available (`is_booked = FALSE`).
    *   **Response:** `200 OK` with an array of available room objects.
*   `POST /api/book`: Processes a booking request.
    *   **Request Body:** `{ "numRooms": 3, "guestId": "user123" }`
    *   **Response:** `200 OK` with booking details on success, `400 Bad Request` for invalid input, `500 Internal Server Error` for server issues.
*   `POST /api/random-occupancy`: Generates random occupancy for testing.
    *   **Response:** `200 OK` with a success message.
*   `POST /api/reset`: Resets all bookings and marks all rooms as available.
    *   **Response:** `200 OK` with a success message.

---

## Frontend Implementation

### Components

*   `App.jsx`: The main component managing the overall state (rooms, booking results, loading, errors) and rendering other components.
*   `LandingPage.jsx`: (If included) Displays the initial landing page with information and a link to the booking page.
*   `BookingPage.jsx`: (If included) Contains the booking interface logic and rendering. If no routing, this logic is in `App.jsx`.
*   `Room.jsx`: (Optional, for more complex UIs) Represents an individual room tile.
*   `Floor.jsx`: (Optional, for more complex UIs) Represents a row of rooms for a specific floor.

### State Management

*   Uses React's `useState` and `useEffect` hooks to manage component state (e.g., `rooms`, `numRooms`, `loading`, `error`, `showLanding`) and side effects (e.g., fetching data on component mount).

### API Interaction

*   Uses the `axios` library to make HTTP requests to the backend API endpoints.
*   Handles loading states and errors gracefully.

### Styling

*   Uses `Tailwind CSS` classes directly within JSX for styling.
*   Includes custom CSS in `index.css` for specific elements like the theme toggle and room tiles.

---

## Common Problems & Solutions

### 1. Race Condition (Double-Booking)

*   **Problem:** Multiple requests trying to book the same room simultaneously.
*   **Solution:** Use database transactions with row-level locking (`SELECT ... FOR UPDATE`) during the booking process.

### 2. Performance with Large Datasets

*   **Problem:** Slow response times as the number of rooms or concurrent users increases.
*   **Solutions:**
    *   Optimize database queries with indexes.
    *   Implement caching (e.g., Redis) for frequently accessed data like room availability.
    *   Use more efficient algorithms for room selection if the simple heuristic becomes too slow.
    *   Consider database read replicas for read-heavy operations.

### 3. Ensuring Correct Travel Time Calculation

*   **Problem:** Misinterpreting the rule "minimize the total travel time between the first and last room in the booking."
*   **Solution:** Correctly identify the "first" and "last" rooms by sorting the *selected* room numbers numerically before calculating travel time.

### 4. Handling Edge Cases

*   **Problem:** What happens if a user requests more rooms than available, or 0 rooms, or a negative number?
*   **Solution:** Implement robust input validation on both the frontend and backend to handle invalid requests gracefully.

---

## Interview Questions & Answers

### Q: How does the room selection algorithm work?

**A:** The algorithm follows the booking rules:
1.  It first checks if the requested number of rooms is valid (1-5).
2.  It fetches all currently available rooms from the database.
3.  It groups these available rooms by floor.
4.  It iterates through the floors. If any floor has enough available rooms to fulfill the request, it selects the first N rooms from that floor (sorted numerically) to satisfy the "same floor first" rule.
5.  If no single floor has enough rooms, it uses a heuristic (e.g., picking the lowest-numbered available rooms across all floors) to find a combination that minimizes the travel time between the first and last booked rooms in the set. This is often achieved by sorting all available rooms by floor and then by room number and selecting the first N.

### Q: How do you prevent race conditions during booking?

**A:** Race conditions are prevented using database transactions with row-level locking. When a booking request is processed:
1.  A transaction is started (`BEGIN`).
2.  The query to fetch available rooms includes `FOR UPDATE`, which locks the rows representing those rooms. Other concurrent transactions trying to access these same locked rooms will wait.
3.  The room selection and database update (marking rooms as booked) happen within this same transaction.
4.  The transaction is committed (`COMMIT`), applying the changes and releasing the locks. If an error occurs, the transaction is rolled back (`ROLLBACK`), undoing any changes made within it. This ensures that only one booking request can modify the status of a specific set of rooms at a time.

### Q: Explain the travel time calculation logic.

**A:** Travel time is calculated between the numerically *first* and *last* room numbers in the set of rooms selected for a booking.
1.  The selected room numbers are sorted numerically.
2.  The floor and room number on that floor are extracted for the first and last rooms.
3.  **Vertical Time:** `|floor_last - floor_first| * 2 minutes`.
4.  **Horizontal Time:** If `floor_first` equals `floor_last`, then `|room_number_last - room_number_first| * 1 minute`. Otherwise, the horizontal time component between floors is 0.
5.  The total travel time is the sum of the vertical and horizontal times.

### Q: What are the advantages of using React for the frontend?

**A:** React offers several advantages:
*   **Component-Based:** Allows building UIs from reusable, encapsulated components (e.g., Room, Floor).
*   **Virtual DOM:** Efficiently updates the actual DOM, leading to better performance.
*   **State Management:** Hooks like `useState` and `useEffect` provide ways to manage component state and side effects.
*   **Ecosystem:** A large community and rich ecosystem of libraries and tools.

### Q: Why was PostgreSQL chosen for the database?

**A:** PostgreSQL was chosen because:
*   It's a powerful, open-source relational database.
*   It's ACID compliant, ensuring data integrity.
*   It handles complex queries efficiently.
*   It supports advanced data types like arrays (`TEXT[]` for `room_numbers`).
*   It's widely used and well-documented.

### Q: How would you scale this application for a larger hotel chain?

**A:** Scaling strategies might include:
*   **Database:** Use connection pooling, read replicas, sharding, or consider managed database services (e.g., AWS RDS).
*   **Backend:** Implement caching (Redis), use a message queue for background tasks (e.g., complex booking calculations), scale the Node.js application using containers (Docker) and orchestration (Kubernetes), or break it into microservices.
*   **Frontend:** Optimize bundle size, use a CDN for static assets, implement pagination for large datasets.
*   **Architecture:** Consider a microservices architecture to scale different parts of the application independently.

### Q: What are some potential enhancements for this system?

**A:** Potential enhancements include:
*   **User Authentication & Authorization:** Secure access and link bookings to user accounts.
*   **Real-time Updates:** Use WebSockets to show live room availability changes to all users.
*   **Advanced Booking Features:** Support for specific room types, dates, pricing, group bookings, cancellations.
*   **Payment Integration:** Process payments for bookings.
*   **Reporting & Analytics:** Track occupancy rates, popular room types, etc.
*   **Mobile App:** Develop a native mobile application.

---

## Enhancement Ideas

### Backend

*   **Advanced Optimization:** Implement more complex algorithms (e.g., genetic algorithms) for better travel time optimization.
*   **Caching:** Cache room availability data using Redis.
*   **API Versioning:** Prepare for future API changes.
*   **Monitoring & Logging:** Add comprehensive logging and monitoring.

### Frontend

*   **Real-time Updates:** Use Socket.io for live UI updates.
*   **Booking History:** Allow users to view past bookings.
*   **Advanced Filtering:** Filter rooms by type, amenities, etc.
*   **Improved Visualization:** Use SVG/D3.js for a more detailed hotel map.

### General

*   **Microservices:** Break the application into smaller services.
*   **Containerization:** Use Docker for easier deployment.
*   **CI/CD:** Automate testing and deployment.
*   **Security:** Implement authentication, authorization, input validation, HTTPS.
