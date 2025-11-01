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

  // menu items table
  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price REAL NOT NULL,
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    booking_id INTEGER,
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  )`);

  // feedback table
  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    student_name TEXT,
    feedback_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // complaints table
  db.run(`CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    student_name TEXT,
    complaint_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    resolution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    student_name TEXT,
    attendance_date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, attendance_date, meal_type)
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

      // Normalize roles for existing rows that may have NULL due to prior migrations
      db.run("UPDATE users SET role='user' WHERE role IS NULL", (e3) => {
        if (e3) console.error('Normalize NULL roles error:', e3);
      });
      // Ensure the built-in admin account has the correct 'admin' role
      db.run("UPDATE users SET role='admin' WHERE lower(username)='admin' OR lower(email)='admin@example.com'", (e4) => {
        if (e4) console.error('Ensure admin role error:', e4);
      });

      // Seed menu items if empty
      db.get('SELECT COUNT(*) as cnt FROM menu_items', (err, row) => {
        if (err) {
          console.error('Menu items count error:', err);
          return;
        }
        if (row && row.cnt === 0) {
          const menuItems = [
            { meal_type: 'breakfast', title: 'Poha', description: 'Traditional flattened rice with spices', image_url: 'https://images.unsplash.com/photo-1589301760014-ad5c127e0f06?w=400', price: 40 },
            { meal_type: 'breakfast', title: 'Idli Sambar', description: 'Steamed rice cakes with lentil curry', image_url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', price: 50 },
            { meal_type: 'breakfast', title: 'Paratha with Curd', description: 'Stuffed flatbread with yogurt', image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab004?w=400', price: 45 },
            { meal_type: 'lunch', title: 'Dal Rice Combo', description: 'Lentil curry with steamed rice and roti', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', price: 80 },
            { meal_type: 'lunch', title: 'Paneer Curry', description: 'Cottage cheese in rich gravy with rice', image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', price: 100 },
            { meal_type: 'lunch', title: 'Veg Thali', description: 'Complete meal with dal, sabzi, roti, rice', image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', price: 90 },
            { meal_type: 'dinner', title: 'Veg Biryani', description: 'Aromatic rice with mixed vegetables', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', price: 90 },
            { meal_type: 'dinner', title: 'Chole Bhature', description: 'Spicy chickpeas with fried bread', image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400', price: 85 },
            { meal_type: 'dinner', title: 'Rajma Chawal', description: 'Kidney beans curry with rice', image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', price: 70 }
          ];
          
          const stmt = db.prepare('INSERT INTO menu_items (meal_type, title, description, image_url, price) VALUES (?, ?, ?, ?, ?)');
          menuItems.forEach(item => {
            stmt.run([item.meal_type, item.title, item.description, item.image_url, item.price], (e) => {
              if (e) console.error('Seed menu item error:', e);
            });
          });
          stmt.finalize(() => {
            console.log('Seeded menu items successfully');
          });
        }
      });
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

// Who am I - returns the currently authenticated user from JWT cookie
app.get('/_me', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ authenticated: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true, user: decoded });
  } catch (e) {
    return res.status(401).json({ authenticated: false });
  }
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

// ========== MENU ITEMS API ==========

// Get all menu items
app.get('/api/menu-items', (req, res) => {
  const meal_type = req.query.meal_type;
  let sql = 'SELECT * FROM menu_items WHERE 1=1';
  const params = [];
  
  if (meal_type) {
    sql += ' AND meal_type = ?';
    params.push(meal_type);
  }
  
  sql += ' ORDER BY meal_type, id';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Get menu items error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    res.json({ success: true, items: rows });
  });
});

// Get single menu item
app.get('/api/menu-items/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Get menu item error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: 'not_found' });
    }
    res.json({ success: true, item: row });
  });
});

// Create new menu item (admin only)
app.post('/api/menu-items', (req, res) => {
  // Simple auth check
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  
  const { meal_type, title, description, image_url, price, available } = req.body;
  
  if (!meal_type || !title || price === undefined) {
    return res.status(400).json({ success: false, error: 'missing_fields' });
  }
  
  const stmt = db.prepare('INSERT INTO menu_items (meal_type, title, description, image_url, price, available) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run([meal_type, title, description || '', image_url || '', price, available !== undefined ? available : 1], function(err) {
    if (err) {
      console.error('Create menu item error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

// Update menu item (admin only)
app.put('/api/menu-items/:id', (req, res) => {
  // Simple auth check
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  
  const id = req.params.id;
  const { meal_type, title, description, image_url, price, available } = req.body;
  
  const updates = [];
  const params = [];
  
  if (meal_type !== undefined) {
    updates.push('meal_type = ?');
    params.push(meal_type);
  }
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (image_url !== undefined) {
    updates.push('image_url = ?');
    params.push(image_url);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    params.push(price);
  }
  if (available !== undefined) {
    updates.push('available = ?');
    params.push(available);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'no_updates' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const sql = `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Update menu item error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'not_found' });
    }
    res.json({ success: true, changes: this.changes });
  });
});

// Delete menu item (admin only)
app.delete('/api/menu-items/:id', (req, res) => {
  // Simple auth check
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  
  const id = req.params.id;
  
  db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Delete menu item error:', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'not_found' });
    }
    res.json({ success: true, changes: this.changes });
  });
});

// ========== BOOKINGS API ==========

// Get user bookings
app.get('/api/bookings', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sql = `
      SELECT b.*, u.username, u.full_name 
      FROM bookings b 
      JOIN users u ON b.user_id = u.id 
      WHERE b.user_id = ? 
      ORDER BY b.booking_date DESC, b.created_at DESC
      LIMIT 50
    `;
    
    db.all(sql, [decoded.id], (err, rows) => {
      if (err) {
        console.error('Get bookings error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, bookings: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Create a new booking (student/user)
app.post('/api/bookings', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { booking_date, meal_type, quantity, total_amount } = req.body;
    
    if (!booking_date || !meal_type || !quantity || !total_amount) {
      return res.status(400).json({ success: false, error: 'missing_fields' });
    }
    
    // Create booking
    const bookingStmt = db.prepare(`
      INSERT INTO bookings (user_id, booking_date, meal_type, quantity, total_amount, status) 
      VALUES (?, ?, ?, ?, ?, 'confirmed')
    `);
    
    bookingStmt.run([decoded.id, booking_date, meal_type, quantity, total_amount], function(bookingErr) {
      if (bookingErr) {
        console.error('Create booking error:', bookingErr);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      
      const bookingId = this.lastID;
      
      // Get user info for attendance
      db.get('SELECT username, full_name FROM users WHERE id = ?', [decoded.id], (userErr, user) => {
        if (userErr) {
          console.error('Get user error:', userErr);
        }
        
        // Automatically create attendance record
        const attendanceStmt = db.prepare(`
          INSERT OR REPLACE INTO attendance (user_id, student_name, attendance_date, meal_type, status, notes) 
          VALUES (?, ?, ?, ?, 'present', 'Auto-marked via booking')
        `);
        
        attendanceStmt.run([
          decoded.id, 
          user ? user.full_name || user.username : decoded.username, 
          booking_date, 
          meal_type
        ], function(attErr) {
          if (attErr) {
            console.error('Auto-attendance error:', attErr);
            // Don't fail the booking if attendance fails
          }
        });
        attendanceStmt.finalize();
        
        // Create transaction record
        const txStmt = db.prepare(`
          INSERT INTO transactions (user_id, booking_id, amount, transaction_type, status) 
          VALUES (?, ?, ?, 'booking', 'completed')
        `);
        
        txStmt.run([decoded.id, bookingId, total_amount], function(txErr) {
          if (txErr) {
            console.error('Transaction error:', txErr);
          }
        });
        txStmt.finalize();
        
        res.json({ 
          success: true, 
          booking_id: bookingId,
          message: 'Booking confirmed and attendance marked automatically'
        });
      });
    });
    bookingStmt.finalize();
  } catch (e) {
    console.error('Booking error:', e);
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get all bookings (admin only)
app.get('/api/admin/bookings', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const sql = `
      SELECT b.*, u.username, u.full_name 
      FROM bookings b 
      JOIN users u ON b.user_id = u.id 
      ORDER BY b.booking_date DESC, b.created_at DESC
      LIMIT 100
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Get all bookings error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, bookings: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get statistics (admin only)
app.get('/api/admin/stats', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    // Get various stats
    const stats = {};
    
    // Total students
    db.get('SELECT COUNT(*) as count FROM users WHERE role = "user"', (err, row) => {
      if (err) console.error('Stats error:', err);
      stats.students = row ? row.count : 0;
      
      // Meals served today
      db.get('SELECT SUM(quantity) as count FROM bookings WHERE date(booking_date) = date("now")', (err2, row2) => {
        if (err2) console.error('Stats error:', err2);
        stats.mealsToday = row2 ? (row2.count || 0) : 0;
        
        // Total revenue
        db.get('SELECT SUM(total_amount) as sum FROM bookings', (err3, row3) => {
          if (err3) console.error('Stats error:', err3);
          stats.revenue = row3 ? (row3.sum || 0) : 0;
          
          // Pending payments
          db.get('SELECT SUM(amount) as sum FROM transactions WHERE status = "pending"', (err4, row4) => {
            if (err4) console.error('Stats error:', err4);
            stats.pending = row4 ? (row4.sum || 0) : 0;
            
            // Meal type counts for today
            db.all('SELECT meal_type, SUM(quantity) as count FROM bookings WHERE date(booking_date) = date("now") GROUP BY meal_type', (err5, rows5) => {
              if (err5) console.error('Stats error:', err5);
              stats.mealCounts = {};
              if (rows5) {
                rows5.forEach(r => {
                  stats.mealCounts[r.meal_type] = r.count;
                });
              }
              
              res.json({ success: true, stats });
            });
          });
        });
      });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get revenue distribution by meal type (admin only) - For Pie Chart
app.get('/api/admin/revenue-distribution', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const sql = `
      SELECT 
        b.meal_type,
        SUM(b.total_amount) as revenue,
        SUM(b.quantity) as orders
      FROM bookings b
      GROUP BY b.meal_type
      ORDER BY revenue DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Revenue distribution error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      
      // If no data, return sample data for demonstration
      if (!rows || rows.length === 0) {
        rows = [
          { meal_type: 'breakfast', revenue: 2400, orders: 60 },
          { meal_type: 'lunch', revenue: 4800, orders: 60 },
          { meal_type: 'dinner', revenue: 3600, orders: 40 }
        ];
      }
      
      res.json({ success: true, distribution: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get sales trends over time (admin only) - For Line/Bar Chart
app.get('/api/admin/sales-trends', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const period = req.query.period || 'week'; // week, month, year
    
    let sql = '';
    if (period === 'week') {
      sql = `
        SELECT 
          date(booking_date) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as orders,
          SUM(quantity) as meals
        FROM bookings
        WHERE date(booking_date) >= date('now', '-7 days')
        GROUP BY date(booking_date)
        ORDER BY date(booking_date)
      `;
    } else if (period === 'month') {
      sql = `
        SELECT 
          date(booking_date) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as orders,
          SUM(quantity) as meals
        FROM bookings
        WHERE date(booking_date) >= date('now', '-30 days')
        GROUP BY date(booking_date)
        ORDER BY date(booking_date)
      `;
    } else {
      sql = `
        SELECT 
          strftime('%Y-%m', booking_date) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as orders,
          SUM(quantity) as meals
        FROM bookings
        WHERE date(booking_date) >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', booking_date)
        ORDER BY date
      `;
    }
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Sales trends error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      
      // If no data, return sample data for demonstration
      if (!rows || rows.length === 0) {
        const today = new Date();
        rows = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          rows.push({
            date: dateStr,
            revenue: 1500 + Math.random() * 1000,
            orders: 15 + Math.floor(Math.random() * 10),
            meals: 40 + Math.floor(Math.random() * 20)
          });
        }
      }
      
      res.json({ success: true, trends: rows, period });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get top selling menu items (admin only)
app.get('/api/admin/top-items', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const limit = parseInt(req.query.limit) || 5;
    
    const sql = `
      SELECT 
        m.title,
        m.meal_type,
        m.price,
        COUNT(b.id) as order_count,
        SUM(b.quantity) as total_quantity,
        SUM(b.total_amount) as total_revenue
      FROM menu_items m
      LEFT JOIN bookings b ON b.meal_type = m.meal_type
      WHERE m.available = 1
      GROUP BY m.id
      ORDER BY total_revenue DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        console.error('Top items error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      
      res.json({ success: true, items: rows || [] });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// ========== FEEDBACK API ==========

// Get all feedback (admin only)
app.get('/api/admin/feedback', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const sql = `
      SELECT f.*, u.username, u.full_name 
      FROM feedback f 
      LEFT JOIN users u ON f.user_id = u.id 
      ORDER BY f.created_at DESC
      LIMIT 100
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Get feedback error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, feedback: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get single feedback entry
app.get('/api/admin/feedback/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    const sql = `
      SELECT f.*, u.username, u.full_name 
      FROM feedback f 
      LEFT JOIN users u ON f.user_id = u.id 
      WHERE f.id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('Get feedback error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (!row) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, feedback: row });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Create new feedback (admin only - for adding on behalf of students)
app.post('/api/admin/feedback', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const { user_id, student_name, feedback_type, subject, message, rating, status } = req.body;
    
    if (!subject || !message || !feedback_type) {
      return res.status(400).json({ success: false, error: 'missing_fields' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO feedback (user_id, student_name, feedback_type, subject, message, rating, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      user_id || decoded.id, 
      student_name || '', 
      feedback_type, 
      subject, 
      message, 
      rating || null, 
      status || 'pending'
    ], function(err) {
      if (err) {
        console.error('Create feedback error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Update feedback (admin only)
app.put('/api/admin/feedback/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    const { student_name, feedback_type, subject, message, rating, status } = req.body;
    
    const updates = [];
    const params = [];
    
    if (student_name !== undefined) {
      updates.push('student_name = ?');
      params.push(student_name);
    }
    if (feedback_type !== undefined) {
      updates.push('feedback_type = ?');
      params.push(feedback_type);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      params.push(subject);
    }
    if (message !== undefined) {
      updates.push('message = ?');
      params.push(message);
    }
    if (rating !== undefined) {
      updates.push('rating = ?');
      params.push(rating);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'no_updates' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE feedback SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Update feedback error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, changes: this.changes });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Delete feedback (admin only)
app.delete('/api/admin/feedback/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    
    db.run('DELETE FROM feedback WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Delete feedback error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, changes: this.changes });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// ========== STUDENT FEEDBACK API ==========

// Submit feedback (student)
app.post('/api/feedback', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { feedback_type, subject, message, rating } = req.body;
    
    if (!subject || !message || !feedback_type) {
      return res.status(400).json({ success: false, error: 'missing_fields' });
    }
    
    // Get student name from users table
    db.get('SELECT full_name, username FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err) {
        console.error('Get user error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      
      const student_name = user ? (user.full_name || user.username) : '';
      
      const stmt = db.prepare(`
        INSERT INTO feedback (user_id, student_name, feedback_type, subject, message, rating, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        decoded.id, 
        student_name, 
        feedback_type, 
        subject, 
        message, 
        rating || null, 
        'pending'
      ], function(err) {
        if (err) {
          console.error('Create feedback error:', err);
          return res.status(500).json({ success: false, error: 'db_error' });
        }
        res.json({ success: true, id: this.lastID });
      });
      stmt.finalize();
    });
  } catch (e) {
    console.error('Auth error:', e);
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get my feedback (student - view own feedback)
app.get('/api/feedback/my', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    db.all(`
      SELECT 
        id,
        feedback_type,
        subject,
        message,
        rating,
        status,
        created_at,
        resolved_at
      FROM feedback 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [decoded.id], (err, rows) => {
      if (err) {
        console.error('Get my feedback error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, feedback: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// ========== COMPLAINTS API ==========

// Get all complaints (admin only)
app.get('/api/admin/complaints', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const sql = `
      SELECT c.*, u.username, u.full_name 
      FROM complaints c 
      LEFT JOIN users u ON c.user_id = u.id 
      ORDER BY 
        CASE c.status 
          WHEN 'open' THEN 1 
          WHEN 'in_progress' THEN 2 
          ELSE 3 
        END,
        CASE c.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          ELSE 3 
        END,
        c.created_at DESC
      LIMIT 100
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Get complaints error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, complaints: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get single complaint
app.get('/api/admin/complaints/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    const sql = `
      SELECT c.*, u.username, u.full_name 
      FROM complaints c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('Get complaint error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (!row) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, complaint: row });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Create new complaint (admin only)
app.post('/api/admin/complaints', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const { user_id, student_name, complaint_type, subject, description, priority, status } = req.body;
    
    if (!subject || !description || !complaint_type) {
      return res.status(400).json({ success: false, error: 'missing_fields' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO complaints (user_id, student_name, complaint_type, subject, description, priority, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      user_id || decoded.id, 
      student_name || '', 
      complaint_type, 
      subject, 
      description, 
      priority || 'medium', 
      status || 'open'
    ], function(err) {
      if (err) {
        console.error('Create complaint error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Update complaint (admin only)
app.put('/api/admin/complaints/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    const { student_name, complaint_type, subject, description, priority, status, resolution } = req.body;
    
    const updates = [];
    const params = [];
    
    if (student_name !== undefined) {
      updates.push('student_name = ?');
      params.push(student_name);
    }
    if (complaint_type !== undefined) {
      updates.push('complaint_type = ?');
      params.push(complaint_type);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      params.push(subject);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'resolved' || status === 'closed') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }
    }
    if (resolution !== undefined) {
      updates.push('resolution = ?');
      params.push(resolution);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'no_updates' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Update complaint error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, changes: this.changes });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Delete complaint (admin only)
app.delete('/api/admin/complaints/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    
    db.run('DELETE FROM complaints WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Delete complaint error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, changes: this.changes });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// ========== ATTENDANCE API ==========

// Get student's own attendance records
app.get('/api/attendance/my', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { start_date, end_date, meal_type } = req.query;
    let sql = `
      SELECT a.*, u.username, u.full_name 
      FROM attendance a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.user_id = ?
    `;
    const params = [decoded.id];
    
    if (start_date) {
      sql += ' AND date(a.attendance_date) >= date(?)';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date(a.attendance_date) <= date(?)';
      params.push(end_date);
    }
    if (meal_type) {
      sql += ' AND a.meal_type = ?';
      params.push(meal_type);
    }
    
    sql += ' ORDER BY a.attendance_date DESC, a.meal_type LIMIT 100';
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Get my attendance error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, attendance: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get student's attendance statistics
app.get('/api/attendance/my/stats', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const stats = {};
    
    // Total attendance records
    db.get('SELECT COUNT(*) as total FROM attendance WHERE user_id = ?', [decoded.id], (err1, row1) => {
      if (err1) console.error('Stats error:', err1);
      stats.total = row1 ? row1.total : 0;
      
      // Present count
      db.get('SELECT COUNT(*) as present FROM attendance WHERE user_id = ? AND status = "present"', [decoded.id], (err2, row2) => {
        if (err2) console.error('Stats error:', err2);
        stats.present = row2 ? row2.present : 0;
        
        // Absent count
        db.get('SELECT COUNT(*) as absent FROM attendance WHERE user_id = ? AND status = "absent"', [decoded.id], (err3, row3) => {
          if (err3) console.error('Stats error:', err3);
          stats.absent = row3 ? row3.absent : 0;
          
          // Late count
          db.get('SELECT COUNT(*) as late FROM attendance WHERE user_id = ? AND status = "late"', [decoded.id], (err4, row4) => {
            if (err4) console.error('Stats error:', err4);
            stats.late = row4 ? row4.late : 0;
            
            // Calculate percentage
            stats.percentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0;
            
            // Meal-wise breakdown
            db.all('SELECT meal_type, status, COUNT(*) as count FROM attendance WHERE user_id = ? GROUP BY meal_type, status', [decoded.id], (err5, rows5) => {
              if (err5) console.error('Stats error:', err5);
              stats.mealWise = rows5 || [];
              
              res.json({ success: true, stats });
            });
          });
        });
      });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get all attendance records (admin only)
app.get('/api/admin/attendance', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const { date, meal_type, user_id } = req.query;
    let sql = `
      SELECT a.*, u.username, u.full_name 
      FROM attendance a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (date) {
      sql += ' AND date(a.attendance_date) = date(?)';
      params.push(date);
    }
    if (meal_type) {
      sql += ' AND a.meal_type = ?';
      params.push(meal_type);
    }
    if (user_id) {
      sql += ' AND a.user_id = ?';
      params.push(user_id);
    }
    
    sql += ' ORDER BY a.attendance_date DESC, a.meal_type LIMIT 200';
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Get attendance error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, attendance: rows });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Get single attendance record
app.get('/api/admin/attendance/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    const sql = `
      SELECT a.*, u.username, u.full_name 
      FROM attendance a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('Get attendance error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (!row) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, attendance: row });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Create new attendance record (admin only)
app.post('/api/admin/attendance', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const { user_id, student_name, attendance_date, meal_type, status, notes } = req.body;
    
    if (!user_id || !attendance_date || !meal_type) {
      return res.status(400).json({ success: false, error: 'missing_fields' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO attendance (user_id, student_name, attendance_date, meal_type, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      user_id, 
      student_name || '', 
      attendance_date, 
      meal_type, 
      status || 'present', 
      notes || ''
    ], function(err) {
      if (err) {
        if (/UNIQUE constraint failed/i.test(String(err.message))) {
          return res.status(409).json({ success: false, error: 'duplicate_entry' });
        }
        console.error('Create attendance error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Update attendance record (admin only)
app.put('/api/admin/attendance/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    const { student_name, attendance_date, meal_type, status, notes } = req.body;
    
    const updates = [];
    const params = [];
    
    if (student_name !== undefined) {
      updates.push('student_name = ?');
      params.push(student_name);
    }
    if (attendance_date !== undefined) {
      updates.push('attendance_date = ?');
      params.push(attendance_date);
    }
    if (meal_type !== undefined) {
      updates.push('meal_type = ?');
      params.push(meal_type);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'no_updates' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Update attendance error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, changes: this.changes });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
});

// Delete attendance record (admin only)
app.delete('/api/admin/attendance/:id', (req, res) => {
  const token = req.cookies && req.cookies.auth;
  if (!token) return res.status(401).json({ success: false, error: 'unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    
    const id = req.params.id;
    
    db.run('DELETE FROM attendance WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Delete attendance error:', err);
        return res.status(500).json({ success: false, error: 'db_error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'not_found' });
      }
      res.json({ success: true, changes: this.changes });
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
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
