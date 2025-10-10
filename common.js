// ===== Common JavaScript for Sidebar Persistence =====
// This ensures the sidebar remains visible and functional across all pages

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar state from localStorage
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const menuToggle = document.getElementById('menuToggle');
    
    // Check if sidebar should be collapsed (for mobile)
    const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isSidebarCollapsed && window.innerWidth < 768) {
        sidebar.classList.add('collapsed');
    }
    
    // Sidebar toggle functionality (desktop)
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
    }
    
    // Menu toggle functionality (mobile)
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth < 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = menuToggle && menuToggle.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
        }
    });
    
    // Update active navigation item based on current page
    updateActiveNavItem();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Function to update active navigation item
function updateActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        } else if (item.classList.contains('active') && !href.includes(currentPage)) {
            item.classList.remove('active');
        }
    });
}

// Function to handle responsive sidebar on window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 768) {
        sidebar.classList.remove('show');
    }
});

// Prevent sidebar from disappearing during navigation
window.addEventListener('beforeunload', function() {
    // Save any necessary state before page unload
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
});

// Export utility functions for use in other scripts
window.SidebarUtils = {
    updateActiveNavItem: updateActiveNavItem,
    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    },
    showSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('show');
    },
    hideSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('show');
    }
};
