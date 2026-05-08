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

        document.querySelectorAll('[data-reveal]').forEach((element) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(24px)';
            element.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
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

    // Backend API base
    const storedApiBase = localStorage.getItem('API_BASE');
    const API_BASE = storedApiBase === 'http://localhost:3000'
        ? 'http://localhost:5000'
        : (storedApiBase || 'http://localhost:5000');

    // Auto-migrate old stored value
    if (storedApiBase === 'http://localhost:3000') {
        localStorage.setItem('API_BASE', 'http://localhost:5000');
    }

    if (!document.getElementById('dashboardToast')) {
        const toast = document.createElement('div');
        toast.id = 'dashboardToast';
        toast.className = 'toast dashboard-toast';
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }

    const dashboardToast = document.getElementById('dashboardToast');

    function showDashboardToast(message, type = 'info') {
        if (!dashboardToast) return;
        dashboardToast.textContent = message;
        dashboardToast.className = `toast dashboard-toast show ${type}`;

        window.clearTimeout(showDashboardToast._timer);
        showDashboardToast._timer = window.setTimeout(() => {
            dashboardToast.className = 'toast dashboard-toast';
        }, 2400);
    }

    function skeletonRow(width = '100%') {
        return `<div class="skeleton-row"><span class="skeleton-line" style="width:${width}"></span></div>`;
    }

    function setDashboardLoadingState(isLoading) {
        document.body.classList.toggle('dashboard-loading', isLoading);
        if (!isLoading) return;

        if (elements.paymentsContainer) elements.paymentsContainer.innerHTML = `${skeletonRow('72%')}${skeletonRow('88%')}${skeletonRow('64%')}${skeletonRow('80%')}`;
        if (elements.installmentsContainer) elements.installmentsContainer.innerHTML = `${skeletonRow('100%')}${skeletonRow('92%')}${skeletonRow('84%')}`;
        if (elements.transactionsContainer) elements.transactionsContainer.innerHTML = `<div class="skeleton-table">${skeletonRow('100%')}${skeletonRow('94%')}${skeletonRow('88%')}${skeletonRow('96%')}</div>`;
        if (elements.membersContainer) elements.membersContainer.innerHTML = `<div class="skeleton-table">${skeletonRow('100%')}${skeletonRow('90%')}${skeletonRow('96%')}${skeletonRow('84%')}</div>`;
        if (elements.expensesContainer) elements.expensesContainer.innerHTML = `${skeletonRow('96%')}${skeletonRow('86%')}${skeletonRow('92%')}`;
        if (elements.receiptVerificationContainer) elements.receiptVerificationContainer.innerHTML = `${skeletonRow('100%')}${skeletonRow('92%')}`;
        if (elements.memberExpensesContainer) elements.memberExpensesContainer.innerHTML = `${skeletonRow('100%')}${skeletonRow('84%')}${skeletonRow('90%')}`;
    }

    async function apiRequest(path, { method = 'GET', body = null, isForm = false } = {}) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }

        const headers = {
            Authorization: `Bearer ${token}`
        };
        if (body && !isForm) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body
                ? (isForm ? body : JSON.stringify(body))
                : undefined
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data && data.message ? data.message : 'Request failed';
            const err = new Error(msg);
            err.status = res.status;
            err.data = data;
            throw err;
        }

        return data;
    }

    function handleAuthFailure(err) {
        const code = err && err.data && err.data.code;
        if (code === 'PASSWORD_CHANGE_REQUIRED') {
            // User must change password before using the dashboard.
            window.location.href = 'login.html';
            return true;
        }

        if (err && (err.status === 401 || err.status === 403)) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
            return true;
        }

        return false;
    }

    // ===========================
    // LOAD USER DATA FROM LOCALSTORAGE
    // ===========================
    const token = localStorage.getItem('authToken');
    let currentUser = null;
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
    }

    // If not authenticated, redirect to login
    if (!token) {
        console.warn('No user found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    let userRole = (currentUser && currentUser.role) ? currentUser.role : 'member';
    console.log('Dashboard loaded (token present). Role:', userRole);

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

    const state = {
        user: {
            id: currentUser && currentUser.id ? currentUser.id : null,
            name: currentUser && currentUser.name ? currentUser.name : 'Member',
            email: currentUser && currentUser.email ? currentUser.email : '',
            role: userRole
        },
        users: [],
        memberFee: {
            totalFee: 0,
            paidAmount: 0,
            remainingAmount: 0,
            nextDueAmount: 0,
            progress: 0
        },
        installments: [],
        payments: [],
        members: [],
        expenses: [],
        finance: {
            totalIncome: 0,
            totalExpenses: 0,
            totalFunds: 0
        },
        paymentFlow: {
            qrScanned: false
        }
    };

    function normalizePaymentStatus(status) {
        if (status === 'approved') return 'verified';
        return status;
    }

    function isImagePath(p) {
        return typeof p === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(p);
    }

    function mapApiPayment(p) {
        const memberId = (p.member && (p.member._id || p.member.id)) ? String(p.member._id || p.member.id) : String(p.member);
        const receiptPath = p.receiptPath || '';
        const receiptPreview = receiptPath && isImagePath(receiptPath) ? `${API_BASE}${receiptPath}` : '';

        return {
            id: String(p._id || p.id),
            userId: memberId,
            amount: Number(p.amount) || 0,
            date: (p.submittedAt ? new Date(p.submittedAt) : new Date()).toISOString().slice(0, 10),
            status: normalizePaymentStatus(p.status),
            receiptName: p.receiptOriginalName || (receiptPath ? receiptPath.split('/').slice(-1)[0] : 'NA'),
            receiptPreview,
            receiptType: receiptPreview ? 'image' : 'file'
        };
    }

    function mapApiExpense(e) {
        return {
            title: e.title,
            amount: Number(e.amount) || 0,
            date: (e.date ? new Date(e.date) : new Date()).toISOString().slice(0, 10)
        };
    }

    async function refreshDashboardFromApi() {
        const data = await apiRequest('/dashboard/data');

        if (data && data.settings && Number.isFinite(Number(data.settings.memberTotalFee))) {
            state.memberFee.totalFee = Math.max(0, Number(data.settings.memberTotalFee));
        } else if (!state.memberFee.totalFee) {
            state.memberFee.totalFee = 13500;
        }

        if (data && data.user) {
            state.user = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role
            };
            userRole = state.user.role;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }

        state.expenses = Array.isArray(data.expenses) ? data.expenses.map(mapApiExpense) : [];

        if (userRole === 'admin') {
            const members = Array.isArray(data.members) ? data.members : [];
            state.users = [
                { id: state.user.id, name: state.user.name, email: state.user.email, role: 'admin' },
                ...members.map((m) => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    role: 'member',
                    status: m.status || (m.active ? 'active' : 'inactive'),
                    active: m.status ? m.status === 'active' : m.active !== false
                }))
            ];

            const payments = Array.isArray(data.payments) ? data.payments : [];
            state.payments = payments.map(mapApiPayment);

            // Build member balances based on approved payments
            const paidByMember = new Map();
            state.payments.forEach((p) => {
                if (p.status !== 'verified') return;
                const prev = paidByMember.get(p.userId) || 0;
                paidByMember.set(p.userId, prev + p.amount);
            });

            state.members = members.map((m) => {
                const paid = paidByMember.get(String(m.id)) || 0;
                const totalFee = state.memberFee.totalFee;
                const status = m.status || (m.active ? 'active' : 'inactive');
                return {
                    id: String(m.id),
                    name: m.name,
                    status,
                    active: status === 'active',
                    paid,
                    remaining: Math.max(0, totalFee - paid)
                };
            });

            const summary = data.summary || {};
            state.finance.totalIncome = Number(summary.paymentsApprovedTotal) || 0;
            state.finance.totalExpenses = Number(summary.expensesTotal) || 0;
            state.finance.totalFunds = Number(summary.balance) || 0;
        } else {
            state.users = [{ id: state.user.id, name: state.user.name, email: state.user.email, role: 'member' }];

            const payments = Array.isArray(data.payments) ? data.payments : [];
            state.payments = payments.map(mapApiPayment);

            const approvedTotal = state.payments
                .filter((p) => p.status === 'verified')
                .reduce((sum, p) => sum + p.amount, 0);

            state.memberFee.paidAmount = approvedTotal;
            state.memberFee.remainingAmount = Math.max(0, state.memberFee.totalFee - approvedTotal);
            state.memberFee.nextDueAmount = state.memberFee.remainingAmount > 5000 ? 5000 : state.memberFee.remainingAmount;
            state.memberFee.progress = state.memberFee.totalFee
                ? Math.round((approvedTotal / state.memberFee.totalFee) * 100)
                : 0;
            state.installments = getInstallmentsFromPaidAmount(approvedTotal, state.memberFee.totalFee);
        }

        if (userRole === 'member') {
            // Ensure member record exists for fee rendering
            state.members = [{
                id: String(state.user.id),
                name: state.user.name,
                status: 'active',
                active: true,
                paid: state.memberFee.paidAmount,
                remaining: state.memberFee.remainingAmount
            }];
        }
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('[data-count-to]').forEach((counter) => {
            const target = Number(counter.getAttribute('data-count-to') || '0');
            const duration = 1200;
            const start = performance.now();

            const step = (now) => {
                const progress = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = `${Math.round(target * eased)}+`;

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };

            requestAnimationFrame(step);
        });
    }

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
        expenseDate: document.getElementById('expenseDate'),

        totalFeeLabel: document.getElementById('totalFeeLabel'),

        // Admin member management
        addMemberForm: document.getElementById('addMemberForm'),
        addMemberName: document.getElementById('addMemberName'),
        addMemberEmail: document.getElementById('addMemberEmail'),
        addMemberTempPassword: document.getElementById('addMemberTempPassword')
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

    function getInstallmentsFromPaidAmount(paidAmount, totalFee) {
        const safeTotal = Number.isFinite(Number(totalFee)) ? Math.max(0, Number(totalFee)) : 0;
        const firstAmount = Math.min(5000, safeTotal);
        const secondAmount = Math.min(5000, Math.max(0, safeTotal - firstAmount));
        const thirdAmount = Math.max(0, safeTotal - firstAmount - secondAmount);

        const firstPaid = firstAmount > 0 && paidAmount >= firstAmount;
        const secondPaid = secondAmount > 0 && paidAmount >= (firstAmount + secondAmount);
        const thirdPaid = thirdAmount > 0 && paidAmount >= safeTotal;

        return [
            { title: 'First installment', amount: firstAmount, status: firstPaid ? 'Paid' : 'Due', paid: firstPaid },
            { title: 'Second installment', amount: secondAmount, status: secondPaid ? 'Paid' : 'Due', paid: secondPaid },
            { title: 'Second year fee', amount: thirdAmount, status: thirdPaid ? 'Paid' : 'Due', paid: thirdPaid }
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
        state.memberFee.progress = state.memberFee.totalFee
            ? Math.round((memberRecord.paid / state.memberFee.totalFee) * 100)
            : 0;
        state.installments = getInstallmentsFromPaidAmount(memberRecord.paid, state.memberFee.totalFee);
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
        const memberOptions = state.users.filter((user) => user.role === 'member' && (user.status || (user.active ? 'active' : 'inactive')) === 'active');
        elements.adminPaymentMember.innerHTML = `
            <option value="">Select Member</option>
            ${memberOptions.map((member) => `<option value="${member.id}">${member.name}</option>`).join('')}
        `;
    }

    function formatMemberStatus(status) {
        const normalized = status || 'inactive';
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    function renderMemberPayments() {
        // Only show for members
        if (userRole !== 'member') return;

        if (elements.totalFeeLabel) {
            elements.totalFeeLabel.textContent = `Total fee: ${formatCurrency(state.memberFee.totalFee)}`;
        }

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

        const isAdmin = userRole === 'admin';

        elements.membersContainer.innerHTML = `
            <table class="transaction-table members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        ${isAdmin ? '<th>Status</th>' : ''}
                        <th>Paid Amount</th>
                        <th>Remaining Balance</th>
                        ${isAdmin ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${state.members.map((member) => `
                        <tr>
                            <td>${member.name}</td>
                            ${isAdmin ? `<td><span class="status-chip status-${member.status || 'inactive'}">${formatMemberStatus(member.status)}</span></td>` : ''}
                            <td>${formatCurrency(member.paid)}</td>
                            <td>${formatCurrency(member.remaining)}</td>
                            ${isAdmin ? `
                                <td>
                                    <button type="button" class="dashboard-button" data-member-action="reset" data-member-id="${member.id}">Reset Password</button>
                                    <button type="button" class="dashboard-button" data-member-action="deactivate" data-member-id="${member.id}" ${member.status === 'inactive' ? 'disabled' : ''}>Deactivate</button>
                                    <button type="button" class="dashboard-button" data-member-action="remove" data-member-id="${member.id}" ${member.status === 'removed' ? 'disabled' : ''}>Remove</button>
                                    <button type="button" class="dashboard-button" data-member-action="reactivate" data-member-id="${member.id}" ${member.status === 'active' ? 'disabled' : ''}>Reactivate</button>
                                </td>
                            ` : ''}
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
        return apiRequest('/payments/verify', {
            method: 'POST',
            body: { paymentId, action: 'approve' }
        }).then(async () => {
            await refreshDashboardFromApi();
            refreshCurrentMemberFeeState();
            renderMemberPayments();
            renderTransactions();
            renderMembers();
            renderExpenses();
            renderMemberExpenses();
            renderMemberReceiptStatus();
            renderVerificationQueue();
            renderFinance();
            showDashboardToast('Payment verified successfully.', 'success');
        }).catch((err) => {
            console.error('Verify payment failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to verify payment');
            }
        });
    }

    function rejectPayment(paymentId) {
        return apiRequest('/payments/verify', {
            method: 'POST',
            body: { paymentId, action: 'reject', rejectedReason: 'Rejected by admin' }
        }).then(async () => {
            await refreshDashboardFromApi();
            refreshCurrentMemberFeeState();
            renderMemberPayments();
            renderTransactions();
            renderMembers();
            renderMemberReceiptStatus();
            renderVerificationQueue();
            renderFinance();
            showDashboardToast('Payment rejected.', 'success');
        }).catch((err) => {
            console.error('Reject payment failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to reject payment');
            }
        });
    }

    function addAdminPayment(event) {
        event.preventDefault();

        const memberId = elements.adminPaymentMember?.value;
        const amount = Number(elements.adminPaymentAmount?.value);

        if (!memberId || !amount) {
            alert('Please fill in member and amount.');
            return;
        }

        apiRequest('/payments/add', {
            method: 'POST',
            body: { memberId, amount, isManual: true, notes: 'Manual payment (admin)' }
        }).then(async () => {
            if (elements.adminPaymentForm) {
                elements.adminPaymentForm.reset();
            }
            if (elements.adminReceiptPreview) {
                elements.adminReceiptPreview.innerHTML = '';
            }

            await refreshDashboardFromApi();
            renderTransactions();
            renderMembers();
            renderFinance();
            renderVerificationQueue();
            showDashboardToast('Payment added and approved.', 'success');
            alert('Payment added and auto-approved.');
        }).catch((err) => {
            console.error('Admin add payment failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to add payment');
            }
        });
    }

    function addExpense(event) {
        event.preventDefault();

        const title = elements.expenseTitle.value.trim();
        const amount = Number(elements.expenseAmount.value);
        const date = elements.expenseDate.value;

        if (!title || !amount || !date) {
            return;
        }

        apiRequest('/expenses/add', {
            method: 'POST',
            body: { title, amount, date }
        }).then(async () => {
            elements.expenseForm.reset();
            await refreshDashboardFromApi();
            renderExpenses();
            renderMemberExpenses();
            renderFinance();
            showDashboardToast('Expense added successfully.', 'success');
        }).catch((err) => {
            console.error('Add expense failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to add expense');
            }
        });
    }

    async function addMember(event) {
        event.preventDefault();

        const name = elements.addMemberName?.value?.trim();
        const email = elements.addMemberEmail?.value?.trim();
        const tempPassword = elements.addMemberTempPassword?.value?.trim();

        if (!name || !email) {
            alert('Please enter name and email');
            return;
        }

        try {
            const result = await apiRequest('/members/add', {
                method: 'POST',
                body: {
                    name,
                    email,
                    tempPassword: tempPassword || undefined
                }
            });

            if (elements.addMemberForm) {
                elements.addMemberForm.reset();
            }

            await refreshDashboardFromApi();
            populateAdminMemberSelect();
            renderMembers();
            showDashboardToast('Member created successfully.', 'success');

            const generatedPassword = result && result.tempPassword ? result.tempPassword : '(not returned)';
            alert(`Member created. Temporary password: ${generatedPassword}\n\nAsk the member to login and change it immediately.`);
        } catch (err) {
            console.error('Add member failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to add member');
            }
        }
    }

    async function deactivateMember(memberId) {
        try {
            await apiRequest('/members/deactivate', {
                method: 'POST',
                body: { memberId }
            });
            await refreshDashboardFromApi();
            populateAdminMemberSelect();
            renderMembers();
            showDashboardToast('Member deactivated.', 'success');
            alert('Member deactivated. They can no longer log in.');
        } catch (err) {
            console.error('Deactivate member failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to deactivate member');
            }
        }
    }

    async function removeMember(memberId) {
        try {
            await apiRequest('/members/remove', {
                method: 'POST',
                body: { memberId }
            });
            await refreshDashboardFromApi();
            populateAdminMemberSelect();
            renderMembers();
            showDashboardToast('Member removed.', 'success');
            alert('Member removed. Account remains in MongoDB for audit/history.');
        } catch (err) {
            console.error('Remove member failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to remove member');
            }
        }
    }

    async function reactivateMember(memberId) {
        try {
            await apiRequest('/members/reactivate', {
                method: 'POST',
                body: { memberId }
            });
            await refreshDashboardFromApi();
            populateAdminMemberSelect();
            renderMembers();
            showDashboardToast('Member reactivated.', 'success');
            alert('Member reactivated.');
        } catch (err) {
            console.error('Reactivate member failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to reactivate member');
            }
        }
    }

    async function resetMemberPassword(memberId) {
        try {
            const result = await apiRequest('/members/reset-password', {
                method: 'POST',
                body: { memberId }
            });
            const generatedPassword = result && result.tempPassword ? result.tempPassword : '(not returned)';
            showDashboardToast('Password reset completed.', 'success');
            alert(`Password reset. Temporary password: ${generatedPassword}\n\nMember must change password after login.`);
        } catch (err) {
            console.error('Reset password failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to reset password');
            }
        }
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
                localStorage.removeItem('authToken');
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

        if (elements.addMemberForm && userRole === 'admin') {
            elements.addMemberForm.addEventListener('submit', addMember);
        }

        if (elements.membersContainer && userRole === 'admin') {
            elements.membersContainer.addEventListener('click', (event) => {
                const button = event.target.closest('[data-member-action]');
                if (!button) return;

                const action = button.getAttribute('data-member-action');
                const memberId = button.getAttribute('data-member-id');
                if (!memberId) return;

                if (action === 'remove') {
                    removeMember(memberId);
                }

                if (action === 'deactivate') {
                    deactivateMember(memberId);
                }

                if (action === 'reactivate') {
                    reactivateMember(memberId);
                }

                if (action === 'reset') {
                    resetMemberPassword(memberId);
                }
            });
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
    // (Applied after first data load)

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


    async function init() {
        try {
            setDashboardLoadingState(true);
            await refreshDashboardFromApi();
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to load dashboard');
            }
            setDashboardLoadingState(false);
            return;
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
        setDashboardLoadingState(false);

        // Set the first visible section as active
        const firstVisibleSection = document.querySelector('[data-for-roles]:not([style*="display: none"])');
        if (firstVisibleSection && firstVisibleSection.hasAttribute('data-dashboard-section')) {
            document.querySelectorAll('[data-dashboard-section]').forEach(s => s.classList.remove('is-active'));
            firstVisibleSection.classList.add('is-active');
        }
    }

    // Override member receipt submit to call backend
    async function submitReceiptForVerification(file) {
        if (state.memberFee.remainingAmount <= 0) {
            alert('This member has no remaining balance.');
            return;
        }

        if (!file) {
            alert('Please attach your payment receipt before submitting.');
            return;
        }

        if (!state.paymentFlow.qrScanned) {
            alert('Please scan the QR and click "I Have Scanned QR" first.');
            return;
        }

        const paymentAmount = state.memberFee.nextDueAmount;
        const form = new FormData();
        form.append('amount', String(paymentAmount));
        form.append('notes', 'Receipt payment');
        form.append('receipt', file);

        try {
            await apiRequest('/payments/add', { method: 'POST', body: form, isForm: true });
            state.paymentFlow.qrScanned = false;
            await refreshDashboardFromApi();
            refreshCurrentMemberFeeState();
            renderMemberPayments();
            renderTransactions();
            renderMemberReceiptStatus();
            renderVerificationQueue();
            updatePaymentFlowUI();
            if (elements.paymentFlowMessage) {
                elements.paymentFlowMessage.textContent = `Payment submitted. Waiting for admin verification.`;
            }
            alert('Receipt uploaded successfully. Payment is pending admin verification.');
        } catch (err) {
            console.error('Submit payment failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to submit payment');
            }
        }
    }

    init();
}

renderDashboardApp();
