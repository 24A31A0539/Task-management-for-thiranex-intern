// server.js - Backend for Task Management Application
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('socket.io');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error('Failed to connect to SQLite DB:', err.message);
  } else {
    console.log('Connected to SQLite DB.');
  }
});

// Initialize tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Helper: generate JWT
function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

// Middleware: Authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = { id: payload.userId, email: payload.email };
    next();
  });
}

// Register
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
  stmt.run(email, hashed, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'User registration failed' });
    }
    const userId = this.lastID;
    const token = generateAccessToken({ id: userId, email });
    res.json({ token, userId });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateAccessToken(user);
    res.json({ token, userId: user.id });
  });
});

// Get tasks (protected)
app.get('/api/tasks', authenticateToken, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch tasks' });
    res.json(rows);
  });
});

// Create task
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, status, due_date } = req.body;
  const stmt = db.prepare('INSERT INTO tasks (user_id, title, description, status, due_date) VALUES (?, ?, ?, ?, ?)');
  stmt.run(req.user.id, title, description, status || 'pending', due_date, function (err) {
    if (err) return res.status(500).json({ message: 'Failed to create task' });
    const newTask = { id: this.lastID, user_id: req.user.id, title, description, status: status || 'pending', due_date };
    io.emit('tasks-updated', { userId: req.user.id, tasks: [newTask] });
    res.json(newTask);
  });
});

// Update task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, status, due_date } = req.body;
  const stmt = db.prepare(`UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?`);
  stmt.run(title, description, status, due_date, id, req.user.id, function (err) {
    if (err) return res.status(500).json({ message: 'Failed to update task' });
    if (this.changes === 0) return res.status(404).json({ message: 'Task not found' });
    io.emit('tasks-updated', { userId: req.user.id, taskId: parseInt(id) });
    res.json({ message: 'Task updated' });
  });
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
  stmt.run(id, req.user.id, function (err) {
    if (err) return res.status(500).json({ message: 'Failed to delete task' });
    if (this.changes === 0) return res.status(404).json({ message: 'Task not found' });
    io.emit('tasks-updated', { userId: req.user.id, taskId: parseInt(id), deleted: true });
    res.json({ message: 'Task deleted' });
  });
});

// Start HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
