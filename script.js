// Current user data
let currentUser = null;
let menuData = [];
let currentBillItems = [];
let pendingTableOrders = [];
let selectedPendingOrder = null;
let orderHistory = [];
let udhariData = [];
let expenseData = [];
let selectedPaymentMode = '';
let isEditingOrder = false;
let editingOrderId = null;

// Initialize
function init() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        currentUser = loggedInUser;
        loadUserData();
        showMainApp();
    }

    const today = new Date();
    const monthString = today.toISOString().slice(0, 7);
    const dateString = today.toISOString().slice(0, 10);

    const monthSelector = document.getElementById('monthSelector');
    const expenseMonthFilter = document.getElementById('expenseMonthFilter');
    const expenseDate = document.getElementById('expenseDate');

    if (monthSelector) monthSelector.value = monthString;
    if (expenseMonthFilter) expenseMonthFilter.value = monthString;
    if (expenseDate) expenseDate.value = dateString;
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Show/Hide Screens
function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateMenuList();
    updateMainItemSelect();
    updateAvailableItems();
    updateCurrentBill();
    updatePendingOrders();
    updateHistory();
}

// Register
function register() {
    const cafeName = document.getElementById('registerCafeName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!cafeName || !username || !password) {
        showAlert('registerAlert', 'Please fill all fields', 'error');
        return;
    }

    const existingUser = localStorage.getItem(`user_${username}`);
    if (existingUser) {
        showAlert('registerAlert', 'Username already exists', 'error');
        return;
    }

    localStorage.setItem(`user_${username}`, JSON.stringify({
        username, password, cafeName
    }));

    showAlert('registerAlert', 'Registration successful! Please login.', 'success');
    setTimeout(showLogin, 1500);
}

// Login
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        showAlert('loginAlert', 'Please fill all fields', 'error');
        return;
    }

    const userDataStr = localStorage.getItem(`user_${username}`);
    if (!userDataStr) {
        showAlert('loginAlert', 'Invalid username or password', 'error');
        return;
    }

    const userData = JSON.parse(userDataStr);
    if (userData.password !== password) {
        showAlert('loginAlert', 'Invalid username or password', 'error');
        return;
    }

    currentUser = username;
    localStorage.setItem('loggedInUser', username);
    document.getElementById('cafeNameDisplay').textContent = userData.cafeName;
    loadUserData();
    showMainApp();
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('loggedInUser');
    menuData = [];
    currentBillItems = [];
    pendingTableOrders = [];
    orderHistory = [];
    udhariData = [];
    expenseData = [];
    showLogin();
}

// Load User Data
function loadUserData() {
    const userDataStr = localStorage.getItem(`user_${currentUser}`);
    if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        document.getElementById('cafeNameDisplay').textContent = userData.cafeName;
    }

    const menuDataStr = localStorage.getItem(`menu_${currentUser}`);
    if (menuDataStr) menuData = JSON.parse(menuDataStr);

    const pendingOrdersStr = localStorage.getItem(`pending_${currentUser}`);
    if (pendingOrdersStr) pendingTableOrders = JSON.parse(pendingOrdersStr);

    const historyDataStr = localStorage.getItem(`history_${currentUser}`);
    if (historyDataStr) orderHistory = JSON.parse(historyDataStr);

    const udhariDataStr = localStorage.getItem(`udhari_${currentUser}`);
    if (udhariDataStr) udhariData = JSON.parse(udhariDataStr);

    const expenseDataStr = localStorage.getItem(`expenses_${currentUser}`);
    if (expenseDataStr) expenseData = JSON.parse(expenseDataStr);
}

// Save functions
function saveMenuData() {
    localStorage.setItem(`menu_${currentUser}`, JSON.stringify(menuData));
}

function savePendingOrders() {
    localStorage.setItem(`pending_${currentUser}`, JSON.stringify(pendingTableOrders));
}

function saveOrderHistory() {
    localStorage.setItem(`history_${currentUser}`, JSON.stringify(orderHistory));
}

function saveUdhariData() {
    localStorage.setItem(`udhari_${currentUser}`, JSON.stringify(udhariData));
}

function saveExpenseData() {
    localStorage.setItem(`expenses_${currentUser}`, JSON.stringify(expenseData));
}

// Show Alert
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => alertDiv.innerHTML = '', 3000);
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'billing') {
        updateAvailableItems();
        updateCurrentBill();
    } else if (tabName === 'pendingOrders') {
        updatePendingOrders();
    } else if (tabName === 'history') {
        updateHistory();
    } else if (tabName === 'udhari') {
        updateUdhariDisplay();
    } else if (tabName === 'expenses') {
        updateExpenseDisplay();
        updateTodayExpenseSummary();
    }
}

// Menu Management
function addMainItem() {
    const name = document.getElementById('mainItemName').value.trim();
    if (!name) {
        showToast('Please enter a main item name', 'error');
        return;
    }

    menuData.push({
        id: Date.now(),
        name: name,
        subItems: []
    });

    document.getElementById('mainItemName').value = '';
    saveMenuData();
    updateMenuList();
    updateMainItemSelect();
    updateAvailableItems();
    showToast('Main item added successfully');
}

function addSubItem() {
    const mainItemId = parseInt(document.getElementById('mainItemSelect').value);
    const name = document.getElementById('subItemName').value.trim();
    const price = parseFloat(document.getElementById('subItemPrice').value);

    if (!mainItemId || !name || !price) {
        showToast('Please fill all fields', 'error');
        return;
    }

    const mainItem = menuData.find(item => item.id === mainItemId);
    if (mainItem) {
        mainItem.subItems.push({
            id: Date.now(),
            name: name,
            price: price
        });
    }

    document.getElementById('subItemName').value = '';
    document.getElementById('subItemPrice').value = '';
    saveMenuData();
    updateMenuList();
    updateAvailableItems();
    showToast('Sub item added successfully');
}

function updateMainItemSelect() {
    const select = document.getElementById('mainItemSelect');
    select.innerHTML = '<option value="">Select Main Item</option>';
    menuData.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item.name}</option>`;
    });
}

function updateMenuList() {
    const list = document.getElementById('menuList');
    if (menuData.length === 0) {
        list.innerHTML = '<p style="color: #666;">No items added yet</p>';
        return;
    }

    list.innerHTML = menuData.map(mainItem => `
        <div class="menu-item">
            <h3>
                <span>${mainItem.name}</span>
                <button class="btn btn-danger btn-small" onclick="deleteMainItem(${mainItem.id})">Delete</button>
            </h3>
            ${mainItem.subItems.map(subItem => `
                <div class="sub-item">
                    <span>${subItem.name} – ₹${subItem.price}</span>
                    <button class="btn btn-danger btn-small" onclick="deleteSubItem(${mainItem.id}, ${subItem.id})">Delete</button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function updateAvailableItems() {
    const container = document.getElementById('availableItems');
    if (menuData.length === 0) {
        container.innerHTML = '<p style="color:#666;">No items available</p>';
        return;
    }

    container.innerHTML = menuData.map(mainItem => `
        <div class="category-block">
            <h3>${mainItem.name}</h3>
            <div class="item-grid">
                ${mainItem.subItems.map(sub => `
                    <div class="item-tile" onclick="addToBill(${mainItem.id}, ${sub.id})">
                        <div class="item-name">${sub.name}</div>
                        <div class="item-price">₹${sub.price}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function deleteMainItem(mainItemId) {
    if (!confirm("Delete this main item and all its sub items?")) return;
    menuData = menuData.filter(item => item.id !== mainItemId);
    saveMenuData();
    updateMenuList();
    updateMainItemSelect();
    updateAvailableItems();
    showToast("Main item deleted");
}

function deleteSubItem(mainItemId, subItemId) {
    if (!confirm("Delete this sub item?")) return;
    const mainItem = menuData.find(item => item.id === mainItemId);
    if (!mainItem) return;
    mainItem.subItems = mainItem.subItems.filter(sub => sub.id !== subItemId);
    saveMenuData();
    updateMenuList();
    updateAvailableItems();
    showToast("Sub item deleted");
}

// Billing - Adding items to current order
function addToBill(mainItemId, subItemId) {
    const mainItem = menuData.find(item => item.id === mainItemId);
    const subItem = mainItem.subItems.find(item => item.id === subItemId);

    const existingItem = currentBillItems.find(item => item.id === subItemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        currentBillItems.push({
            id: subItemId,
            name: subItem.name,
            price: subItem.price,
            quantity: 1
        });
    }
    updateCurrentBill();
}

function updateQuantity(itemId, change) {
    const item = currentBillItems.find(item => item.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            currentBillItems = currentBillItems.filter(item => item.id !== itemId);
        }
    }
    updateCurrentBill();
}

function removeFromBill(itemId) {
    currentBillItems = currentBillItems.filter(item => item.id !== itemId);
    updateCurrentBill();
}

function updateCurrentBill() {
    const container = document.getElementById('currentBill');
    const totalContainer = document.getElementById('billTotal');
    const saveBtn = document.getElementById('saveOrderBtn');

    if (currentBillItems.length === 0) {
        container.innerHTML = '<p style="color: #666;">No items in order</p>';
        totalContainer.innerHTML = '<h3>Total: ₹0</h3>';
        if (saveBtn) saveBtn.innerHTML = '💾 Save Order';
        return;
    }

    let total = 0;
    const editingBadge = isEditingOrder ? '<div style="background: #ffc107; color: #333; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-bottom: 15px; font-weight: 600;">✏️ Editing Order</div>' : '';

    if (saveBtn) {
        saveBtn.innerHTML = isEditingOrder ? '✅ Update Order' : '💾 Save Order';
    }

    container.innerHTML = editingBadge + currentBillItems.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="bill-item">
                <div>
                    <div style="font-weight: 600;">${item.name}</div>
                    <div style="color: #666;">₹${item.price} × ${item.quantity} = ₹${itemTotal}</div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="removeFromBill(${item.id})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    totalContainer.innerHTML = `<h3>Total: ₹${total}</h3>`;
}

// Save Order to Pending - TABLE NUMBER IS NOW OPTIONAL
function saveOrder() {
    if (currentBillItems.length === 0) {
        showToast('Please add items to the order', 'error');
        return;
    }

    let tableNumber = document.getElementById('tableNumber').value.trim();

    // If no table number provided, generate one automatically
    if (!tableNumber) {
        const orderCount = pendingTableOrders.length + 1;
        tableNumber = `Order-${orderCount}`;
    }

    // Check if table number already exists (but allow if we're editing)
    const existingOrder = pendingTableOrders.find(o => o.tableNumber === tableNumber);
    if (existingOrder && (!isEditingOrder || existingOrder.id !== editingOrderId)) {
        showToast('This table/order number already exists. Please use a different one.', 'error');
        return;
    }

    const total = currentBillItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (isEditingOrder) {
        // Update existing order
        const orderIndex = pendingTableOrders.findIndex(o => o.id === editingOrderId);
        if (orderIndex !== -1) {
            pendingTableOrders[orderIndex] = {
                ...pendingTableOrders[orderIndex],
                tableNumber: tableNumber,
                items: [...currentBillItems],
                total: total,
                savedAt: new Date().toLocaleString()
            };
        }
        showToast('Order updated successfully');
        isEditingOrder = false;
        editingOrderId = null;
    } else {
        // Create new order
        const order = {
            id: Date.now(),
            tableNumber: tableNumber,
            items: [...currentBillItems],
            total: total,
            savedAt: new Date().toLocaleString()
        };
        pendingTableOrders.push(order);
        showToast('Order saved as ' + tableNumber);
    }

    savePendingOrders();

    currentBillItems = [];
    document.getElementById('tableNumber').value = '';
    updateCurrentBill();
}

function clearCurrentOrder() {
    if (currentBillItems.length === 0) return;
    if (confirm('Clear current order?')) {
        currentBillItems = [];
        document.getElementById('tableNumber').value = '';
        isEditingOrder = false;
        editingOrderId = null;
        updateCurrentBill();
        showToast('Order cleared');
    }
}

// Edit Pending Order - NEW FUNCTION
function editPendingOrder(orderId) {
    const order = pendingTableOrders.find(o => o.id === orderId);
    if (!order) return;

    // Load order into current bill
    currentBillItems = [...order.items];
    document.getElementById('tableNumber').value = order.tableNumber;
    isEditingOrder = true;
    editingOrderId = orderId;

    // Switch to billing tab
    switchTab('billing');

    updateCurrentBill();
    showToast('Order loaded for editing', 'warning');
}

// Pending Orders Management
function updatePendingOrders() {
    const container = document.getElementById('pendingOrdersList');

    if (pendingTableOrders.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No pending orders</p>';
        document.getElementById('selectedOrderDetails').innerHTML = '<p style="color: #666;">Select an order to complete billing</p>';
        document.getElementById('paymentSection').classList.add('hidden');
        return;
    }

    container.innerHTML = pendingTableOrders.map(order => `
        <div class="table-order-card ${selectedPendingOrder && selectedPendingOrder.id === order.id ? 'selected-order' : ''}" 
             onclick="selectPendingOrder(${order.id})">
            <div class="table-header">
                <div class="table-number">🍽️ ${order.tableNumber}</div>
                <div style="color: #764ba2; font-weight: bold;">₹${order.total}</div>
            </div>
            <div style="font-size: 0.85em; color: #666; margin: 5px 0;">
                Saved: ${order.savedAt}
            </div>
            <div class="history-items">
                ${order.items.map(item => `
                    <div>${item.name} × ${item.quantity} = ₹${item.price * item.quantity}</div>
                `).join('')}
            </div>
            <div style="margin-top: 10px; display: flex; gap: 5px;">
                <button class="btn btn-primary btn-small" 
                        onclick="event.stopPropagation(); editPendingOrder(${order.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-danger btn-small" 
                        onclick="event.stopPropagation(); deletePendingOrder(${order.id})">
                    Delete Order
                </button>
            </div>
        </div>
    `).join('');
}

function selectPendingOrder(orderId) {
    selectedPendingOrder = pendingTableOrders.find(o => o.id === orderId);
    selectedPaymentMode = '';

    document.getElementById('udhariCustomerName').value = '';
    document.getElementById('udhariCustomerMobile').value = '';
    document.getElementById('udhariCustomerSection').classList.add('hidden');
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });

    updatePendingOrders();

    const detailsContainer = document.getElementById('selectedOrderDetails');
    detailsContainer.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <h3 style="color: #764ba2; margin-bottom: 10px;">🍽️ ${selectedPendingOrder.tableNumber}</h3>
            <div style="margin: 10px 0;">
                ${selectedPendingOrder.items.map(item => `
                    <div style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">
                        ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}
                    </div>
                `).join('')}
            </div>
            <div style="font-size: 1.3em; font-weight: bold; color: #764ba2; margin-top: 10px; text-align: right;">
                Total: ₹${selectedPendingOrder.total}
            </div>
        </div>
    `;

    document.getElementById('paymentSection').classList.remove('hidden');
}

function deletePendingOrder(orderId) {
    if (!confirm('Delete this pending order?')) return;

    pendingTableOrders = pendingTableOrders.filter(o => o.id !== orderId);
    savePendingOrders();

    if (selectedPendingOrder && selectedPendingOrder.id === orderId) {
        selectedPendingOrder = null;
        document.getElementById('selectedOrderDetails').innerHTML = '<p style="color: #666;">Select an order to complete billing</p>';
        document.getElementById('paymentSection').classList.add('hidden');
    }

    updatePendingOrders();
    showToast('Order deleted');
}

function selectPayment(mode) {
    selectedPaymentMode = mode;
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.target.closest('.payment-option').classList.add('selected');

    const udhariSection = document.getElementById('udhariCustomerSection');
    if (mode === 'Udhari') {
        udhariSection.classList.remove('hidden');
    } else {
        udhariSection.classList.add('hidden');
    }
}

// Complete Billing
function completeBilling() {
    if (!selectedPendingOrder) {
        showToast('Please select an order', 'error');
        return;
    }

    if (!selectedPaymentMode) {
        showToast('Please select a payment mode', 'error');
        return;
    }

    let customerName = '';
    let customerMobile = '';

    if (selectedPaymentMode === 'Udhari') {
        customerName = document.getElementById('udhariCustomerName').value.trim();
        if (!customerName) {
            showToast('Please enter customer name for Udhari', 'error');
            return;
        }
        customerMobile = document.getElementById('udhariCustomerMobile').value.trim();
    }

    const order = {
        id: Date.now(),
        tableNumber: selectedPendingOrder.tableNumber,
        date: new Date().toLocaleString(),
        items: [...selectedPendingOrder.items],
        total: selectedPendingOrder.total,
        paymentMode: selectedPaymentMode,
        customerName: customerName,
        customerMobile: customerMobile
    };

    orderHistory.push(order);
    saveOrderHistory();

    if (selectedPaymentMode === 'Udhari') {
        udhariData.push({
            id: Date.now(),
            orderId: order.id,
            customerName: customerName,
            customerMobile: customerMobile,
            amount: order.total,
            date: new Date().toISOString(),
            paid: false,
            items: [...order.items]
        });
        saveUdhariData();
    }

    pendingTableOrders = pendingTableOrders.filter(o => o.id !== selectedPendingOrder.id);
    savePendingOrders();

    selectedPendingOrder = null;
    selectedPaymentMode = '';
    document.getElementById('udhariCustomerName').value = '';
    document.getElementById('udhariCustomerMobile').value = '';
    document.getElementById('selectedOrderDetails').innerHTML = '<p style="color: #666;">Select an order to complete billing</p>';
    document.getElementById('paymentSection').classList.add('hidden');

    updatePendingOrders();
    showToast('Billing completed successfully!');
}

// Expenses Management
function addExpense() {
    const category = document.getElementById('expenseCategory').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value.trim();
    const date = document.getElementById('expenseDate').value;

    if (!category || !amount || !date) {
        showToast('Please fill required fields', 'error');
        return;
    }

    expenseData.push({
        id: Date.now(),
        category: category,
        amount: amount,
        description: description,
        date: date
    });

    document.getElementById('expenseCategory').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDescription').value = '';

    saveExpenseData();
    updateExpenseDisplay();
    updateTodayExpenseSummary();
    showToast('Expense added successfully');
}

function updateTodayExpenseSummary() {
    const today = new Date().toISOString().slice(0, 10);
    const todayExpenses = expenseData.filter(exp => exp.date === today);
    const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const container = document.getElementById('todayExpenseSummary');
    container.innerHTML = `
        <div class="expense-summary-card">
            <h3 style="margin-bottom: 15px; text-align: center;">Today's Expenses</h3>
            <div class="expense-summary-grid">
                <div class="expense-summary-item">
                    <div>Total Expenses</div>
                    <div class="expense-summary-value">₹${todayTotal}</div>
                </div>
                <div class="expense-summary-item">
                    <div>Number of Entries</div>
                    <div class="expense-summary-value">${todayExpenses.length}</div>
                </div>
            </div>
        </div>
    `;
}

function updateExpenseDisplay() {
    const selectedMonth = document.getElementById('expenseMonthFilter').value;
    const [year, month] = selectedMonth.split('-');

    const monthExpenses = expenseData.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getFullYear() === parseInt(year) &&
            (expDate.getMonth() + 1) === parseInt(month);
    });

    const container = document.getElementById('expenseList');

    if (monthExpenses.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No expenses for this month</p>';
        return;
    }

    const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    container.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #764ba2; margin-bottom: 10px;">${getMonthName(parseInt(month))} ${year} Summary</h3>
            <div style="font-size: 1.5em; font-weight: bold; color: #dc3545;">Total: ₹${monthTotal}</div>
            <div style="color: #666; margin-top: 5px;">${monthExpenses.length} expenses</div>
        </div>
        ${monthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(exp => `
            <div class="expense-item">
                <div class="expense-header">
                    <div class="expense-category">${exp.category}</div>
                    <div class="expense-amount">-₹${exp.amount}</div>
                </div>
                <div class="expense-details">
                    <div>Date: ${new Date(exp.date).toLocaleDateString()}</div>
                    ${exp.description ? `<div>Note: ${exp.description}</div>` : ''}
                </div>
                <button class="btn btn-danger btn-small" style="margin-top: 10px;" onclick="deleteExpense(${exp.id})">Delete</button>
            </div>
        `).join('')}
    `;
}

function deleteExpense(expenseId) {
    if (confirm('Delete this expense?')) {
        expenseData = expenseData.filter(exp => exp.id !== expenseId);
        saveExpenseData();
        updateExpenseDisplay();
        updateTodayExpenseSummary();
        showToast('Expense deleted');
    }
}

// PDF Generation
function generateBillPDF(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const userDataStr = localStorage.getItem(`user_${currentUser}`);
    const userData = JSON.parse(userDataStr);
    const cafeName = userData.cafeName;

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(cafeName, 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('BILL RECEIPT', 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Order #: ${order.id}`, 20, 40);
    doc.text(`Table: ${order.tableNumber}`, 20, 46);
    doc.text(`Date: ${order.date}`, 20, 52);
    doc.text(`Payment: ${order.paymentMode}`, 20, 58);

    if (order.customerName) {
        doc.text(`Customer: ${order.customerName}`, 20, 64);
        if (order.customerMobile) {
            doc.text(`Mobile: ${order.customerMobile}`, 20, 70);
        }
    }

    const yStart = order.customerName ? (order.customerMobile ? 76 : 70) : 64;
    doc.line(20, yStart, 190, yStart);

    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, yStart + 8);
    doc.text('Qty', 120, yStart + 8);
    doc.text('Price', 145, yStart + 8);
    doc.text('Total', 170, yStart + 8);

    doc.line(20, yStart + 10, 190, yStart + 10);

    doc.setFont(undefined, 'normal');
    let yPos = yStart + 18;
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        doc.text(item.name, 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(`Rs ${item.price}`, 145, yPos);
        doc.text(`Rs ${itemTotal}`, 170, yPos);
        yPos += 8;
    });

    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 145, yPos);
    doc.text(`Rs ${order.total}`, 170, yPos);

    yPos += 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your visit!', 105, yPos, { align: 'center' });

    doc.save(`Bill_${order.tableNumber}_${order.id}.pdf`);
}

function generateMonthlyUdhariPDF(customerName, customerMobile, monthYear) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const [year, month] = monthYear.split('-');

    const customerUdhari = udhariData.filter(item => {
        const itemDate = new Date(item.date);
        return item.customerName === customerName &&
            itemDate.getFullYear() === parseInt(year) &&
            (itemDate.getMonth() + 1) === parseInt(month);
    });

    const userDataStr = localStorage.getItem(`user_${currentUser}`);
    const userData = JSON.parse(userDataStr);
    const cafeName = userData.cafeName;

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(cafeName, 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('MONTHLY UDHARI STATEMENT', 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Customer: ${customerName}`, 20, 40);
    if (customerMobile) {
        doc.text(`Mobile: ${customerMobile}`, 20, 46);
    }
    doc.text(`Month: ${getMonthName(parseInt(month))} ${year}`, 20, customerMobile ? 52 : 46);

    let yPos = customerMobile ? 60 : 54;

    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Date', 20, yPos);
    doc.text('Items', 60, yPos);
    doc.text('Amount', 170, yPos);

    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    let totalAmount = 0;

    customerUdhari.forEach(item => {
        const dateStr = new Date(item.date).toLocaleDateString();
        const itemsStr = item.items.map(i => `${i.name}(${i.quantity})`).join(', ');

        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(9);
        doc.text(dateStr, 20, yPos);

        const splitItems = doc.splitTextToSize(itemsStr, 100);
        doc.text(splitItems, 60, yPos);

        doc.text(`Rs ${item.amount}`, 170, yPos);

        totalAmount += item.amount;
        yPos += splitItems.length * 6 + 4;
    });

    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL AMOUNT:', 120, yPos);
    doc.text(`Rs ${totalAmount}`, 170, yPos);

    const allPaid = customerUdhari.every(item => item.paid);
    const paidAmount = customerUdhari.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const pendingAmount = totalAmount - paidAmount;

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Paid: Rs ${paidAmount}`, 120, yPos);
    yPos += 6;
    doc.setTextColor(allPaid ? 0 : 255, allPaid ? 128 : 0, 0);
    doc.text(`Pending: Rs ${pendingAmount}`, 120, yPos);
    doc.setTextColor(0, 0, 0);

    yPos += 15;
    doc.setFontSize(10);
    doc.text('Please clear the pending amount at your earliest convenience.', 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

    doc.save(`Udhari_${customerName.replace(/\s/g, '_')}_${getMonthName(parseInt(month))}_${year}.pdf`);
}

// History Display
function updateHistory() {
    const container = document.getElementById('historyList');
    if (orderHistory.length === 0) {
        container.innerHTML = '<p style="color: #666;">No orders yet</p>';
        return;
    }

    let totalCash = 0;
    let totalOnline = 0;
    let totalUdhari = 0;
    let cashCount = 0;
    let onlineCount = 0;
    let udhariCount = 0;

    orderHistory.forEach(order => {
        if (order.paymentMode === 'Cash') {
            totalCash += order.total;
            cashCount++;
        } else if (order.paymentMode === 'Online') {
            totalOnline += order.total;
            onlineCount++;
        } else if (order.paymentMode === 'Udhari') {
            totalUdhari += order.total;
            udhariCount++;
        }
    });

    const totalExpenses = expenseData.reduce((sum, exp) => sum + exp.amount, 0);
    const netCash = totalCash - totalExpenses;
    const grandTotal = totalCash + totalOnline;

    const summaryHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin-bottom: 25px;">
            <h3 style="margin-bottom: 20px; font-size: 1.5em; text-align: center;">Payment Summary</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold;">💵</div>
                    <div style="font-size: 0.9em; margin: 10px 0;">Cash Payments</div>
                    <div style="font-size: 1.8em; font-weight: bold;">₹${totalCash}</div>
                    <div style="font-size: 0.8em; opacity: 0.9; margin-top: 5px;">${cashCount} orders</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold;">💳</div>
                    <div style="font-size: 0.9em; margin: 10px 0;">Online Payments</div>
                    <div style="font-size: 1.8em; font-weight: bold;">₹${totalOnline}</div>
                    <div style="font-size: 0.8em; opacity: 0.9; margin-top: 5px;">${onlineCount} orders</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold;">📝</div>
                    <div style="font-size: 0.9em; margin: 10px 0;">Udhari (Pending)</div>
                    <div style="font-size: 1.8em; font-weight: bold;">₹${totalUdhari}</div>
                    <div style="font-size: 0.8em; opacity: 0.9; margin-top: 5px;">${udhariCount} orders</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.25); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold;">💸</div>
                    <div style="font-size: 0.9em; margin: 10px 0;">Total Expenses</div>
                    <div style="font-size: 1.8em; font-weight: bold;">₹${totalExpenses}</div>
                    <div style="font-size: 0.8em; opacity: 0.9; margin-top: 5px;">Deducted from cash</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.3); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold;">💰</div>
                    <div style="font-size: 0.9em; margin: 10px 0;">Net Cash</div>
                    <div style="font-size: 1.8em; font-weight: bold;">₹${netCash}</div>
                    <div style="font-size: 0.8em; opacity: 0.9; margin-top: 5px;">After expenses</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.35); padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold;">📊</div>
                    <div style="font-size: 0.9em; margin: 10px 0;">Total Revenue</div>
                    <div style="font-size: 1.8em; font-weight: bold;">₹${grandTotal}</div>
                    <div style="font-size: 0.8em; opacity: 0.9; margin-top: 5px;">Cash + Online only</div>
                </div>
            </div>
        </div>
    `;

    const ordersHTML = orderHistory.slice().reverse().map(order => {
        const pdfButton = (order.paymentMode === 'Cash' || order.paymentMode === 'Online')
            ? `<button class="btn btn-primary btn-small" onclick='generateBillPDF(${JSON.stringify(order).replace(/'/g, "\\'")}))'>📄 PDF</button>`
            : '';

        return `
            <div class="history-item">
                <div class="history-header">
                    <span>🍽️ ${order.tableNumber} - Order #${order.id}</span>
                    <span>${order.date}</span>
                </div>
                ${order.customerName ? `<div style="margin: 5px 0; color: #764ba2; font-weight: 600;">Customer: ${order.customerName}${order.customerMobile ? ` (${order.customerMobile})` : ''}</div>` : ''}
                <div class="history-items">
                    ${order.items.map(item => `
                        <div>${item.name} × ${item.quantity} = ₹${item.price * item.quantity}</div>
                    `).join('')}
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                    <span>Payment: ${order.paymentMode === 'Cash' ? '💵' : order.paymentMode === 'Online' ? '💳' : '📝'} ${order.paymentMode}</span>
                    <div>
                        <span style="color: #764ba2; margin-right: 10px;">Total: ₹${order.total}</span>
                        ${pdfButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = summaryHTML + '<h3 style="color: #764ba2; margin-bottom: 15px;">All Orders</h3>' + ordersHTML;
}

// Udhari Display
function updateUdhariDisplay() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const [year, month] = selectedMonth.split('-');

    const monthUdhari = udhariData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === parseInt(year) &&
            (itemDate.getMonth() + 1) === parseInt(month);
    });

    const customerGroups = {};
    monthUdhari.forEach(item => {
        if (!customerGroups[item.customerName]) {
            customerGroups[item.customerName] = {
                name: item.customerName,
                mobile: item.customerMobile,
                entries: [],
                total: 0,
                paid: 0,
                pending: 0
            };
        }
        customerGroups[item.customerName].entries.push(item);
        customerGroups[item.customerName].total += item.amount;
        if (item.paid) {
            customerGroups[item.customerName].paid += item.amount;
        } else {
            customerGroups[item.customerName].pending += item.amount;
        }
    });

    const totalUdhari = monthUdhari.reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = monthUdhari.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    const pendingAmount = totalUdhari - paidAmount;
    const customerCount = Object.keys(customerGroups).length;

    const summaryHTML = `
        <div class="month-summary">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">${getMonthName(parseInt(month))} ${year} - Udhari Summary</h3>
                ${monthUdhari.length > 0 ? `<button class="btn btn-danger" onclick="deleteMonthlyUdhari('${selectedMonth}')" style="padding: 8px 15px;">🗑️ Clear Monthly Udhari</button>` : ''}
            </div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div>Total Udhari</div>
                    <div class="summary-value">₹${totalUdhari}</div>
                    <div style="font-size: 0.8em; margin-top: 5px;">${monthUdhari.length} entries</div>
                </div>
                <div class="summary-item">
                    <div>Paid</div>
                    <div class="summary-value">₹${paidAmount}</div>
                </div>
                <div class="summary-item">
                    <div>Pending</div>
                    <div class="summary-value">₹${pendingAmount}</div>
                </div>
                <div class="summary-item">
                    <div>Customers</div>
                    <div class="summary-value">${customerCount}</div>
                </div>
            </div>
        </div>
    `;

    const listHTML = Object.keys(customerGroups).length === 0 ?
        '<p style="color: #666; text-align: center; margin-top: 20px;">No udhari entries for this month</p>' :
        Object.values(customerGroups).map(customer => `
            <div class="udhari-card">
                <div class="udhari-header">
                    <div>
                        <div class="udhari-customer">${customer.name}</div>
                        ${customer.mobile ? `<div style="font-size: 0.85em; color: #666;">${customer.mobile}</div>` : ''}
                        <div style="font-size: 0.85em; color: #666; margin-top: 5px;">${customer.entries.length} orders</div>
                    </div>
                    <div>
                        <div class="udhari-amount ${customer.pending === 0 ? 'udhari-paid' : ''}">₹${customer.total}</div>
                        <div style="font-size: 0.8em; text-align: right; margin-top: 5px;">
                            ${customer.pending > 0 ? `Pending: ₹${customer.pending}` : 'All Paid ✓'}
                        </div>
                    </div>
                </div>
                <div class="udhari-details">
                    ${customer.entries.map(item => `
                        <div style="margin: 8px 0; padding: 8px; background: white; border-radius: 5px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 0.85em;">${new Date(item.date).toLocaleDateString()}</span>
                                <span style="font-weight: 600; color: ${item.paid ? '#28a745' : '#dc3545'};">₹${item.amount} ${item.paid ? '✓' : '✗'}</span>
                            </div>
                            <div style="font-size: 0.85em; color: #666;">
                                ${item.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
                            </div>
                            <div style="margin-top: 5px; display: flex; gap: 5px;">
                                ${!item.paid ? `<button class="btn btn-success btn-small" onclick="markAsPaid(${item.id})">Mark as Paid</button>` : ''}
                                <button class="btn btn-danger btn-small" onclick="deleteSingleUdhari(${item.id})">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                    <div style="margin-top: 10px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-primary" onclick="generateMonthlyUdhariPDF('${customer.name}', '${customer.mobile || ''}', '${selectedMonth}')">📄 Download Monthly Bill</button>
                        <button class="btn btn-danger" onclick="deleteCustomerMonthlyUdhari('${customer.name}', '${selectedMonth}')">🗑️ Delete Customer</button>
                    </div>
                </div>
            </div>
        `).join('');

    document.getElementById('udhariSummary').innerHTML = summaryHTML;
    document.getElementById('udhariList').innerHTML = listHTML;
}

// Udhari Management Functions
function markAsPaid(udhariId) {
    const udhari = udhariData.find(item => item.id === udhariId);
    if (udhari) {
        udhari.paid = true;
        saveUdhariData();
        updateUdhariDisplay();
        showToast('Marked as paid');
    }
}

function deleteMonthlyUdhari(monthYear) {
    if (!confirm(`Delete ALL udhari entries for this month?`)) return;

    const [year, month] = monthYear.split('-');

    const udhariIdsToDelete = udhariData
        .filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === parseInt(year) &&
                (itemDate.getMonth() + 1) === parseInt(month);
        })
        .map(item => item.orderId);

    udhariData = udhariData.filter(item => {
        const itemDate = new Date(item.date);
        return !(itemDate.getFullYear() === parseInt(year) &&
            (itemDate.getMonth() + 1) === parseInt(month));
    });

    orderHistory = orderHistory.filter(order => !udhariIdsToDelete.includes(order.id));

    saveUdhariData();
    saveOrderHistory();
    updateUdhariDisplay();
    updateHistory();
    showToast('Monthly udhari deleted');
}

function deleteCustomerMonthlyUdhari(customerName, monthYear) {
    if (!confirm(`Delete all udhari for ${customerName}?`)) return;

    const [year, month] = monthYear.split('-');

    const udhariIdsToDelete = udhariData
        .filter(item => {
            const itemDate = new Date(item.date);
            const isTargetMonth = itemDate.getFullYear() === parseInt(year) &&
                (itemDate.getMonth() + 1) === parseInt(month);
            const isTargetCustomer = item.customerName === customerName;
            return isTargetMonth && isTargetCustomer;
        })
        .map(item => item.orderId);

    udhariData = udhariData.filter(item => {
        const itemDate = new Date(item.date);
        const isTargetMonth = itemDate.getFullYear() === parseInt(year) &&
            (itemDate.getMonth() + 1) === parseInt(month);
        const isTargetCustomer = item.customerName === customerName;

        return !(isTargetMonth && isTargetCustomer);
    });

    orderHistory = orderHistory.filter(order => !udhariIdsToDelete.includes(order.id));

    saveUdhariData();
    saveOrderHistory();
    updateUdhariDisplay();
    updateHistory();
    showToast('Customer data deleted');
}

function deleteSingleUdhari(udhariId) {
    if (!confirm('Delete this entry?')) return;

    const udhariEntry = udhariData.find(item => item.id === udhariId);
    const orderIdToDelete = udhariEntry ? udhariEntry.orderId : null;

    udhariData = udhariData.filter(item => item.id !== udhariId);

    if (orderIdToDelete) {
        orderHistory = orderHistory.filter(order => order.id !== orderIdToDelete);
    }

    saveUdhariData();
    saveOrderHistory();
    updateUdhariDisplay();
    updateHistory();
    showToast('Entry deleted');
}

// Helper Functions
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1];
}

// Initialize on load
init();