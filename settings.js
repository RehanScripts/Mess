// ===== Settings Page JavaScript =====

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    setupFormHandlers();
});

// Load saved settings from localStorage
function loadSettings() {
    // Load notification preferences
    const notificationPrefs = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
    document.querySelectorAll('.notification-item input[type="checkbox"]').forEach((checkbox, index) => {
        const key = `notification_${index}`;
        if (notificationPrefs[key] !== undefined) {
            checkbox.checked = notificationPrefs[key];
        }
    });

    // Load app preferences
    const appPrefs = JSON.parse(localStorage.getItem('appPreferences') || '{}');
    if (appPrefs.theme) document.getElementById('theme').value = appPrefs.theme;
    if (appPrefs.language) document.getElementById('language').value = appPrefs.language;
    if (appPrefs.timezone) document.getElementById('timezone').value = appPrefs.timezone;
}

// Setup form handlers
function setupFormHandlers() {
    // Profile Form
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', handleProfileSubmit);

    // Password Form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', handlePasswordSubmit);

    // Cancel buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.addEventListener('click', function() {
            const form = this.closest('form');
            if (form) form.reset();
        });
    });
}

// Handle profile form submission
function handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        rollNumber: formData.get('rollNumber'),
        department: formData.get('department'),
        year: formData.get('year')
    };

    // Show loading
    showLoading();

    // Simulate API call
    setTimeout(() => {
        // Save to localStorage
        localStorage.setItem('profileData', JSON.stringify(profileData));
        
        hideLoading();
        showToast('Profile updated successfully!', 'success');
    }, 1000);
}

// Handle password form submission
function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    // Show loading
    showLoading();

    // Simulate API call
    setTimeout(() => {
        hideLoading();
        showToast('Password updated successfully!', 'success');
        e.target.reset();
    }, 1000);
}

// Save notification settings
function saveNotificationSettings() {
    const preferences = {};
    document.querySelectorAll('.notification-item input[type="checkbox"]').forEach((checkbox, index) => {
        preferences[`notification_${index}`] = checkbox.checked;
    });

    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    showToast('Notification preferences saved!', 'success');
}

// Save app preferences
function saveAppPreferences() {
    const preferences = {
        theme: document.getElementById('theme').value,
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value
    };

    localStorage.setItem('appPreferences', JSON.stringify(preferences));
    showToast('App preferences saved!', 'success');

    // Apply theme if changed
    if (preferences.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    // Set message
    toastMessage.textContent = message;

    // Set icon based on type
    if (type === 'success') {
        toast.classList.add('success');
        toast.classList.remove('error');
        toastIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    } else {
        toast.classList.add('error');
        toast.classList.remove('success');
        toastIcon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
    }

    // Show toast
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show loading overlay
function showLoading() {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (basic validation)
function isValidPhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Format phone number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return '+91 ' + cleaned.slice(0, 5) + cleaned.slice(5);
    }
    return phone;
}

// Export settings data
function exportSettings() {
    const settings = {
        profile: JSON.parse(localStorage.getItem('profileData') || '{}'),
        notifications: JSON.parse(localStorage.getItem('notificationPreferences') || '{}'),
        app: JSON.parse(localStorage.getItem('appPreferences') || '{}')
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'messmate-settings.json';
    link.click();
    
    showToast('Settings exported successfully!', 'success');
}

// Import settings data
function importSettings(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const settings = JSON.parse(e.target.result);
            
            if (settings.profile) {
                localStorage.setItem('profileData', JSON.stringify(settings.profile));
            }
            if (settings.notifications) {
                localStorage.setItem('notificationPreferences', JSON.stringify(settings.notifications));
            }
            if (settings.app) {
                localStorage.setItem('appPreferences', JSON.stringify(settings.app));
            }
            
            loadSettings();
            showToast('Settings imported successfully!', 'success');
        } catch (error) {
            showToast('Failed to import settings', 'error');
        }
    };
    reader.readAsText(file);
}

// Reset all settings to default
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
        localStorage.removeItem('profileData');
        localStorage.removeItem('notificationPreferences');
        localStorage.removeItem('appPreferences');
        
        location.reload();
    }
}

// Add real-time validation to forms
document.getElementById('email')?.addEventListener('blur', function() {
    if (this.value && !isValidEmail(this.value)) {
        this.style.borderColor = 'var(--accent-red)';
        showToast('Please enter a valid email address', 'error');
    } else {
        this.style.borderColor = '';
    }
});

document.getElementById('phone')?.addEventListener('blur', function() {
    if (this.value && !isValidPhone(this.value)) {
        this.style.borderColor = 'var(--accent-red)';
        showToast('Please enter a valid phone number', 'error');
    } else {
        this.style.borderColor = '';
        if (this.value) {
            this.value = formatPhoneNumber(this.value);
        }
    }
});

// Password strength indicator
document.getElementById('newPassword')?.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    
    const hint = this.parentElement.nextElementSibling;
    if (hint && hint.classList.contains('input-hint')) {
        if (strength <= 2) {
            hint.textContent = 'Weak password - Try adding uppercase, numbers, and symbols';
            hint.style.color = 'var(--accent-red)';
        } else if (strength <= 3) {
            hint.textContent = 'Medium strength - Consider adding more variety';
            hint.style.color = 'var(--accent-orange)';
        } else {
            hint.textContent = 'Strong password!';
            hint.style.color = 'var(--accent-green)';
        }
    }
});

// Auto-save notification toggles
document.querySelectorAll('.notification-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        // Auto-save when toggled
        setTimeout(() => {
            saveNotificationSettings();
        }, 300);
    });
});

// Theme selector auto-apply
document.getElementById('theme')?.addEventListener('change', function() {
    if (this.value === 'dark') {
        document.body.classList.add('dark-theme');
        showToast('Dark theme applied', 'success');
    } else if (this.value === 'light') {
        document.body.classList.remove('dark-theme');
        showToast('Light theme applied', 'success');
    } else {
        // Auto theme based on system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        showToast('Auto theme enabled', 'success');
    }
});
