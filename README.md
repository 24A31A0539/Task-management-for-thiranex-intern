# FocusBoard ✨ | Modern Task Management Application

FocusBoard is an industry-grade, full-stack Task Management application featuring a premium glassmorphic user interface, responsive layout, JWT-based security, and real-time task updates via WebSockets. Developed with a high-fidelity dark/light design, this project serves as a production-ready template for task and team workflow management.

## 🚀 Key Features

- **Premium Glassmorphic Design**: An interface styled with custom Google Fonts (`Outfit` and `Inter`), translucent borders, background blur, vibrant gradient highlight tones, and smooth hover micro-animations.
- **User Authentication**: Secure signup and signin routes backed by bcrypt password hashing on the server and JWT token storage on the client.
- **Task Analytics Dashboard**: Quick insight cards tracking total, pending, and completed tasks dynamically.
- **Full Task CRUD**:
  - **Create**: Add new tasks with title, description, and target due date.
  - **Read**: Live-sync feed sorted by newest first.
  - **Update**: Edit title, description, and due dates inline or toggle task completion state.
  - **Delete**: Safely remove outdated tasks.
- **Filter and Search**: Instantly query tasks by searching titles/descriptions or filtering by task state (All, Pending, Completed).
- **Overdue Visual Alerts**: Highlighted date banners indicating when a task's due date has elapsed.
- **Real-Time Synchronisation**: Uses Socket.io to keep multiple opened tabs/browsers updated simultaneously whenever a task is added, changed, or deleted.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router v6, Axios, Socket.io-Client, Vanilla CSS (Modern CSS Custom Properties/HSL system)
- **Backend**: Node.js, Express, JSON Web Tokens (jsonwebtoken), bcryptjs, SQLite3, Socket.io
- **Database**: SQLite (local single-file database `data.db` automatically initialized)

---

## 💻 Local Setup & Execution

The project is structured into two main directories: `backend` and `frontend`.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Launching the Backend Server

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up on [http://localhost:4000](http://localhost:4000) and establish/connect to the SQLite database.*

### 2. Launching the Frontend App

1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
   *The Vite dev server will spin up on [http://localhost:5173](http://localhost:5173).*

---

## 🌐 Launch URL

Once both servers are running, open your browser and navigate to:

👉 **[http://localhost:5173](http://localhost:5173)**

*All network requests and WebSocket handshakes will automatically proxy through to the server running on port `4000`.*
