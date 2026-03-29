const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (use env vars in production)
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'studentdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'student-portal-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 },
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/login');
}

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id        SERIAL PRIMARY KEY,
        name      VARCHAR(100) NOT NULL,
        roll_no   VARCHAR(20)  UNIQUE NOT NULL,
        branch    VARCHAR(50)  NOT NULL,
        semester  INTEGER      NOT NULL,
        cgpa      NUMERIC(4,2) NOT NULL,
        email     VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('DB init error:', err.message);
    setTimeout(initDB, 3000);
  }
}

// Routes

// Student view (public)
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY roll_no ASC');
    res.render('index', { students: result.rows });
  } catch (err) {
    res.status(500).send('Database error: ' + err.message);
  }
});

// Login - GET
app.get('/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('login', { error: null });
});

// Login - POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('login', { error: 'Invalid username or password.' });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Admin panel (protected)
app.get('/admin', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY roll_no ASC');
    res.render('admin', { students: result.rows, message: null });
  } catch (err) {
    res.status(500).send('Database error: ' + err.message);
  }
});

// API - add student (protected)
app.post('/api/students', requireAuth, async (req, res) => {
  const { name, roll_no, branch, semester, cgpa, email } = req.body;
  if (!name || !roll_no || !branch || !semester || !cgpa || !email) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO students (name, roll_no, branch, semester, cgpa, email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, roll_no, branch, parseInt(semester), parseFloat(cgpa), email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Roll number already exists.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// API - get all students (public)
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY roll_no ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API - delete student (protected)
app.delete('/api/students/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
