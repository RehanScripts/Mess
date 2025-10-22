# 🍽️ MessMate - Mess Management System

A modern, responsive web application for managing mess operations, meal bookings, and student services.

## ✅ Current Status: FULLY WORKING

## 🚀 Quick Start

### Option 1: Using the Startup Script (Recommended)
```bash
cd /Users/rehanraispinjari/DT03/mess
./start.sh
```

### Option 2: Manual Start
```bash
cd /Users/rehanraispinjari/DT03/mess
node server.js
```

### Option 3: Using npm
```bash
cd /Users/rehanraispinjari/DT03/mess
npm start
```

Health check (optional):
```bash
npm run health
```

## 🌐 Access the Application

Once the server is running, open your browser and navigate to:

- **Home Page**: http://localhost:3000/
- **Dashboard**: http://localhost:3000/dashboard.html
- **Book Meals**: http://localhost:3000/book_meals.html
- **System Status**: http://localhost:3000/status.html
- **Profile**: http://localhost:3000/profile.html
- **Transactions**: http://localhost:3000/transactions.html

## 📋 Features

✅ **Persistent Sidebar** - Navigation stays visible across all pages
✅ **Meal Booking System** - Complete interface for booking meals
✅ **Responsive Design** - Works on desktop and mobile devices
✅ **State Persistence** - Remembers your preferences
✅ **Real-time Updates** - Dynamic content loading
✅ **User Dashboard** - Overview of all activities
✅ **Transaction History** - Track all payments
✅ **Profile Management** - Update user information

## 🛠️ Technical Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with CSS Variables
- **Icons**: SVG icons

## 📁 Project Structure

```
mess/
├── server.js              # Express server
├── start.sh              # Startup script
├── common.js             # Shared JavaScript utilities
├── dashboard.html        # Main dashboard
├── book_meals.html       # Meal booking interface
├── book_meals.js         # Booking functionality
├── book_meals.css        # Booking styles
├── dashboard.css         # Global styles
├── profile.html          # User profile
├── transactions.html     # Transaction history
├── status.html           # System status page
├── data/                 # Database directory
│   └── db.sqlite        # SQLite database
└── node_modules/         # Dependencies
```

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -ti:3000

# Kill the process if needed
kill -9 $(lsof -ti:3000)

# Restart the server
./start.sh
```

If you're not in the right folder and see an error like:

```
Error: Cannot find module '/Users/rehanraispinjari/DT03/server.js'
```

Run from the correct directory:

```bash
cd /Users/rehanraispinjari/DT03/mess
node server.js
```

Or use an absolute path:

```bash
node /Users/rehanraispinjari/DT03/mess/server.js
```

### Missing dependencies
```bash
cd /Users/rehanraispinjari/DT03/mess
npm install
```

### Pages not loading
1. Ensure server is running (check terminal output)
2. Verify you're accessing http://localhost:3000
3. Check browser console for errors (F12)

## 📝 Recent Updates
- ✅ Database-backed login with bcrypt (users table)
- ✅ Admin role with protected admin dashboard and settings
- ✅ JWT cookie-based auth; logout clears cookie
- ✅ Fixed sidebar persistence and header layout across pages
- ✅ Health endpoint and port fallback on startup
- ✅ Created startup script for easy deployment

## 🎯 Usage Instructions

1. **Start the Server**: Run `./start.sh` or `node server.js`
2. **Open Browser**: Navigate to http://localhost:3000
3. **Navigate**: Use the sidebar to switch between pages
4. **Book Meals**: Go to Book Meals page and select your meals
5. **View History**: Check transactions and upcoming bookings

## 🔐 Database & Auth

- SQLite database at `data/db.sqlite`
- Tables: `users` (with roles), `logins` (audit)
- Default users are seeded on first run:
   - Admin: `admin` / `admin123`
   - Student: `student` / `password123`
- Login sets an httpOnly JWT cookie; admins are redirected to `admin_dashboard.html`

## 🌟 Key Features Explained

### Sidebar Persistence
The sidebar remains visible when navigating between pages using:
- Fixed CSS positioning
- Consistent HTML structure
- common.js for state management

### Meal Booking
- Date selector (7 days ahead)
- Meal type tabs (Breakfast, Lunch, Dinner)
- Quantity controls
- Real-time price calculation
- Confirmation modal

### Responsive Design
- Desktop: Full sidebar + content
- Mobile: Collapsible sidebar with overlay
- Touch-friendly controls

## 📊 System Requirements

- Node.js v14+ 
- npm v6+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🐛 Known Issues

None currently! All systems operational.

## 📞 Support

For issues or questions, check:
- STATUS_REPORT.md - Current system status
- SIDEBAR_IMPLEMENTATION.md - Technical documentation
- SIDEBAR_FIX_SUMMARY.md - Recent fixes

## 📜 License

MIT

---

**Last Updated**: October 11, 2025
**Status**: ✅ All systems operational
**Version**: 1.0.0

Developer endpoints:

- GET `/_health` – server health
- GET `/_users` – list users (debug)
- GET `/_logins` – recent login attempts (audit)
- GET `/_me` – current authenticated user (from JWT cookie)
