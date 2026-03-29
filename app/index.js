const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize database table
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
    // Retry after 3 seconds (DB container may still be starting)
    setTimeout(initDB, 3000);
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

// Student portal – view all students
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY roll_no ASC');
    res.render('index', { students: result.rows });
  } catch (err) {
    res.status(500).send('Database error: ' + err.message);
  }
});

// Admin panel – add / delete students
app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY roll_no ASC');
    res.render('admin', { students: result.rows, message: null });
  } catch (err) {
    res.status(500).send('Database error: ' + err.message);
  }
});

// API – add a new student
app.post('/api/students', async (req, res) => {
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

// API – get all students (JSON)
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY roll_no ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API – delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check (useful for Kubernetes liveness probes)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Start ──────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
