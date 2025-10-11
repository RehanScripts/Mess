// ===== Book Meals JavaScript =====

// State Management
const state = {
    selectedDate: null,
    selectedMealType: null,
    selectedMeals: [],
    upcomingBookings: [
        {
            id: 1,
            date: '2025-10-12',
            meals: ['Breakfast', 'Lunch'],
            status: 'confirmed',
            total: 180
        },
        {
            id: 2,
            date: '2025-10-13',
            meals: ['Dinner'],
            status: 'pending',
            total: 90
        }
    ]
};

// Sample Menu Data (placeholder for API integration)
const menuData = {
    breakfast: [
        {
            id: 'b1',
            name: 'Classic Breakfast',
            time: '7:00 - 9:00 AM',
            description: 'Poha, Tea, Bread & Butter',
            price: 50,
            availability: 'available'
        },
        {
            id: 'b2',
            name: 'South Indian Special',
            time: '7:00 - 9:00 AM',
            description: 'Idli, Sambar, Chutney, Coffee',
            price: 60,
            availability: 'available'
        },
        {
            id: 'b3',
            name: 'Continental Breakfast',
            time: '7:00 - 9:00 AM',
            description: 'Toast, Eggs, Juice, Fruits',
            price: 80,
            availability: 'limited'
        }
    ],
    lunch: [
        {
            id: 'l1',
            name: 'Regular Thali',
            time: '12:00 - 2:00 PM',
            description: 'Dal, Rice, 2 Roti, Sabzi, Salad',
            price: 80,
            availability: 'available'
        },
        {
            id: 'l2',
            name: 'Special Thali',
            time: '12:00 - 2:00 PM',
            description: 'Dal, Rice, 3 Roti, Paneer, Raita, Sweet',
            price: 120,
            availability: 'available'
        },
        {
            id: 'l3',
            name: 'South Indian Meal',
            time: '12:00 - 2:00 PM',
            description: 'Sambar Rice, Curd Rice, Papad',
            price: 90,
            availability: 'limited'
        }
    ],
    dinner: [
        {
            id: 'd1',
            name: 'Regular Dinner',
            time: '7:00 - 9:00 PM',
            description: 'Dal, Rice, 2 Roti, Sabzi',
            price: 70,
            availability: 'available'
        },
        {
            id: 'd2',
            name: 'Biryani Special',
            time: '7:00 - 9:00 PM',
            description: 'Veg Biryani, Raita, Salad',
            price: 100,
            availability: 'available'
        },
        {
            id: 'd3',
            name: 'Chinese Combo',
            time: '7:00 - 9:00 PM',
            description: 'Fried Rice, Manchurian, Spring Roll',
            price: 110,
            availability: 'unavailable'
        }
    ]
};

// DOM Elements
const elements = {
    mealDate: document.getElementById('mealDate'),
    dateError: document.getElementById('dateError'),
    mealTypeError: document.getElementById('mealTypeError'),
    mealTypeBtns: document.querySelectorAll('.meal-type-btn'),
    mealOptionsCard: document.getElementById('mealOptionsCard'),
    loadingSkeleton: document.getElementById('loadingSkeleton'),
    emptyState: document.getElementById('emptyState'),
    mealOptionsGrid: document.getElementById('mealOptionsGrid'),
    summaryContent: document.getElementById('summaryContent'),
    summaryItems: document.getElementById('summaryItems'),
    summaryTotals: document.getElementById('summaryTotals'),
    subtotalAmount: document.getElementById('subtotalAmount'),
    taxAmount: document.getElementById('taxAmount'),
    totalAmount: document.getElementById('totalAmount'),
    confirmBookingBtn: document.getElementById('confirmBookingBtn'),
    upcomingBookingsList: document.getElementById('upcomingBookingsList'),
    confirmationModal: document.getElementById('confirmationModal'),
    closeModal: document.getElementById('closeModal'),
    cancelBookingBtn: document.getElementById('cancelBookingBtn'),
    confirmFinalBtn: document.getElementById('confirmFinalBtn'),
    modalSummary: document.getElementById('modalSummary'),
    modalSubtotal: document.getElementById('modalSubtotal'),
    modalTax: document.getElementById('modalTax'),
    modalTotal: document.getElementById('modalTotal'),
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastMessage: document.getElementById('toastMessage'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('sidebar')
};

// Initialize
function init() {
    setMinDate();
    renderUpcomingBookings();
    attachEventListeners();
}

// Set minimum date to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    elements.mealDate.min = today;
}

// Event Listeners
function attachEventListeners() {
    // Date selection
    elements.mealDate.addEventListener('change', handleDateChange);
    
    // Meal type selection
    elements.mealTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => handleMealTypeSelection(btn));
    });
    
    // Confirm booking button
    elements.confirmBookingBtn.addEventListener('click', openConfirmationModal);
    
    // Modal actions
    elements.closeModal.addEventListener('click', closeConfirmationModal);
    elements.cancelBookingBtn.addEventListener('click', closeConfirmationModal);
    elements.confirmFinalBtn.addEventListener('click', confirmBooking);
    
    // Close modal on overlay click
    elements.confirmationModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmationModal) {
            closeConfirmationModal();
        }
    });
    
    // Sidebar toggle
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('active');
        });
    }
}

// Handle date change
function handleDateChange(e) {
    const selectedDate = e.target.value;
    
    if (!selectedDate) {
        showError('dateError', 'Please select a date');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
        showError('dateError', 'Cannot select past dates');
        elements.mealDate.value = '';
        return;
    }
    
    hideError('dateError');
    state.selectedDate = selectedDate;
    
    if (state.selectedMealType) {
        loadMealOptions();
    }
}

// Handle meal type selection
function handleMealTypeSelection(btn) {
    const mealType = btn.dataset.meal;
    
    // Update active state
    elements.mealTypeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    hideError('mealTypeError');
    state.selectedMealType = mealType;
    
    if (state.selectedDate) {
        loadMealOptions();
    } else {
        showError('dateError', 'Please select a date first');
    }
}

// Load meal options
function loadMealOptions() {
    // Show loading skeleton
    elements.emptyState.style.display = 'none';
    elements.mealOptionsGrid.style.display = 'none';
    elements.loadingSkeleton.style.display = 'grid';
    
    // Simulate API call
    setTimeout(() => {
        elements.loadingSkeleton.style.display = 'none';
        
        const meals = menuData[state.selectedMealType];
        
        if (!meals || meals.length === 0) {
            elements.emptyState.style.display = 'block';
        } else {
            renderMealOptions(meals);
            elements.mealOptionsGrid.style.display = 'grid';
        }
    }, 500);
}

// Render meal options
function renderMealOptions(meals) {
    elements.mealOptionsGrid.innerHTML = meals.map(meal => `
        <div class="meal-option-card ${meal.availability === 'unavailable' ? 'unavailable' : ''}" data-meal-id="${meal.id}">
            <div class="meal-option-header">
                <div class="meal-option-info">
                    <div class="meal-option-name">${meal.name}</div>
                    <div class="meal-option-time">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${meal.time}
                    </div>
                </div>
                <span class="meal-option-badge badge-${meal.availability}">
                    ${meal.availability === 'available' ? 'Available' : 
                      meal.availability === 'limited' ? 'Limited' : 'Unavailable'}
                </span>
            </div>
            <p class="meal-option-description">${meal.description}</p>
            <div class="meal-option-footer">
                <span class="meal-option-price">₹${meal.price}</span>
                ${meal.availability !== 'unavailable' ? `
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="decrementQuantity('${meal.id}')" ${getQuantity(meal.id) === 0 ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span class="quantity-value" id="qty-${meal.id}">${getQuantity(meal.id)}</span>
                        <button class="quantity-btn" onclick="incrementQuantity('${meal.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Get quantity for a meal
function getQuantity(mealId) {
    const item = state.selectedMeals.find(m => m.id === mealId);
    return item ? item.quantity : 0;
}

// Increment quantity
function incrementQuantity(mealId) {
    const meal = findMealById(mealId);
    if (!meal) return;
    
    const existingItem = state.selectedMeals.find(m => m.id === mealId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.selectedMeals.push({
            id: mealId,
            name: meal.name,
            price: meal.price,
            quantity: 1,
            date: state.selectedDate,
            mealType: state.selectedMealType
        });
    }
    
    updateQuantityDisplay(mealId);
    updateSummary();
}

// Decrement quantity
function decrementQuantity(mealId) {
    const existingItem = state.selectedMeals.find(m => m.id === mealId);
    
    if (existingItem) {
        existingItem.quantity--;
        
        if (existingItem.quantity === 0) {
            state.selectedMeals = state.selectedMeals.filter(m => m.id !== mealId);
        }
    }
    
    updateQuantityDisplay(mealId);
    updateSummary();
}

// Update quantity display
function updateQuantityDisplay(mealId) {
    const qtyElement = document.getElementById(`qty-${mealId}`);
    if (qtyElement) {
        const quantity = getQuantity(mealId);
        qtyElement.textContent = quantity;
        
        // Update decrement button state
        const card = qtyElement.closest('.meal-option-card');
        const decrementBtn = card.querySelector('.quantity-btn:first-child');
        if (decrementBtn) {
            decrementBtn.disabled = quantity === 0;
        }
    }
}

// Find meal by ID
function findMealById(mealId) {
    for (const mealType in menuData) {
        const meal = menuData[mealType].find(m => m.id === mealId);
        if (meal) return meal;
    }
    return null;
}

// Update summary
function updateSummary() {
    if (state.selectedMeals.length === 0) {
        elements.summaryContent.querySelector('.summary-empty').style.display = 'block';
        elements.summaryItems.style.display = 'none';
        elements.summaryTotals.style.display = 'none';
        elements.confirmBookingBtn.disabled = true;
        return;
    }
    
    elements.summaryContent.querySelector('.summary-empty').style.display = 'none';
    elements.summaryItems.style.display = 'flex';
    elements.summaryTotals.style.display = 'block';
    elements.confirmBookingBtn.disabled = false;
    
    // Render summary items
    elements.summaryItems.innerHTML = state.selectedMeals.map(item => `
        <div class="summary-item">
            <div class="summary-item-info">
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-details">Qty: ${item.quantity} × ₹${item.price}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="summary-item-price">₹${item.quantity * item.price}</span>
                <button class="summary-item-remove" onclick="removeFromSummary('${item.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    // Calculate totals
    const subtotal = state.selectedMeals.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    elements.subtotalAmount.textContent = `₹${subtotal.toFixed(2)}`;
    elements.taxAmount.textContent = `₹${tax.toFixed(2)}`;
    elements.totalAmount.textContent = `₹${total.toFixed(2)}`;
}

// Remove from summary
function removeFromSummary(mealId) {
    state.selectedMeals = state.selectedMeals.filter(m => m.id !== mealId);
    updateQuantityDisplay(mealId);
    updateSummary();
}

// Open confirmation modal
function openConfirmationModal() {
    if (!validateBooking()) return;
    
    // Populate modal summary
    elements.modalSummary.innerHTML = state.selectedMeals.map(item => `
        <div class="modal-summary-item">
            <div class="modal-summary-info">
                <div class="modal-summary-name">${item.name}</div>
                <div class="modal-summary-details">
                    ${formatDate(item.date)} • ${capitalize(item.mealType)} • Qty: ${item.quantity}
                </div>
            </div>
            <span class="modal-summary-price">₹${item.quantity * item.price}</span>
        </div>
    `).join('');
    
    // Calculate and display totals
    const subtotal = state.selectedMeals.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    elements.modalSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    elements.modalTax.textContent = `₹${tax.toFixed(2)}`;
    elements.modalTotal.textContent = `₹${total.toFixed(2)}`;
    
    // Show modal
    elements.confirmationModal.classList.add('show');
}

// Close confirmation modal
function closeConfirmationModal() {
    elements.confirmationModal.classList.remove('show');
}

// Validate booking
function validateBooking() {
    let isValid = true;
    
    if (!state.selectedDate) {
        showError('dateError', 'Please select a date');
        isValid = false;
    }
    
    if (!state.selectedMealType) {
        showError('mealTypeError', 'Please select a meal type');
        isValid = false;
    }
    
    if (state.selectedMeals.length === 0) {
        showToast('Please select at least one meal', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Confirm booking
function confirmBooking() {
    // Simulate API call
    elements.confirmFinalBtn.disabled = true;
    elements.confirmFinalBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        Processing...
    `;
    
    setTimeout(() => {
        // Add to upcoming bookings
        const total = state.selectedMeals.reduce((sum, item) => sum + (item.quantity * item.price), 0) * 1.05;
        const mealTypes = [...new Set(state.selectedMeals.map(m => capitalize(m.mealType)))];
        
        state.upcomingBookings.unshift({
            id: Date.now(),
            date: state.selectedDate,
            meals: mealTypes,
            status: 'confirmed',
            total: Math.round(total)
        });
        
        // Clear selections
        state.selectedMeals = [];
        state.selectedDate = null;
        state.selectedMealType = null;
        elements.mealDate.value = '';
        elements.mealTypeBtns.forEach(btn => btn.classList.remove('active'));
        elements.emptyState.style.display = 'block';
        elements.mealOptionsGrid.style.display = 'none';
        
        // Update UI
        updateSummary();
        renderUpcomingBookings();
        closeConfirmationModal();
        
        // Show success toast
        showToast('Booking confirmed successfully!', 'success');
        
        // Reset button
        elements.confirmFinalBtn.disabled = false;
        elements.confirmFinalBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Confirm & Pay
        `;
    }, 1500);
}

// Render upcoming bookings
function renderUpcomingBookings() {
    if (state.upcomingBookings.length === 0) {
        elements.upcomingBookingsList.innerHTML = `
            <div class="empty-state" style="padding: 2rem 1rem;">
                <p style="text-align: center; color: var(--text-secondary);">No upcoming bookings</p>
            </div>
        `;
        return;
    }
    
    elements.upcomingBookingsList.innerHTML = state.upcomingBookings.map(booking => `
        <div class="booking-item">
            <div class="booking-info">
                <div class="booking-date">${formatDate(booking.date)}</div>
                <div class="booking-meals">${booking.meals.join(', ')} • ₹${booking.total}</div>
                <span class="booking-status status-${booking.status}">${capitalize(booking.status)}</span>
            </div>
            <div class="booking-actions">
                <button class="action-btn" onclick="editBooking(${booking.id})" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="cancelBooking(${booking.id})" title="Cancel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Edit booking
function editBooking(bookingId) {
    showToast('Edit functionality coming soon!', 'success');
}

// Cancel booking
function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const booking = state.upcomingBookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            renderUpcomingBookings();
            showToast('Booking cancelled successfully', 'success');
        }
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    
    if (type === 'success') {
        elements.toastIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    } else {
        elements.toastIcon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
    }
    
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Show error
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Hide error
function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
