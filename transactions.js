// ===== Transactions Page JavaScript =====

// Sample transaction data
const transactions = [
    {
        id: 'TXN20251011001',
        date: '2025-10-11',
        time: '08:30 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 50
    },
    {
        id: 'TXN20251011002',
        date: '2025-10-11',
        time: '12:45 PM',
        mealType: 'lunch',
        status: 'pending',
        amount: 80
    },
    {
        id: 'TXN20251010001',
        date: '2025-10-10',
        time: '08:15 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 60
    },
    {
        id: 'TXN20251010002',
        date: '2025-10-10',
        time: '01:00 PM',
        mealType: 'lunch',
        status: 'completed',
        amount: 120
    },
    {
        id: 'TXN20251010003',
        date: '2025-10-10',
        time: '08:30 PM',
        mealType: 'dinner',
        status: 'completed',
        amount: 90
    },
    {
        id: 'TXN20251009001',
        date: '2025-10-09',
        time: '08:00 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 50
    },
    {
        id: 'TXN20251009002',
        date: '2025-10-09',
        time: '12:30 PM',
        mealType: 'lunch',
        status: 'completed',
        amount: 80
    },
    {
        id: 'TXN20251009003',
        date: '2025-10-09',
        time: '08:00 PM',
        mealType: 'dinner',
        status: 'pending',
        amount: 100
    },
    {
        id: 'TXN20251008001',
        date: '2025-10-08',
        time: '08:15 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 60
    },
    {
        id: 'TXN20251008002',
        date: '2025-10-08',
        time: '01:15 PM',
        mealType: 'lunch',
        status: 'cancelled',
        amount: 80
    },
    {
        id: 'TXN20251008003',
        date: '2025-10-08',
        time: '08:45 PM',
        mealType: 'dinner',
        status: 'completed',
        amount: 90
    },
    {
        id: 'TXN20251007001',
        date: '2025-10-07',
        time: '08:30 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 50
    },
    {
        id: 'TXN20251007002',
        date: '2025-10-07',
        time: '12:45 PM',
        mealType: 'lunch',
        status: 'completed',
        amount: 80
    },
    {
        id: 'TXN20251007003',
        date: '2025-10-07',
        time: '08:15 PM',
        mealType: 'dinner',
        status: 'completed',
        amount: 70
    },
    {
        id: 'TXN20251006001',
        date: '2025-10-06',
        time: '08:00 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 50
    },
    {
        id: 'TXN20251006002',
        date: '2025-10-06',
        time: '01:00 PM',
        mealType: 'lunch',
        status: 'completed',
        amount: 120
    },
    {
        id: 'TXN20251005001',
        date: '2025-10-05',
        time: '08:30 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 60
    },
    {
        id: 'TXN20251005002',
        date: '2025-10-05',
        time: '12:30 PM',
        mealType: 'lunch',
        status: 'completed',
        amount: 80
    },
    {
        id: 'TXN20251005003',
        date: '2025-10-05',
        time: '08:00 PM',
        mealType: 'dinner',
        status: 'pending',
        amount: 200
    },
    {
        id: 'TXN20251004001',
        date: '2025-10-04',
        time: '08:15 AM',
        mealType: 'breakfast',
        status: 'completed',
        amount: 50
    }
];

// State for filters
let currentFilters = {
    status: 'all',
    mealType: 'all',
    dateRange: 'month'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    renderTransactions();
    setupFilters();
});

// Render transactions table
function renderTransactions(filteredTransactions = transactions) {
    const tbody = document.getElementById('transactionTableBody');
    
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>No Transactions Found</h3>
                        <p>No transactions match your current filters.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredTransactions.map(transaction => `
        <tr>
            <td>
                <div class="transaction-date">
                    <span class="transaction-date-day">${formatDate(transaction.date)}</span>
                    <span class="transaction-date-time">${transaction.time}</span>
                </div>
            </td>
            <td>
                <span class="transaction-id">${transaction.id}</span>
            </td>
            <td>
                <span class="meal-badge ${transaction.mealType}">
                    ${getMealIcon(transaction.mealType)}
                    ${capitalizeFirst(transaction.mealType)}
                </span>
            </td>
            <td>
                <span class="status-badge ${transaction.status}">
                    ${capitalizeFirst(transaction.status)}
                </span>
            </td>
            <td class="text-right">
                <span class="transaction-amount ${transaction.status === 'completed' ? 'negative' : 'pending'}">
                    ₹${transaction.amount.toFixed(2)}
                </span>
            </td>
            <td class="text-center">
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewTransaction('${transaction.id}')" title="View Details">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="downloadReceipt('${transaction.id}')" title="Download Receipt">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Setup filter listeners
function setupFilters() {
    const statusFilter = document.getElementById('filterStatus');
    const mealFilter = document.getElementById('filterMeal');
    const dateFilter = document.getElementById('filterDate');

    statusFilter.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        applyFilters();
    });

    mealFilter.addEventListener('change', (e) => {
        currentFilters.mealType = e.target.value;
        applyFilters();
    });

    dateFilter.addEventListener('change', (e) => {
        currentFilters.dateRange = e.target.value;
        applyFilters();
    });
}

// Apply filters
function applyFilters() {
    let filtered = transactions;

    // Filter by status
    if (currentFilters.status !== 'all') {
        filtered = filtered.filter(t => t.status === currentFilters.status);
    }

    // Filter by meal type
    if (currentFilters.mealType !== 'all') {
        filtered = filtered.filter(t => t.mealType === currentFilters.mealType);
    }

    // Filter by date range
    const today = new Date();
    if (currentFilters.dateRange === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        filtered = filtered.filter(t => t.date === todayStr);
    } else if (currentFilters.dateRange === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (currentFilters.dateRange === 'month') {
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    }

    renderTransactions(filtered);
}

// Utility functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) {
        return 'Today';
    } else if (dateOnly === yesterdayOnly) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getMealIcon(mealType) {
    const icons = {
        breakfast: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>`,
        lunch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`,
        dinner: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`
    };
    return icons[mealType] || '';
}

// Action functions
function viewTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    alert(`Transaction Details:\n\nID: ${transaction.id}\nDate: ${transaction.date}\nMeal: ${capitalizeFirst(transaction.mealType)}\nStatus: ${capitalizeFirst(transaction.status)}\nAmount: ₹${transaction.amount}`);
}

function downloadReceipt(id) {
    alert(`Downloading receipt for transaction ${id}...`);
    // In a real application, this would generate and download a PDF receipt
}

// Export functionality
document.querySelector('.btn-secondary')?.addEventListener('click', function() {
    alert('Exporting transactions to CSV...');
    // In a real application, this would export the data to CSV
});
