document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const logoIcon = document.querySelector('.logo-icon');
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('section');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (event) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#login') {
                return;
            }

            const target = document.querySelector(href);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    if (sections.length > 0) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.project-card, .team-member, .stat-card, .gallery-item').forEach((element) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });

        sections.forEach((section, index) => {
            section.style.animation = `fadeIn 0.8s ease-out ${index * 0.1}s`;
            section.style.animationFillMode = 'both';
        });

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (navbar) {
                navbar.style.boxShadow = scrollTop > 100 ? '0 4px 20px rgba(0, 212, 255, 0.15)' : '0 2px 10px rgba(0, 0, 0, 0.3)';
            }

            let current = '';
            sections.forEach((section) => {
                if (window.pageYOffset >= section.offsetTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach((link) => {
                if (link.getAttribute('href') === `#${current}`) {
                    link.style.color = 'var(--secondary-color)';
                } else if (!link.classList.contains('login-btn')) {
                    link.style.color = 'var(--text-secondary)';
                }
            });
        });
    }

    if (logoIcon) {
        logoIcon.addEventListener('mouseenter', () => {
            logoIcon.style.animation = 'none';
            setTimeout(() => {
                logoIcon.style.animation = 'float 3s ease-in-out infinite';
            }, 10);
        });
    }

    const utilityStyle = document.createElement('style');
    utilityStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(utilityStyle);

    console.log('%cWelcome to Texcelerators! 🚀', 'font-size: 16px; color: #00d4ff; font-weight: bold;');
    console.log('%cThis is a demo website built with HTML, CSS, and JavaScript', 'font-size: 12px; color: #b0b5c1;');
    console.log('%cBackend integration coming soon!', 'font-size: 12px; color: #0099ff;');
});

function formatCurrency(value) {
    return `₹${Number(value).toLocaleString('en-IN')}`;
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function createMetricCard(label, value, accentClass = '') {
    const card = document.createElement('div');
    card.className = `dashboard-stat-card glass-panel ${accentClass}`.trim();
    card.innerHTML = `
        <span class="dashboard-stat-label">${label}</span>
        <strong class="dashboard-stat-value">${value}</strong>
    `;
    return card;
}

function createInstallmentItem(title, amount, status, paid) {
    const item = document.createElement('div');
    item.className = `installment-item ${paid ? 'is-paid' : 'is-due'}`;
    item.innerHTML = `
        <div>
            <strong>${title}</strong>
            <span>${formatCurrency(amount)}</span>
        </div>
        <span class="status-pill ${paid ? 'paid' : 'pending'}">${status}</span>
    `;
    return item;
}

function createQrSvgData(text) {
    const size = 220;
    const cells = [
        [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1,0,1,1,0,0,1,1,1,0,1],
        [1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
        [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1],
        [0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,1,0],
        [1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,1],
        [0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0],
        [1,1,0,1,1,0,1,0,1,1,1,0,1,1,0,1,1],
        [1,0,1,0,0,1,0,1,0,0,0,1,0,0,1,0,1],
        [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1]
    ];

    const cellSize = size / cells.length;
    const rects = [];

    cells.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                rects.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" rx="2" />`);
            }
        });
    });

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
            <rect width="100%" height="100%" rx="24" fill="#ffffff" />
            <g fill="#0a0e27">${rects.join('')}</g>
            <rect x="18" y="18" width="52" height="52" rx="10" fill="none" stroke="#0a0e27" stroke-width="12" />
            <rect x="150" y="18" width="52" height="52" rx="10" fill="none" stroke="#0a0e27" stroke-width="12" />
            <rect x="18" y="150" width="52" height="52" rx="10" fill="none" stroke="#0a0e27" stroke-width="12" />
            <text x="50%" y="94%" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#0a0e27">${text}</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderDashboardApp() {
    const dashboardRoot = document.querySelector('[data-dashboard-root]');
    if (!dashboardRoot) {
        return;
    }

    // ===========================
    // LOAD USER DATA FROM LOCALSTORAGE
    // ===========================
    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
    }

    // If no user found, redirect to login
    if (!currentUser) {
        console.warn('No user found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    const userRole = currentUser.role;
    console.log('Dashboard loaded for:', currentUser.name, 'Role:', userRole);

    // ===========================
    // ROLE-BASED UI SETUP
    // ===========================
    function showRoleBasedUI() {
        // Hide/show sidebar links based on role
        document.querySelectorAll('[data-for-roles]').forEach((element) => {
            const allowedRoles = element.getAttribute('data-for-roles').split(',');
            if (allowedRoles.includes(userRole)) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });

        // Hide/show dashboard sections based on role
        document.querySelectorAll('[data-for-roles]').forEach((section) => {
            const allowedRoles = section.getAttribute('data-for-roles').split(',');
            if (allowedRoles.includes(userRole)) {
                section.style.display = '';
            } else {
                section.style.display = 'none';
            }
        });
    }

    const USERS_FALLBACK = [
        { id: 'u1', email: 'admin@texcelerators.com', password: 'admin123', name: 'Admin User', role: 'admin', year: '3rd', isFirstLogin: false },
        { id: 'u2', email: 'aarav@texcelerators.com', password: 'aarav@123', name: 'Aarav Sharma', role: 'member', year: '2nd', isFirstLogin: false },
        { id: 'u3', email: 'meera@texcelerators.com', password: 'meera@123', name: 'Meera Patel', role: 'member', year: '2nd', isFirstLogin: false },
        { id: 'u4', email: 'kabir@texcelerators.com', password: 'kabir@123', name: 'Kabir Singh', role: 'member', year: '1st', isFirstLogin: false },
        { id: 'u5', email: 'ananya@texcelerators.com', password: 'ananya@123', name: 'Ananya Roy', role: 'member', year: '3rd', isFirstLogin: false },
        { id: 'u6', email: 'rohan@texcelerators.com', password: 'rohan@123', name: 'Rohan Gupta', role: 'member', year: '1st', isFirstLogin: false },
        { id: 'u7', email: 'isha@texcelerators.com', password: 'isha@123', name: 'Isha Verma', role: 'member', year: '2nd', isFirstLogin: false }
    ];

    function getUsersDatabase() {
        const stored = localStorage.getItem('usersDatabase');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Failed to parse users database:', error);
            }
        }
        localStorage.setItem('usersDatabase', JSON.stringify(USERS_FALLBACK));
        return USERS_FALLBACK.slice();
    }

    function saveUsersDatabase(users) {
        localStorage.setItem('usersDatabase', JSON.stringify(users));
    }

    const usersDatabase = getUsersDatabase();

    const state = {
        user: { name: currentUser.name, email: currentUser.email, role: userRole },
        users: usersDatabase,
        memberFee: {
            totalFee: 13500,
            paidAmount: 8500,
            remainingAmount: 5000,
            nextDueAmount: 5000,
            progress: 63
        },
        installments: [
            { title: 'First installment', amount: 5000, status: 'Paid', paid: true },
            { title: 'Second installment', amount: 5000, status: 'Due', paid: false },
            { title: 'Second year fee', amount: 3500, status: 'Paid', paid: true }
        ],
        payments: [
            { id: 'p1', userId: 'u2', amount: 5000, date: '2026-04-02', status: 'verified', receiptName: 'aarav_apr_1.jpg', receiptPreview: '', receiptType: 'image' },
            { id: 'p2', userId: 'u2', amount: 3500, date: '2026-04-09', status: 'verified', receiptName: 'aarav_apr_2.jpg', receiptPreview: '', receiptType: 'image' },
            { id: 'p3', userId: 'u3', amount: 5000, date: '2026-04-11', status: 'verified', receiptName: 'meera_apr_1.jpg', receiptPreview: '', receiptType: 'image' },
            { id: 'p4', userId: 'u4', amount: 5000, date: '2026-04-16', status: 'verified', receiptName: 'kabir_apr_1.jpg', receiptPreview: '', receiptType: 'image' },
            { id: 'p5', userId: 'u5', amount: 3500, date: '2026-04-22', status: 'verified', receiptName: 'ananya_apr_1.jpg', receiptPreview: '', receiptType: 'image' }
        ],
        members: [
            { id: 'u2', name: 'Aarav Sharma', paid: 8500, remaining: 5000 },
            { id: 'u3', name: 'Meera Patel', paid: 13500, remaining: 0 },
            { id: 'u4', name: 'Kabir Singh', paid: 5000, remaining: 8500 },
            { id: 'u5', name: 'Ananya Roy', paid: 10000, remaining: 3500 },
            { id: 'u6', name: 'Rohan Gupta', paid: 13500, remaining: 0 },
            { id: 'u7', name: 'Isha Verma', paid: 3500, remaining: 10000 }
        ],
        expenses: [
            { title: 'Arduino Kit', amount: 3200, date: '2026-04-02' },
            { title: 'Sensors Pack', amount: 2400, date: '2026-04-10' },
            { title: 'Workshop Banner', amount: 1800, date: '2026-04-15' },
            { title: 'Competition Supplies', amount: 4200, date: '2026-04-21' }
        ],
        finance: {
            totalIncome: 58500,
            totalExpenses: 11600,
            totalFunds: 46900
        },
        paymentFlow: {
            qrScanned: false
        }
    };

    const elements = {
        topbarName: document.getElementById('topbarName'),
        topbarRole: document.getElementById('topbarRole'),
        welcomeName: document.getElementById('welcomeName'),
        welcomeRole: document.getElementById('welcomeRole'),
        paymentsContainer: document.getElementById('payments-container'),
        installmentsContainer: document.getElementById('installments-container'),
        amountToPay: document.getElementById('amountToPay'),
        qrCode: document.getElementById('qrCode'),
        receiptInput: document.getElementById('receiptInput'),
        memberReceiptStatus: document.getElementById('member-receipt-status'),
        transactionsContainer: document.getElementById('transactions-container'),
        memberExpensesContainer: document.getElementById('member-expenses-container'),
        membersContainer: document.getElementById('members-container'),
        expensesContainer: document.getElementById('expenses-container'),
        receiptVerificationContainer: document.getElementById('receipt-verification-container'),
        incomeBar: document.getElementById('incomeBar'),
        expenseBar: document.getElementById('expenseBar'),
        netBar: document.getElementById('netBar'),
        totalIncomeCard: document.getElementById('totalIncomeCard'),
        totalExpensesCard: document.getElementById('totalExpensesCard'),
        totalFundsCard: document.getElementById('totalFundsCard'),
        sidebarLinks: document.querySelectorAll('[data-sidebar-link]'),
        logoutButton: document.getElementById('logoutButton'),
        payNowButton: document.getElementById('payNowButton'),
        viewDetailsButton: document.getElementById('viewDetailsButton'),
        scanDoneButton: document.getElementById('scanDoneButton'),
        paidButton: document.getElementById('paidButton'),
        paymentFlowMessage: document.getElementById('paymentFlowMessage'),
        adminPaymentForm: document.getElementById('adminPaymentForm'),
        adminPaymentMember: document.getElementById('adminPaymentMember'),
        adminPaymentAmount: document.getElementById('adminPaymentAmount'),
        adminPaymentDate: document.getElementById('adminPaymentDate'),
        adminReceiptInput: document.getElementById('adminReceiptInput'),
        adminReceiptPreview: document.getElementById('adminReceiptPreview'),
        expenseForm: document.getElementById('expenseForm'),
        expenseTitle: document.getElementById('expenseTitle'),
        expenseAmount: document.getElementById('expenseAmount'),
        expenseDate: document.getElementById('expenseDate')
    };

    function updatePaymentFlowUI() {
        if (userRole !== 'member') return;

        const hasRemaining = state.memberFee.remainingAmount > 0;

        if (elements.scanDoneButton) {
            elements.scanDoneButton.disabled = !hasRemaining;
        }

        if (elements.paidButton) {
            elements.paidButton.disabled = !hasRemaining || !state.paymentFlow.qrScanned;
        }

        if (!elements.paymentFlowMessage) return;

        if (!hasRemaining) {
            elements.paymentFlowMessage.textContent = 'No pending amount. Payment already complete.';
            return;
        }

        if (!state.paymentFlow.qrScanned) {
            elements.paymentFlowMessage.textContent = 'Step 1: Scan QR, then click "I Have Scanned QR".';
            return;
        }

        elements.paymentFlowMessage.textContent = 'Step 2: Upload your receipt to confirm payment submission.';
    }

    function syncHeader() {
        if (elements.topbarName) elements.topbarName.textContent = state.user.name;
        if (elements.topbarRole) elements.topbarRole.textContent = state.user.role;
        if (elements.welcomeName) elements.welcomeName.textContent = state.user.name;
        if (elements.welcomeRole) elements.welcomeRole.textContent = state.user.role;
    }

    function getCurrentMemberRecord() {
        return state.members.find((member) => member.name === state.user.name) || null;
    }

    function getCurrentMemberId() {
        const currentUserRecord = state.users.find((user) => user.email === state.user.email);
        return currentUserRecord ? currentUserRecord.id : null;
    }

    function getInstallmentsFromPaidAmount(paidAmount) {
        const firstPaid = paidAmount >= 5000;
        const secondPaid = paidAmount >= 10000;
        const thirdPaid = paidAmount >= 13500;
        return [
            { title: 'First installment', amount: 5000, status: firstPaid ? 'Paid' : 'Due', paid: firstPaid },
            { title: 'Second installment', amount: 5000, status: secondPaid ? 'Paid' : 'Due', paid: secondPaid },
            { title: 'Second year fee', amount: 3500, status: thirdPaid ? 'Paid' : 'Due', paid: thirdPaid }
        ];
    }

    function refreshCurrentMemberFeeState() {
        const memberRecord = getCurrentMemberRecord();
        if (!memberRecord) {
            return;
        }

        state.memberFee.paidAmount = memberRecord.paid;
        state.memberFee.remainingAmount = memberRecord.remaining;
        state.memberFee.nextDueAmount = memberRecord.remaining > 5000 ? 5000 : memberRecord.remaining;
        state.memberFee.progress = Math.round((memberRecord.paid / state.memberFee.totalFee) * 100);
        state.installments = getInstallmentsFromPaidAmount(memberRecord.paid);
    }

    function getReceiptPreviewInfo(file) {
        if (!file) return { previewUrl: '', receiptType: 'file' };
        const isImage = file.type.startsWith('image/');
        return {
            previewUrl: isImage ? URL.createObjectURL(file) : '',
            receiptType: isImage ? 'image' : 'file'
        };
    }

    function updateAdminReceiptPreview(file) {
        if (!elements.adminReceiptPreview) return;
        if (!file) {
            elements.adminReceiptPreview.innerHTML = '';
            return;
        }

        const previewInfo = getReceiptPreviewInfo(file);
        elements.adminReceiptPreview.innerHTML = previewInfo.previewUrl
            ? `<img src="${previewInfo.previewUrl}" alt="Receipt preview" class="receipt-thumb-large">`
            : `<div class="receipt-file-name">${file.name}</div>`;
    }

    function populateAdminMemberSelect() {
        if (!elements.adminPaymentMember) return;
        const memberOptions = state.users.filter((user) => user.role === 'member');
        elements.adminPaymentMember.innerHTML = `
            <option value="">Select Member</option>
            ${memberOptions.map((member) => `<option value="${member.id}">${member.name}</option>`).join('')}
        `;
    }

    function renderMemberPayments() {
        // Only show for members
        if (userRole !== 'member') return;

        if (elements.paymentsContainer) {
            elements.paymentsContainer.innerHTML = '';
            [
                { label: 'Total Fee', value: formatCurrency(state.memberFee.totalFee), accent: 'accent-blue' },
                { label: 'Paid Amount', value: formatCurrency(state.memberFee.paidAmount), accent: 'accent-teal' },
                { label: 'Remaining Amount', value: formatCurrency(state.memberFee.remainingAmount), accent: 'accent-gold' },
                { label: 'Progress', value: `${state.memberFee.progress}%`, accent: 'accent-green' }
            ].forEach((metric) => {
                elements.paymentsContainer.appendChild(createMetricCard(metric.label, metric.value, metric.accent));
            });
        }

        if (elements.installmentsContainer) {
            elements.installmentsContainer.innerHTML = '';
            state.installments.forEach((installment) => {
                elements.installmentsContainer.appendChild(createInstallmentItem(installment.title, installment.amount, installment.status, installment.paid));
            });
        }

        if (elements.amountToPay) {
            elements.amountToPay.textContent = formatCurrency(state.memberFee.nextDueAmount);
        }

        const progressFill = document.getElementById('paymentProgress');
        if (progressFill) {
            progressFill.style.width = `${state.memberFee.progress}%`;
        }

        if (elements.qrCode) {
            elements.qrCode.innerHTML = `<img src="${createQrSvgData('₹' + state.memberFee.nextDueAmount)}" alt="Payment QR code">`;
        }

        updatePaymentFlowUI();
    }

    function renderTransactions() {
        if (!elements.transactionsContainer) return;

        const paymentRows = state.payments.map((payment) => {
            const paymentUser = state.users.find((user) => user.id === payment.userId);
            return {
                member: paymentUser ? paymentUser.name : 'Unknown Member',
                amount: payment.amount,
                date: payment.date,
                status: payment.status,
                receiptName: payment.receiptName,
                receiptPreview: payment.receiptPreview,
                receiptType: payment.receiptType
            };
        });

        let displayTransactions = paymentRows;
        if (userRole === 'member') {
            displayTransactions = paymentRows.filter((row) => row.member === state.user.name);
        }

        elements.transactionsContainer.innerHTML = `
            <table class="transaction-table">
                <thead>
                    <tr>
                        <th>Member Name</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Receipt</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayTransactions.map((transaction) => `
                        <tr>
                            <td>${transaction.member}</td>
                            <td>${formatCurrency(transaction.amount)}</td>
                            <td>${formatDate(transaction.date)}</td>
                            <td><span class="status-chip status-${transaction.status}">${transaction.status}</span></td>
                            <td>
                                <div class="receipt-cell">
                                    ${transaction.receiptPreview && transaction.receiptType === 'image'
                                        ? `<img src="${transaction.receiptPreview}" alt="Receipt" class="receipt-thumb">`
                                        : `<span class="receipt-file-name">${transaction.receiptName || 'NA'}</span>`
                                    }
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderMemberExpenses() {
        if (!elements.memberExpensesContainer) return;

        elements.memberExpensesContainer.innerHTML = state.expenses.map((expense) => `
            <div class="list-row">
                <div>
                    <strong>${expense.title}</strong>
                    <span>${formatDate(expense.date)}</span>
                </div>
                <div class="list-amount">${formatCurrency(expense.amount)}</div>
            </div>
        `).join('');
    }

    function renderMemberReceiptStatus() {
        if (!elements.memberReceiptStatus || userRole !== 'member') return;
        const memberId = getCurrentMemberId();
        if (!memberId) {
            elements.memberReceiptStatus.innerHTML = '';
            return;
        }

        const memberPayments = state.payments
            .filter((payment) => payment.userId === memberId)
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 4);

        if (memberPayments.length === 0) {
            elements.memberReceiptStatus.innerHTML = '<div class="receipt-empty">No receipt submitted yet.</div>';
            return;
        }

        elements.memberReceiptStatus.innerHTML = memberPayments.map((payment) => `
            <div class="receipt-row">
                <div>
                    <strong>${formatCurrency(payment.amount)}</strong>
                    <span>${formatDate(payment.date)} | ${payment.receiptName || 'NA'}</span>
                </div>
                <span class="status-chip status-${payment.status}">${payment.status}</span>
            </div>
        `).join('');
    }

    function renderVerificationQueue() {
        if (!elements.receiptVerificationContainer || userRole !== 'admin') return;
        const pendingPayments = state.payments.filter((payment) => payment.status === 'pending');

        if (pendingPayments.length === 0) {
            elements.receiptVerificationContainer.innerHTML = '<div class="receipt-empty">No pending payment receipts.</div>';
            return;
        }

        elements.receiptVerificationContainer.innerHTML = pendingPayments.map((payment) => {
            const member = state.users.find((user) => user.id === payment.userId);
            return `
                <div class="receipt-row receipt-admin-row">
                    <div>
                        <strong>${member ? member.name : 'Unknown Member'} | ${formatCurrency(payment.amount)}</strong>
                        <span>${formatDate(payment.date)} | ${payment.receiptName || 'NA'}</span>
                    </div>
                    <div class="receipt-actions">
                        <button type="button" class="dashboard-button primary verify-payment-btn" data-payment-id="${payment.id}">Verify</button>
                        <button type="button" class="dashboard-button reject-payment-btn" data-payment-id="${payment.id}">Reject</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderMembers() {
        if (!elements.membersContainer) return;

        elements.membersContainer.innerHTML = `
            <table class="transaction-table members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Paid Amount</th>
                        <th>Remaining Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.members.map((member) => `
                        <tr>
                            <td>${member.name}</td>
                            <td>${formatCurrency(member.paid)}</td>
                            <td>${formatCurrency(member.remaining)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderExpenses() {
        if (!elements.expensesContainer) return;

        elements.expensesContainer.innerHTML = state.expenses.map((expense) => `
            <div class="list-row">
                <div>
                    <strong>${expense.title}</strong>
                    <span>${formatDate(expense.date)}</span>
                </div>
                <div class="list-amount">${formatCurrency(expense.amount)}</div>
            </div>
        `).join('');
    }

    function renderFinance() {
        if (elements.totalIncomeCard) elements.totalIncomeCard.textContent = formatCurrency(state.finance.totalIncome);
        if (elements.totalExpensesCard) elements.totalExpensesCard.textContent = formatCurrency(state.finance.totalExpenses);
        if (elements.totalFundsCard) elements.totalFundsCard.textContent = formatCurrency(state.finance.totalFunds);

        if (elements.incomeBar) elements.incomeBar.style.width = `${Math.max(35, (state.finance.totalIncome / 70000) * 100)}%`;
        if (elements.expenseBar) elements.expenseBar.style.width = `${Math.max(20, (state.finance.totalExpenses / 25000) * 100)}%`;
        if (elements.netBar) elements.netBar.style.width = `${Math.max(25, (state.finance.totalFunds / 60000) * 100)}%`;
    }

    function submitReceiptForVerification(file) {
        if (state.memberFee.remainingAmount <= 0) {
            alert('This member has no remaining balance.');
            return;
        }

        if (!file) {
            alert('Please attach your payment receipt before submitting.');
            return;
        }

        const paymentAmount = state.memberFee.nextDueAmount;
        const paymentDate = new Date().toISOString().slice(0, 10);
        const memberId = getCurrentMemberId();

        if (!memberId) {
            alert('Unable to find member profile for this account.');
            return;
        }

        const previewInfo = getReceiptPreviewInfo(file);

        state.payments.unshift({
            id: `p${Date.now()}`,
            userId: memberId,
            amount: paymentAmount,
            date: paymentDate,
            status: 'pending',
            receiptName: file.name,
            receiptPreview: previewInfo.previewUrl,
            receiptType: previewInfo.receiptType
        });

        state.paymentFlow.qrScanned = false;

        renderTransactions();
        renderMemberReceiptStatus();
        renderVerificationQueue();
        updatePaymentFlowUI();
        if (elements.paymentFlowMessage) {
            elements.paymentFlowMessage.textContent = `Payment request submitted with receipt (${file.name}). Waiting for admin verification.`;
        }
        alert('Receipt uploaded successfully. Payment submission confirmed and pending admin verification.');
    }

    function verifyPayment(paymentId) {
        const payment = state.payments.find((item) => item.id === paymentId);
        if (!payment || payment.status !== 'pending') return;

        payment.status = 'verified';

        const memberUser = state.users.find((user) => user.id === payment.userId);
        if (memberUser) {
            state.members = state.members.map((member) => {
                if (member.id !== payment.userId) return member;
                return {
                    ...member,
                    paid: member.paid + payment.amount,
                    remaining: Math.max(0, member.remaining - payment.amount)
                };
            });

            if (memberUser.email === state.user.email) {
                refreshCurrentMemberFeeState();
                renderMemberPayments();
            }
        }

        state.finance.totalIncome += payment.amount;
        state.finance.totalFunds += payment.amount;

        renderTransactions();
        renderMembers();
        renderFinance();
        renderMemberReceiptStatus();
        renderVerificationQueue();
    }

    function rejectPayment(paymentId) {
        const payment = state.payments.find((item) => item.id === paymentId);
        if (!payment || payment.status !== 'pending') return;

        payment.status = 'rejected';
        renderTransactions();
        renderMemberReceiptStatus();
        renderVerificationQueue();
    }

    function addAdminPayment(event) {
        event.preventDefault();

        const memberId = elements.adminPaymentMember?.value;
        const amount = Number(elements.adminPaymentAmount?.value);
        const date = elements.adminPaymentDate?.value;
        const receiptFile = elements.adminReceiptInput?.files && elements.adminReceiptInput.files[0];

        if (!memberId || !amount || !date) {
            alert('Please fill in member, amount, and date.');
            return;
        }

        if (!receiptFile) {
            alert('Receipt is required for every payment.');
            return;
        }

        const previewInfo = getReceiptPreviewInfo(receiptFile);

        state.payments.unshift({
            id: `p${Date.now()}`,
            userId: memberId,
            amount,
            date,
            status: 'verified',
            receiptName: receiptFile.name,
            receiptPreview: previewInfo.previewUrl,
            receiptType: previewInfo.receiptType
        });

        state.members = state.members.map((member) => {
            if (member.id !== memberId) return member;
            return {
                ...member,
                paid: member.paid + amount,
                remaining: Math.max(0, member.remaining - amount)
            };
        });

        state.finance.totalIncome += amount;
        state.finance.totalFunds += amount;

        if (elements.adminPaymentForm) {
            elements.adminPaymentForm.reset();
        }
        if (elements.adminReceiptPreview) {
            elements.adminReceiptPreview.innerHTML = '';
        }

        renderTransactions();
        renderMembers();
        renderFinance();
        renderVerificationQueue();
        alert('Payment added and auto-approved.');
    }

    function addExpense(event) {
        event.preventDefault();

        const title = elements.expenseTitle.value.trim();
        const amount = Number(elements.expenseAmount.value);
        const date = elements.expenseDate.value;

        if (!title || !amount || !date) {
            return;
        }

        state.expenses.unshift({ title, amount, date });
        state.finance.totalExpenses += amount;
        state.finance.totalFunds -= amount;

        elements.expenseForm.reset();
        renderExpenses();
        renderMemberExpenses();
        renderFinance();
    }

    function bindSidebarNavigation() {
        elements.sidebarLinks.forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = link.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);

                if (!targetSection) return;

                document.querySelectorAll('[data-dashboard-section]').forEach((section) => {
                    section.classList.remove('is-active');
                });

                targetSection.classList.add('is-active');
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function bindActions() {
        if (elements.logoutButton) {
            elements.logoutButton.addEventListener('click', (event) => {
                event.preventDefault();
                // Clear user session
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }

        if (elements.payNowButton && userRole === 'member') {
            elements.payNowButton.addEventListener('click', () => {
                state.paymentFlow.qrScanned = false;
                updatePaymentFlowUI();
                document.getElementById('payment-qr')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        if (elements.viewDetailsButton && userRole === 'member') {
            elements.viewDetailsButton.addEventListener('click', () => {
                document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        if (elements.scanDoneButton && userRole === 'member') {
            elements.scanDoneButton.addEventListener('click', () => {
                if (state.memberFee.remainingAmount <= 0) {
                    alert('No pending amount to pay.');
                    return;
                }

                state.paymentFlow.qrScanned = true;
                updatePaymentFlowUI();
            });
        }

        if (elements.paidButton && userRole === 'member') {
            elements.paidButton.addEventListener('click', () => {
                if (!state.paymentFlow.qrScanned) {
                    alert('Please scan the QR and click "I Have Scanned QR" first.');
                    return;
                }
                elements.receiptInput?.click();
            });
        }

        if (elements.receiptInput && userRole === 'member') {
            elements.receiptInput.addEventListener('change', () => {
                const selectedFile = elements.receiptInput.files && elements.receiptInput.files[0];
                if (!selectedFile) return;
                submitReceiptForVerification(selectedFile);
                elements.receiptInput.value = '';
            });
        }

        if (elements.adminReceiptInput && userRole === 'admin') {
            elements.adminReceiptInput.addEventListener('change', () => {
                const selectedFile = elements.adminReceiptInput.files && elements.adminReceiptInput.files[0];
                updateAdminReceiptPreview(selectedFile || null);
            });
        }

        if (elements.adminPaymentForm && userRole === 'admin') {
            elements.adminPaymentForm.addEventListener('submit', addAdminPayment);
        }

        if (elements.expenseForm && userRole === 'admin') {
            elements.expenseForm.addEventListener('submit', addExpense);
        }

        if (elements.receiptVerificationContainer && userRole === 'admin') {
            elements.receiptVerificationContainer.addEventListener('click', (event) => {
                const verifyButton = event.target.closest('.verify-payment-btn');
                const rejectButton = event.target.closest('.reject-payment-btn');

                if (verifyButton) {
                    verifyPayment(verifyButton.getAttribute('data-payment-id'));
                }

                if (rejectButton) {
                    rejectPayment(rejectButton.getAttribute('data-payment-id'));
                }
            });
        }
    }

    // Apply role-based UI
    showRoleBasedUI();

    // Hide member-only buttons for admin
    if (userRole === 'admin') {
        if (elements.payNowButton) elements.payNowButton.style.display = 'none';
        if (elements.viewDetailsButton) elements.viewDetailsButton.style.display = 'none';
        if (elements.paidButton) elements.paidButton.style.display = 'none';
        if (elements.expenseForm) elements.expenseForm.style.display = '';
    } else if (userRole === 'member') {
        if (elements.payNowButton) elements.payNowButton.style.display = '';
        if (elements.viewDetailsButton) elements.viewDetailsButton.style.display = '';
        if (elements.paidButton) elements.paidButton.style.display = '';
        if (elements.expenseForm) elements.expenseForm.style.display = 'none';
    }

    refreshCurrentMemberFeeState();
    updatePaymentFlowUI();
    syncHeader();
    populateAdminMemberSelect();
    renderMemberPayments();
    renderTransactions();
    renderMembers();
    renderExpenses();
    renderMemberExpenses();
    renderMemberReceiptStatus();
    renderVerificationQueue();
    renderFinance();
    bindSidebarNavigation();
    bindActions();

    // Set the first visible section as active
    const firstVisibleSection = document.querySelector('[data-for-roles]:not([style*="display: none"])');
    if (firstVisibleSection && firstVisibleSection.hasAttribute('data-dashboard-section')) {
        document.querySelectorAll('[data-dashboard-section]').forEach(s => s.classList.remove('is-active'));
        firstVisibleSection.classList.add('is-active');
    }
}

renderDashboardApp();
