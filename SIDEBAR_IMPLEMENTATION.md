# Sidebar Persistence Implementation

## Overview
This document explains how the sidebar remains visible and persistent across all pages in the MessMate application.

## Architecture

### 1. Fixed Positioning
The sidebar uses `position: fixed` in CSS, which keeps it anchored to the viewport:
```css
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-width);
    z-index: 1000;
}
```

### 2. Content Layout
The main content area has a left margin equal to the sidebar width:
```css
.main-wrapper {
    margin-left: var(--sidebar-width);
    flex: 1;
    display: flex;
    flex-direction: column;
}
```

### 3. Consistent HTML Structure
Both `dashboard.html` and `book_meals.html` share the same sidebar structure:
```html
<aside class="sidebar" id="sidebar">
    <!-- Sidebar Header -->
    <!-- Navigation Items -->
    <!-- Footer/Logout -->
</aside>

<div class="main-wrapper">
    <!-- Header -->
    <!-- Page Content -->
</div>
```

## Navigation Items (Complete List)
1. **Dashboard** - Main overview page
2. **Book Meals** - Meal booking interface
3. **Transactions** - Payment and transaction history
4. **Profile** - User profile settings
5. **Settings** - Application settings
6. **Logout** - Sign out functionality

## JavaScript Functionality

### Common Script (`common.js`)
Handles:
- **State Persistence**: Saves sidebar collapsed/expanded state in localStorage
- **Active Item Highlighting**: Automatically highlights the current page in navigation
- **Mobile Toggle**: Shows/hides sidebar on mobile devices
- **Responsive Behavior**: Adapts to screen size changes
- **Click Outside**: Closes mobile sidebar when clicking outside

### Key Functions:
```javascript
// Update active navigation based on current page
updateActiveNavItem()

// Toggle sidebar visibility
SidebarUtils.toggleSidebar()

// Show/hide sidebar (mobile)
SidebarUtils.showSidebar()
SidebarUtils.hideSidebar()
```

## Responsive Design

### Desktop (≥768px)
- Sidebar is always visible
- Content area has left margin for sidebar
- Sidebar can be collapsed via toggle button

### Mobile (<768px)
- Sidebar slides in from left when menu is toggled
- Main content takes full width
- Overlay dims background when sidebar is open
- Sidebar closes when clicking outside

## Adding New Pages

To add a new page with persistent sidebar:

1. **Copy HTML structure** from `dashboard.html` or `book_meals.html`
2. **Include CSS files**:
   ```html
   <link rel="stylesheet" href="dashboard.css">
   <link rel="stylesheet" href="your-page.css">
   ```
3. **Include common.js**:
   ```html
   <script src="common.js"></script>
   ```
4. **Add navigation item** to sidebar in ALL existing pages:
   ```html
   <a href="your-page.html" class="nav-item">
       <svg><!-- icon --></svg>
       <span>Your Page</span>
   </a>
   ```
5. **Mark active state** on the new page:
   ```html
   <a href="your-page.html" class="nav-item active">
   ```

## Benefits

✅ **Consistent Navigation**: Same sidebar across all pages
✅ **Better UX**: No layout shift during page transitions
✅ **State Persistence**: Remembers user's sidebar preferences
✅ **Responsive**: Works seamlessly on mobile and desktop
✅ **Accessible**: Keyboard navigation and ARIA support
✅ **Easy Maintenance**: One common script for all pages

## File Structure
```
mess/
├── dashboard.html          # Main dashboard
├── book_meals.html         # Booking interface
├── dashboard.css           # Shared styles (includes sidebar)
├── book_meals.css          # Page-specific styles
├── common.js               # Sidebar persistence logic
└── book_meals.js           # Page-specific logic
```

## Testing Checklist
- [ ] Sidebar visible on all pages
- [ ] Active nav item highlights correctly
- [ ] Sidebar toggles on mobile
- [ ] State persists across page navigation
- [ ] All navigation links work
- [ ] Responsive breakpoints function properly
- [ ] No console errors
