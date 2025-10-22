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

## 🌐 Access the Application

Once the server is running, open your browser and navigate to:

- **Home Page (Login)**: http://localhost:3000/
- **Dashboard**: http://localhost:3000/dashboard.html
- **Book Meals**: http://localhost:3000/book_meals.html
- **Profile**: http://localhost:3000/profile.html
- **Transactions**: http://localhost:3000/transactions.html
- **Settings**: http://localhost:3000/settings.html
- **Admin Dashboard**: http://localhost:3000/admin_dashboard.html (admin/admin123)

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
├── server.js                    # Express server with REST API
├── start.sh                     # Startup script
├── common.js                    # Shared JavaScript utilities
├── index.html                   # Login page
├── signup.html                  # Registration page
├── dashboard.html               # Student dashboard (main)
├── book_meals.html              # Meal booking interface
├── book_meals.js                # Booking functionality
├── book_meals.css               # Booking styles
├── dashboard.css                # Global styles
├── profile.html                 # User profile
├── profile.js                   # Profile functionality
├── transactions.html            # Transaction history
├── transactions.js              # Transaction functionality
├── settings.html                # User settings
├── settings.js                  # Settings functionality
├── admin_dashboard.html         # Admin dashboard with charts
├── admin_settings.html          # Admin settings
├── data/                        # Database directory
│   └── db.sqlite               # SQLite database
└── Documentation/
    ├── README.md               # Project documentation
    ├── CHARTS_IMPLEMENTATION.md
    ├── DATA_SYNC_IMPLEMENTATION.md
    ├── SETTINGS_IMPLEMENTATION.md
    ├── TRANSACTIONS_IMPLEMENTATION.md
    └── CHARTS_SUMMARY.md
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
- ✅ Professional real-time charts in admin dashboard (Chart.js)
- ✅ Data synchronization between admin and user pages
- ✅ Menu management with CRUD operations
- ✅ Modern login page design
- ✅ Complete REST API with authentication
- ✅ Responsive design for all devices
- ✅ Auto-refresh functionality for live updates

## 🎯 Usage Instructions

1. **Start the Server**: Run `./start.sh` or `node server.js`
2. **Open Browser**: Navigate to http://localhost:3000
3. **Navigate**: Use the sidebar to switch between pages
4. **Book Meals**: Go to Book Meals page and select your meals
5. **View History**: Check transactions and upcoming bookings

## 🔐 Database

The application uses SQLite for data storage:
- Location: `data/db.sqlite`
- Tables: users, menu_items, bookings, transactions, logins
- Automatically created on first run
- Seeded with sample menu items

## 🌟 Key Features Explained

### Admin Dashboard
- Real-time revenue distribution pie chart
- Sales trends line chart with period selection
- Detailed analysis with multi-metric charts
- Menu management with CRUD operations
- User and booking statistics
- Auto-refresh every 60 seconds

### Data Synchronization
- Admin changes reflect on user pages in real-time
- Auto-refresh mechanism (30-60 seconds)
- Live menu updates without page reload
- Seamless data flow between admin and users

### Meal Booking
- Dynamic menu fetched from database
- Meal type tabs (Breakfast, Lunch, Dinner)
- Real-time price calculation
- Professional UI with images and descriptions

### Responsive Design
- Desktop: Full sidebar + content
- Tablet/Mobile: Collapsible sidebar with overlay
- Touch-friendly controls
- Charts adapt to screen size

## 📊 System Requirements

- Node.js v14+ 
- npm v6+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- SQLite3

## 🔐 Default Credentials

- **Student**: `student` / `password123`
- **Admin**: `admin` / `admin123`

## 🐛 Known Issues

None currently! All systems operational.

## 📞 Support

For detailed documentation, check:
- **CHARTS_IMPLEMENTATION.md** - Charts and analytics documentation
- **DATA_SYNC_IMPLEMENTATION.md** - Data synchronization guide
- **SETTINGS_IMPLEMENTATION.md** - Settings functionality
- **TRANSACTIONS_IMPLEMENTATION.md** - Transaction features
- **CHARTS_SUMMARY.md** - Quick charts reference

## 📜 License

MIT

---

**Last Updated**: October 11, 2025
**Status**: ✅ All systems operational
**Version**: 1.0.0

This repository contains a small static website (login, signup, dashboard) and a minimal Node.js backend that accepts any login credentials and redirects the user to the dashboard. It also stores login attempts in a local SQLite database.

Quick start:

1. Install dependencies

   npm install

2. Start the server

   npm start

3. Open http://localhost:3000 in your browser and use the login form. Any username/password will be accepted and redirect to the dashboard.

Developer endpoints:

- GET /_logins - returns recent login attempts (for debugging)

Notes:
- This is intentionally simple; do not use in production without proper authentication, password hashing, and security.
