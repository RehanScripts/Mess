const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// Setup DB (file: data/db.sqlite)
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(dbPath);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// create tables if not exists
db.serialize(() => {
  // login attempts (audit)
  db.run(`CREATE TABLE IF NOT EXISTS logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // application users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // Migration: add role column if missing, then seed
  const continueAfterMigration = () => {
    // Seed a default user if none exists
    db.get('SELECT COUNT(*) as cnt FROM users', (err, row) => {
      if (err) {
        console.error('Users count error:', err);
        return;
      }
      if (row && row.cnt === 0) {
        const defaultUser = {
          username: 'student',
          email: 'student@example.com',
          full_name: 'Student User',
          password_hash: bcrypt.hashSync('password123', 10)
        };
        const s = db.prepare('INSERT INTO users (username, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)');
        s.run([defaultUser.username, defaultUser.email, defaultUser.full_name, defaultUser.password_hash, 'user'], (e) => {
          if (e) console.error('Seed user insert error:', e);
          else console.log('Seeded default user: student / password123');
        });
        s.finalize();
      }
      // Always ensure an admin user exists
      const admin = {
        username: 'admin',
        email: 'admin@example.com',
        full_name: 'Administrator',
        password_hash: bcrypt.hashSync('admin123', 10),
        role: 'admin'
      };
      const a = db.prepare('INSERT OR IGNORE INTO users (username, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)');
      a.run([admin.username, admin.email, admin.full_name, admin.password_hash, admin.role], (e2) => {
        if (e2) console.error('Seed admin insert error:', e2);
        else console.log('Admin user ready: admin / admin123');
      });
      a.finalize();
    });
  };

  db.all("PRAGMA table_info(users)", (err, cols) => {
    if (!err && cols && !cols.find(c => c.name === 'role')) {
      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (e) => {
        if (e) console.error('Add role column error:', e);
        continueAfterMigration();
      });
    } else {
      continueAfterMigration();
    }
  });
});

app.use(bodyParser.json());
app.use(cookieParser());

// Auth helpers
function setAuthCookie(res, user) {
  const payload = { id: user.id, username: user.username, role: user.role || 'user' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.redirect('/index.html');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.redirect('/dashboard.html');
    req.user = decoded;
    next();
  } catch (e) {
    return res.redirect('/index.html');
  }
}

// Protect admin dashboard HTML before static handler
app.get('/admin_dashboard.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
});
// Protect admin settings page as well
app.get('/admin_settings.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_settings.html'));
});

// Sign up - create a user with hashed password
app.post('/signup', (req, res) => {
  const { email = '', password = '', fullName = '', username } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, error: 'missing_fields' });

  const uname = (username && String(username).trim()) || String(email).split('@')[0];
  const full_name = String(fullName || '').trim();
  const emailNorm = String(email).trim().toLowerCase();

  const password_hash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare('INSERT INTO users (username, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)');
  stmt.run([uname, emailNorm, full_name, password_hash, 'user'], function (err) {
    if (err) {
      if (/UNIQUE constraint failed/i.test(String(err.message))) {
        return res.status(409).json({ success: false, error: 'user_exists' });
      }
      console.error('Signup error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    res.json({ success: true, userId: this.lastID, username: uname });
  });
  stmt.finalize();
});

// Login - validate credentials against users table, still record attempt
app.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const userKey = String(username).trim();

  // Record the attempt (audit)
  db.run('INSERT INTO logins (username, password) VALUES (?, ?)', [userKey, password], function (err) {
    if (err) console.error('DB insert error (logins audit)', err);
  });

  if (!userKey || !password) return res.status(400).json({ success: false, error: 'missing_fields' });

  // Allow login with either username or email
  const sql = 'SELECT id, username, email, full_name, password_hash, role FROM users WHERE username = ? OR lower(email) = lower(?) LIMIT 1';
  db.get(sql, [userKey, userKey], (err, row) => {
    if (err) {
      console.error('Login query error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    if (!row) return res.status(401).json({ success: false, error: 'invalid_credentials' });

    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(401).json({ success: false, error: 'invalid_credentials' });

    // Set auth cookie and return user info
    const userInfo = { id: row.id, username: row.username, email: row.email, fullName: row.full_name, role: row.role || 'user' };
    setAuthCookie(res, userInfo);
    res.json({ success: true, user: userInfo });
  });
});

// Simple endpoint to view stored logins (for developer/debugging)
app.get('/_logins', (req, res) => {
  db.all('SELECT id, username, password, ts FROM logins ORDER BY id DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json(rows);
  });
});

// Debug: list users (limit fields)
app.get('/_users', (req, res) => {
  db.all('SELECT id, username, email, full_name, role, created_at FROM users ORDER BY id DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json(rows);
  });
});

// Logout clears cookie
app.post('/logout', (req, res) => {
  res.clearCookie('auth');
  res.json({ success: true });
});

// Health endpoint
app.get('/_health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Start server with fallback ports if 3000 is busy
function startServer(port, attemptsLeft = 10) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} in use. Trying ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

// Static files served after protected routes
app.use(express.static(path.join(__dirname)));

startServer(DEFAULT_PORT);
