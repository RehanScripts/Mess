# Smart Mess (demo)

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
