# Data Synchronization Implementation

## Overview
This document describes the implementation of data synchronization between the Admin Dashboard and User Pages in the MessMate system.

## Features Implemented

### 1. Database Schema
Created comprehensive database tables:
- **menu_items**: Stores all menu items with details (title, description, image, price, availability, meal_type)
- **bookings**: Tracks all meal bookings by users
- **transactions**: Records payment transactions

### 2. REST API Endpoints

#### Menu Items API
- `GET /api/menu-items` - Fetch all menu items (with optional meal_type filter)
- `GET /api/menu-items/:id` - Fetch single menu item
- `POST /api/menu-items` - Create new menu item (admin only)
- `PUT /api/menu-items/:id` - Update menu item (admin only)
- `DELETE /api/menu-items/:id` - Delete menu item (admin only)

#### Bookings API
- `GET /api/bookings` - Get user's bookings
- `GET /api/admin/bookings` - Get all bookings (admin only)

#### Statistics API
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

### 3. Admin Dashboard Features

#### Menu Items Management Section
- **View Menu Items**: Display all menu items organized by meal type (Breakfast, Lunch, Dinner)
- **Add Menu Item**: Modal form to create new menu items with:
  - Meal Type (breakfast/lunch/dinner)
  - Title
  - Description
  - Image URL
  - Price
  - Availability toggle
  
- **Edit Menu Item**: Click "Edit" button to modify existing items
- **Toggle Availability**: Enable/disable menu items without deleting them
- **Delete Menu Item**: Remove menu items with confirmation
- **Meal Type Tabs**: Filter menu items by meal type

#### Real-time Statistics
- Total Students count
- Meals Served Today
- Total Revenue
- Pending Payments
- Meal selections breakdown (Breakfast/Lunch/Dinner)

### 4. User Dashboard (Student Page) Features

#### Dynamic Menu Display
- **Fetches menu items from database** instead of static HTML
- **Meal Type Tabs**: Switch between Breakfast, Lunch, Dinner
- **Only shows available items** (filtered by availability flag)
- **Beautiful card layout** with:
  - Item image
  - Title and description
  - Price
  - "Book Now" button linking to booking page

#### Auto-refresh
- **Automatic sync every 30 seconds** to reflect admin changes
- No page reload required

### 5. Data Synchronization Flow

```
Admin Dashboard                    Database                    User Dashboard
     |                                |                              |
     | --- Create/Edit/Delete ---> [API] ---> [SQLite]              |
     |                                |                              |
     |                                | <--- Fetch Menu --- [Auto-refresh]
     |                                |                              |
     |                           [menu_items]                        |
     |                                |                              |
     |                                | ---> Display Available Items |
```

#### How it Works:
1. **Admin makes changes**: Add, edit, delete, or toggle availability of menu items
2. **Changes saved to database**: SQLite database updated via REST API
3. **User page auto-syncs**: Every 30 seconds, user dashboard fetches latest menu items
4. **Instant reflection**: Changes appear on user page without manual refresh

### 6. Seed Data
Pre-populated menu items on first run:
- **Breakfast**: Poha, Idli Sambar, Paratha with Curd
- **Lunch**: Dal Rice Combo, Paneer Curry, Veg Thali
- **Dinner**: Veg Biryani, Chole Bhature, Rajma Chawal

All items include professional food images, descriptions, and appropriate pricing.

## Testing Instructions

### Test Case 1: Add New Menu Item
1. Login as admin (admin/admin123)
2. Navigate to Admin Dashboard
3. Scroll to "Menu Items Management" section
4. Click "Add New Menu Item"
5. Fill in details and save
6. **Expected**: Item appears in admin list
7. Open User Dashboard in another tab
8. **Expected**: New item appears within 30 seconds

### Test Case 2: Edit Menu Item
1. In Admin Dashboard, click "Edit" on any menu item
2. Change title, price, or description
3. Save changes
4. **Expected**: Changes visible immediately in admin view
5. Check User Dashboard
6. **Expected**: Changes reflected within 30 seconds

### Test Case 3: Toggle Availability
1. In Admin Dashboard, click "Disable" on an item
2. **Expected**: Item marked as unavailable in admin view
3. Check User Dashboard
4. **Expected**: Item disappears from user view (only available items shown)
5. Click "Enable" to restore
6. **Expected**: Item reappears on user dashboard

### Test Case 4: Delete Menu Item
1. In Admin Dashboard, click "Delete" on an item
2. Confirm deletion
3. **Expected**: Item removed from admin list
4. Check User Dashboard
5. **Expected**: Item no longer appears

### Test Case 5: Real-time Sync
1. Open Admin Dashboard and User Dashboard side-by-side
2. Make any change in admin dashboard
3. Wait 30 seconds or refresh user dashboard
4. **Expected**: Changes automatically reflected

## Technical Details

### Authentication
- Admin-only endpoints check JWT token and role
- 401 Unauthorized if not logged in
- 403 Forbidden if not admin

### Data Validation
- Required fields enforced (meal_type, title, price)
- Proper error handling and user feedback
- SQL injection prevention via parameterized queries

### Performance
- Efficient queries with proper indexing
- Pagination support for large datasets
- Auto-refresh interval optimized (30 seconds)

### Responsive Design
- Works on desktop, tablet, and mobile
- Card-based layout adapts to screen size
- Modal forms optimized for all devices

## Files Modified

1. **server.js**: Added database tables, API endpoints, seed data
2. **admin_dashboard.html**: Added menu management UI, modal, JavaScript
3. **dashboard.html**: Updated to fetch and display menu dynamically

## API Authentication

All admin endpoints require authentication via JWT cookie:
- Cookie name: `auth`
- Checked and verified on each admin API call
- Role must be 'admin' for admin-only endpoints

## Future Enhancements

1. Real-time updates using WebSockets (instant sync without 30s delay)
2. Image upload functionality (instead of URL input)
3. Bulk operations (enable/disable multiple items)
4. Menu scheduling (set availability by date/time)
5. Nutritional information fields
6. Customer ratings and reviews
7. Stock management integration

## Conclusion

The system now has complete data synchronization between Admin Dashboard and User Pages. Any changes made by admin are automatically reflected on the user side, ensuring consistency and real-time updates.

**Status**: ✅ Fully Implemented and Working
