// ===== Profile Page JavaScript =====

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordModal = document.getElementById('passwordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
const logoutBtn = document.getElementById('logoutBtn');
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const avatarInput = document.getElementById('avatarInput');
const avatarImage = document.getElementById('avatarImage');

// Form Fields
const fullNameInput = document.getElementById('fullName');
const rollNumberInput = document.getElementById('rollNumber');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const messPlanInput = document.getElementById('messPlan');
const joinDateInput = document.getElementById('joinDate');

// Password Form Fields
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Notification Preferences
const notifBookings = document.getElementById('notifBookings');
const notifMenu = document.getElementById('notifMenu');
const notifPayments = document.getElementById('notifPayments');
const notifEmail = document.getElementById('notifEmail');

// State
let isEditing = false;
let originalFormData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    saveOriginalFormData();
    attachEventListeners();
});

// Sidebar Functionality
function initializeSidebar() {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Save Original Form Data
function saveOriginalFormData() {
    originalFormData = {
        fullName: fullNameInput.value,
        rollNumber: rollNumberInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        messPlan: messPlanInput.value,
        joinDate: joinDateInput.value
    };
}

// Attach Event Listeners
function attachEventListeners() {
    // Edit Profile Button
    editProfileBtn.addEventListener('click', toggleEditMode);
    
    // Save Profile Button
    saveProfileBtn.addEventListener('click', saveProfile);
    
    // Change Password Button
    changePasswordBtn.addEventListener('click', openPasswordModal);
    
    // Password Modal Close Buttons
    closePasswordModal.addEventListener('click', closePasswordModalFunc);
    cancelPasswordBtn.addEventListener('click', closePasswordModalFunc);
    
    // Confirm Password Button
    confirmPasswordBtn.addEventListener('click', changePassword);
    
    // Logout Button
    logoutBtn.addEventListener('click', logout);
    
    // Avatar Upload
    uploadAvatarBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleAvatarUpload);
    
    // Notification Preferences
    notifBookings.addEventListener('change', () => saveNotificationPreference('bookings', notifBookings.checked));
    notifMenu.addEventListener('change', () => saveNotificationPreference('menu', notifMenu.checked));
    notifPayments.addEventListener('change', () => saveNotificationPreference('payments', notifPayments.checked));
    notifEmail.addEventListener('change', () => saveNotificationPreference('email', notifEmail.checked));
    
    // Close modal when clicking outside
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            closePasswordModalFunc();
        }
    });
}

// Toggle Edit Mode
function toggleEditMode() {
    isEditing = !isEditing;
    
    if (isEditing) {
        enableFormFields();
        editProfileBtn.style.display = 'none';
        saveProfileBtn.style.display = 'inline-flex';
    } else {
        disableFormFields();
        restoreOriginalFormData();
        editProfileBtn.style.display = 'inline-flex';
        saveProfileBtn.style.display = 'none';
    }
}

// Enable Form Fields
function enableFormFields() {
    fullNameInput.disabled = false;
    emailInput.disabled = false;
    phoneInput.disabled = false;
    messPlanInput.disabled = false;
}

// Disable Form Fields
function disableFormFields() {
    fullNameInput.disabled = true;
    emailInput.disabled = true;
    phoneInput.disabled = true;
    messPlanInput.disabled = true;
}

// Restore Original Form Data
function restoreOriginalFormData() {
    fullNameInput.value = originalFormData.fullName;
    emailInput.value = originalFormData.email;
    phoneInput.value = originalFormData.phone;
    messPlanInput.value = originalFormData.messPlan;
}

// Save Profile
function saveProfile() {
    // Validate form data
    if (!validateProfileForm()) {
        return;
    }
    
    // Simulate API call
    showToast('Profile updated successfully!', 'success');
    
    // Update original data
    saveOriginalFormData();
    
    // Exit edit mode
    toggleEditMode();
}

// Validate Profile Form
function validateProfileForm() {
    if (!fullNameInput.value.trim()) {
        showToast('Please enter your full name', 'error');
        return false;
    }
    
    if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }
    
    if (!phoneInput.value.trim()) {
        showToast('Please enter your phone number', 'error');
        return false;
    }
    
    return true;
}

// Validate Email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle Avatar Upload
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }
    
    // Read and display the image
    const reader = new FileReader();
    reader.onload = (e) => {
        avatarImage.src = e.target.result;
        showToast('Profile picture updated!', 'success');
    };
    reader.readAsDataURL(file);
}

// Open Password Modal
function openPasswordModal() {
    passwordModal.style.display = 'flex';
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
}

// Close Password Modal
function closePasswordModalFunc() {
    passwordModal.style.display = 'none';
}

// Change Password
function changePassword() {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate passwords
    if (!currentPassword) {
        showToast('Please enter your current password', 'error');
        return;
    }
    
    if (!newPassword) {
        showToast('Please enter a new password', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    // Simulate API call
    showToast('Password changed successfully!', 'success');
    closePasswordModalFunc();
}

// Save Notification Preference
function saveNotificationPreference(type, enabled) {
    // Simulate API call
    console.log(`Notification preference updated: ${type} = ${enabled}`);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set message
    toastMessage.textContent = message;
    
    // Set icon based on type
    let iconSVG = '';
    if (type === 'success') {
        iconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
        iconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
        iconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    toastIcon.innerHTML = iconSVG;
    
    // Remove previous type classes
    toast.classList.remove('success', 'error', 'info');
    
    // Add new type class
    toast.classList.add(type);
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
