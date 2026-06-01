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

            if (href === '#robots-showcase') {
                event.preventDefault();
                if (window.openRobotShowcase) {
                    window.openRobotShowcase();
                }
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

        document.querySelectorAll('.project-card, .team-person-card, .mentor-spotlight-card, .team-member, .stat-card, .gallery-item').forEach((element) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });

        document.querySelectorAll('[data-reveal]').forEach((element) => {
            if (element.classList.contains('hero-slides') || element.classList.contains('hero-visual')) {
                element.style.opacity = '1';
                element.style.transform = 'none';
                observer.observe(element);
                return;
            }

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

    // ====== HERO CAROUSEL FUNCTIONALITY ======
    initializeHeroCarousel();
    initializeHeroMetrics();

    // ====== IMAGE LAZY LOADER (data-src -> src) ======
    initImageLazyLoad();
    // ====== LOGO PARTICLES + SUBTLE MOTION ======
    initializeLogoParticles();
    // ====== ROBOTS SHOWCASE + DETAILS MODAL ======
    initializeRobotShowcase();

    const utilityStyle = document.createElement('style');
        // ====== ROBOTS CAROUSEL (AUTO-SLIDING) ======
        initializeRobotsCarousel();
        // ====== ACHIEVEMENTS PREMIUM INTERACTIONS ======
        if (typeof initializeAchievements === 'function') {
            try { initializeAchievements(); } catch (e) { console.error('Achievements init error', e); }
        }
        // ====== TEAM SHOWCASE ======
        if (typeof initializeTeamShowcase === 'function') {
            try { initializeTeamShowcase(); } catch (e) { console.error('Team init error', e); }
        }
        // ====== COLLABORATION PORTAL ======
        if (typeof initializeCollaborationPortal === 'function') {
            try { initializeCollaborationPortal(); } catch (e) { console.error('Collaboration init error', e); }
        }
        // ====== PREMIUM RIPPLE FEEDBACK ======
        setupPremiumRipples();
    utilityStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(utilityStyle);

});

        /* =====================
           Dashboard UI helpers: currency formatting, counters, charts, activity
           These helpers are additive and preserve existing IDs and form behavior.
           They initialize lightweight charts (Chart.js must be loaded on the page).
        ===================== */

        const INR_NUMBER_FORMATTER = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        const EMPTY_VALUE = '\u2014';

        function formatINR(value) {
            const n = Number(value);
            if (!Number.isFinite(n)) return INR_NUMBER_FORMATTER.format(0);
            return INR_NUMBER_FORMATTER.format(n);
        }

        function getUserInitials(name) {
            const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
            if (parts.length === 0) return 'TX';
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }

        function getAvatarMarkup({ name, profilePic, imageClass, placeholderClass, alt }) {
            if (profilePic) {
                return `<img src="${profilePic}" alt="${alt || 'Profile photo'}" class="${imageClass}">`;
            }

            return `<div class="${placeholderClass}">${getUserInitials(name)}</div>`;
        }

        function animateINRCounter(el, target, duration = 900) {
            if (!el) return;
            const start = Number(el.dataset.start) || 0;
            const startTime = performance.now();
            const step = (now) => {
                const t = Math.min((now - startTime) / duration, 1);
                const current = Math.round(start + (target - start) * t);
                el.textContent = formatINR(current);
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        // Initialize charts with empty datasets and expose update functions
        const dashboardCharts = {
            incomeExpense: null,
            memberGrowth: null,
            verificationDonut: null,
        };

        function initDashboardCharts() {
            try {
                const incomeCtx = document.getElementById('incomeExpenseChart');
                const growthCtx = document.getElementById('memberGrowthChart');
                const donutCtx = document.getElementById('verificationDonutChart');

                if (incomeCtx) {
                    dashboardCharts.incomeExpense = new Chart(incomeCtx.getContext('2d'), {
                        type: 'line',
                        data: { labels: [], datasets: [
                            { label: 'Income', data: [], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.06)', tension: 0.3, pointRadius: 2 },
                            { label: 'Expenses', data: [], borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.04)', tension: 0.3, pointRadius: 2 }
                        ] },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    layout: { padding: { top: 10, right: 16, bottom: 4, left: 6 } },
                                    interaction: { mode: 'index', intersect: false },
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            align: 'end',
                                            labels: { color: 'rgba(255,255,255,0.9)', boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', padding: 18, font: { size: 12, weight: '600' } }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(7, 13, 30, 0.96)',
                                            borderColor: 'rgba(0,212,255,0.2)',
                                            borderWidth: 1,
                                            titleColor: '#fff',
                                            bodyColor: '#d7e8f1',
                                            padding: 12,
                                            displayColors: true,
                                            callbacks: {
                                                label: (context) => `${context.dataset.label}: ${formatINR(context.parsed.y)}`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                            ticks: {
                                                color: 'rgba(255,255,255,0.78)',
                                                maxRotation: 0,
                                                autoSkip: true,
                                                maxTicksLimit: 6,
                                                font: { size: 11, weight: '500' }
                                            }
                                        },
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: 'rgba(255,255,255,0.06)' },
                                            ticks: {
                                                color: 'rgba(255,255,255,0.82)',
                                                padding: 8,
                                                font: { size: 11, weight: '500' },
                                                callback: v => Number(v).toLocaleString('en-IN')
                                            }
                                        }
                                    }
                                }
                    });
                }

                if (growthCtx) {
                    dashboardCharts.memberGrowth = new Chart(growthCtx.getContext('2d'), {
                        type: 'bar',
                        data: { labels: [], datasets: [{ label: 'Members', data: [], backgroundColor: '#00d4ff' }] },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    layout: { padding: { top: 6, right: 10, bottom: 2, left: 4 } },
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: 'rgba(7, 13, 30, 0.96)',
                                            borderColor: 'rgba(0,212,255,0.2)',
                                            borderWidth: 1,
                                            titleColor: '#fff',
                                            bodyColor: '#d7e8f1',
                                            padding: 12,
                                            callbacks: {
                                                label: (context) => `Members: ${context.parsed.y}`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            grid: { display: false },
                                            ticks: {
                                                color: 'rgba(255,255,255,0.78)',
                                                maxRotation: 0,
                                                autoSkip: true,
                                                maxTicksLimit: 6,
                                                font: { size: 11, weight: '500' }
                                            }
                                        },
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: 'rgba(255,255,255,0.06)' },
                                            ticks: { color: 'rgba(255,255,255,0.82)', font: { size: 11, weight: '500' }, precision: 0 }
                                        }
                                    }
                                }
                    });
                }

                if (donutCtx) {
                    dashboardCharts.verificationDonut = new Chart(donutCtx.getContext('2d'), {
                        type: 'doughnut',
                        data: { labels: ['Verified', 'Pending', 'Rejected'], datasets: [{ data: [0,0,0], backgroundColor: ['#43e97b','#ffc43d','#ff6b6b'] }] },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: '68%',
                                    layout: { padding: { top: 8, right: 10, bottom: 0, left: 10 } },
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: { color: 'rgba(255,255,255,0.82)', boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11, weight: '600' } }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(7, 13, 30, 0.96)',
                                            borderColor: 'rgba(0,212,255,0.2)',
                                            borderWidth: 1,
                                            titleColor: '#fff',
                                            bodyColor: '#d7e8f1',
                                            padding: 12
                                        }
                                    }
                                }
                    });
                }
            } catch (e) { console.warn('Chart init failed', e); }
        }

        function updateIncomeExpenseChart(labels, incomeData, expenseData) {
            const c = dashboardCharts.incomeExpense;
            if (!c) return;
            c.data.labels = labels;
            c.data.datasets[0].data = incomeData;
            c.data.datasets[1].data = expenseData;
            c.update();
        }

        function updateMemberGrowthChart(labels, data) {
            const c = dashboardCharts.memberGrowth;
            if (!c) return;
            c.data.labels = labels;
            c.data.datasets[0].data = data;
            c.update();
        }

        function updateVerificationDonut(verified, pending, rejected) {
            const c = dashboardCharts.verificationDonut;
            if (!c) return;
            c.data.datasets[0].data = [verified, pending, rejected];
            c.update();
        }

        // Build analytics datasets from current `state` and update charts
        function buildAnalyticsFromState(rangeDays = 30) {
            const dashboardState = window.__dashboardState;
            if (!dashboardState) return;
            const now = new Date();

            // Helper: start date for range
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - (rangeDays - 1));

            // Determine daily or monthly aggregation
            const useMonthly = rangeDays > 90;

            const dateKey = (d) => {
                const dt = new Date(d);
                if (useMonthly) return dt.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short' });
            };

            // Build label slots
            const labels = [];
            const slotMap = new Map();

            if (useMonthly) {
                // months between startDate and now
                const s = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                const e = new Date(now.getFullYear(), now.getMonth(), 1);
                for (let d = new Date(s); d <= e; d.setMonth(d.getMonth() + 1)) {
                    const key = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                    labels.push(key);
                    slotMap.set(key, { income: 0, expense: 0, members: 0 });
                }
            } else {
                for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
                    const key = dateKey(d);
                    labels.push(key);
                    slotMap.set(key, { income: 0, expense: 0, members: 0 });
                }
            }

            // Aggregate payments (only verified â†’ income)
            (dashboardState.payments || []).forEach(p => {
                const dt = new Date(p.date);
                const key = dateKey(dt);
                if (!slotMap.has(key)) return;
                if (p.status === 'verified') slotMap.get(key).income += Number(p.amount) || 0;
            });

            // Aggregate expenses
            (dashboardState.expenses || []).forEach(e => {
                const dt = new Date(e.date);
                const key = dateKey(dt);
                if (!slotMap.has(key)) return;
                slotMap.get(key).expense += Number(e.amount) || 0;
            });

            // Member growth (new member creation date not present in members map reliably)
            // Use summary from state.users length change or fallback to zero
            // For admin, if data.members existed with createdAt, they would be used; fallback: place total members at last label
            const membersCount = (dashboardState.members || []).length;
            if (labels.length) {
                const last = labels[labels.length - 1];
                if (slotMap.has(last)) slotMap.get(last).members = membersCount;
            }

            // Build arrays
            const incomeData = labels.map(l => Math.round((slotMap.get(l) || {}).income || 0));
            const expenseData = labels.map(l => Math.round((slotMap.get(l) || {}).expense || 0));
            const memberData = labels.map(l => Math.round((slotMap.get(l) || {}).members || 0));

            // Verification donut: counts across payments
            const verified = (dashboardState.payments || []).filter(p => p.status === 'verified').length;
            const pending = (dashboardState.payments || []).filter(p => p.status === 'pending').length;
            const rejected = (dashboardState.payments || []).filter(p => p.status === 'rejected').length;

            // Update charts
            updateIncomeExpenseChart(labels, incomeData, expenseData);
            updateMemberGrowthChart(labels, memberData);
            updateVerificationDonut(verified, pending, rejected);

            // Update small stat cards where applicable
            const totalFundsEl = document.getElementById('totalFundsCard');
            if (totalFundsEl) totalFundsEl.textContent = formatINR(dashboardState.finance.totalFunds || 0);
            const totalExpensesEl = document.getElementById('totalExpensesCard');
            if (totalExpensesEl) totalExpensesEl.textContent = formatINR(dashboardState.finance.totalExpenses || 0);
            const activeMembersEl = document.getElementById('activeMembersCard');
            if (activeMembersEl) activeMembersEl.textContent = String((dashboardState.members || []).length || EMPTY_VALUE);
            const pendingEl = document.getElementById('pendingVerificationsCard');
            if (pendingEl) pendingEl.textContent = String(pending || EMPTY_VALUE);
        }

        // small helper to add items to the activity feed with micro-interaction
        function addActivityEntry({ icon='fa-info-circle', title='', meta='', ts='' }) {
            const container = document.getElementById('transactions-container');
            if (!container) return;
            const item = document.createElement('div');
            item.className = 'activity-item enter';
            item.innerHTML = `<div style="display:flex;gap:12px;align-items:center;"><i class="fas ${icon}" style="color:var(--secondary-color)"></i><div><div style="font-weight:700">${title}</div><div class="dashboard-subtle" style="font-size:0.85rem">${meta}</div></div></div><div class="dashboard-subtle">${ts}</div>`;
            container.prepend(item);
            // trim long lists
            while (container.children.length > 120) container.removeChild(container.lastChild);
        }

        // Wire quick-action buttons to focus forms without changing backend IDs
        document.addEventListener('DOMContentLoaded', () => {
            // ensure displayed currency uses INR formatting
            ['totalFundsCard','totalExpensesCard','amountToPay'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.textContent) {
                    // try parse numeric
                    const raw = el.textContent.replace(/[\u20B9,\s]/g, '');
                    const n = Number(raw);
                    if (!isNaN(n)) el.textContent = formatINR(n);
                }
            });

            // convert any dollar formatted text nodes to INR across dashboard (non-destructive)
            (function convertDollarNodes() {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                const dollarRegex = /\$\s?([0-9,]+(?:\.[0-9]+)?)/g;
                let node;
                const toUpdate = [];
                while (node = walker.nextNode()) {
                    if (!node.nodeValue) continue;
                    if (dollarRegex.test(node.nodeValue)) {
                        toUpdate.push(node);
                    }
                    dollarRegex.lastIndex = 0;
                }
                toUpdate.forEach(textNode => {
                    const newText = textNode.nodeValue.replace(dollarRegex, (_, num) => {
                        const n = Number(num.replace(/,/g, '')) || 0;
                        return formatINR(n);
                    });
                    textNode.nodeValue = newText;
                });
            })();

            // Observe DOM changes and convert any newly inserted dollar-formatted text to INR
            (function observeDollarRewrites() {
                const dollarRegex = /\$\s?([0-9,]+(?:\.[0-9]+)?)/g;
                const convertInNode = (node) => {
                    if (!node) return;
                    if (node.nodeType === Node.TEXT_NODE) {
                        if (dollarRegex.test(node.nodeValue)) {
                            node.nodeValue = node.nodeValue.replace(dollarRegex, (_, num) => {
                                const n = Number(num.replace(/,/g, '')) || 0;
                                return formatINR(n);
                            });
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        node.childNodes.forEach(convertInNode);
                    }
                };

                const mo = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.type === 'childList') {
                            m.addedNodes.forEach(convertInNode);
                        } else if (m.type === 'characterData') {
                            convertInNode(m.target);
                        }
                    }
                });

                mo.observe(document.body, { childList: true, subtree: true, characterData: true });
            })();

            // animated counters for metric cards
            document.querySelectorAll('.metric-value').forEach(el => {
                const v = el.textContent.replace(/[\u20B9,\s]/g,'');
                const n = Number(v) || 0;
                el.dataset.start = 0;
                if (['activeMembersCard', 'pendingVerificationsCard'].includes(el.id)) {
                    el.textContent = String(n);
                } else {
                    animateINRCounter(el, n, 900);
                }
            });

            // quick actions
            const openAddMember = document.getElementById('openAddMember');
            if (openAddMember) openAddMember.addEventListener('click', () => focusDashboardForm('members-section', '#addMemberName'));
            const openAddPayment = document.getElementById('openAddPayment');
            if (openAddPayment) openAddPayment.addEventListener('click', () => focusDashboardForm('admin', '#adminPaymentAmount'));
            const openAddExpense = document.getElementById('openAddExpense');
            if (openAddExpense) openAddExpense.addEventListener('click', () => focusDashboardForm('expenses-section', '#expenseTitle'));

            // demo: add a recent activity if empty (non-functional placeholder for visual polish only)
            const txContainer = document.getElementById('transactions-container');
            if (txContainer && txContainer.children.length === 0) {
                addActivityEntry({ icon: 'fa-plus-circle', title: 'Dashboard ready', meta: 'UI upgraded to premium command center', ts: new Date().toLocaleString() });
            }
        });

// ====== HERO CAROUSEL CODE ======
function initializeHeroCarousel() {
    const heroSlides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.querySelector('.hero-prev');
    const nextBtn = document.querySelector('.hero-next');

    if (!heroSlides.length) return;

    let currentIndex = 0;
    const totalSlides = heroSlides.length;
    const autoPlayInterval = 4000; // 4 seconds (changed from 5s per requirements)
    let autoPlayTimer = null;

    function showSlide(index) {
        // Remove active class from all slides
        heroSlides.forEach((slide) => {
            slide.classList.remove('active');
            slide.setAttribute('aria-hidden', 'true');
        });

        // Add active class to current slide
        heroSlides[index].classList.add('active');
        heroSlides[index].setAttribute('aria-hidden', 'false');
        currentIndex = index;
    }

    function nextSlide() {
        const nextIndex = (currentIndex + 1) % totalSlides;
        showSlide(nextIndex);
        resetAutoPlay();
    }

    function prevSlide() {
        const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        showSlide(prevIndex);
        resetAutoPlay();
    }

    function startAutoPlay() {
        autoPlayTimer = setInterval(() => {
            nextSlide();
        }, autoPlayInterval);
    }

    function resetAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
        }
        startAutoPlay();
    }

    // Event listeners for buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }

    // Pause on hover
    const heroContainer = document.querySelector('.hero');
    if (heroContainer) {
        heroContainer.addEventListener('mouseenter', () => {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
            }
        });

        heroContainer.addEventListener('mouseleave', () => {
            startAutoPlay();
        });
    }

    // Initialize: show first slide and start auto-play
    showSlide(0);
    startAutoPlay();
}

function initializeHeroMetrics() {
    const metrics = document.querySelectorAll('.hero-metric-number[data-count-to]');
    if (!metrics.length) return;

    const animateMetric = (element) => {
        const target = parseInt(element.getAttribute('data-count-to'), 10) || 0;
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const value = Math.round(target * (0.12 + (progress * 0.88)));
            element.textContent = String(progress >= 1 ? target : value);
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.querySelectorAll('.hero-metric-number[data-count-to]').forEach(animateMetric);
                obs.disconnect();
            });
        }, { threshold: 0.35 });

        const root = document.querySelector('.hero-cinematic .hero-metrics');
        if (root) observer.observe(root);
    } else {
        metrics.forEach(animateMetric);
    }
}

// Lazy-load images that use data-src attributes by swapping into src when visible
function initImageLazyLoad() {
    const lazyImgs = document.querySelectorAll('img[data-src]');
    if (!lazyImgs.length) return;

    const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            const real = img.getAttribute('data-src');
            if (real) {
                img.src = real;
                img.removeAttribute('data-src');
            }
            observer.unobserve(img);
        });
    }, { rootMargin: '200px' });

    // Observe all lazy images
    lazyImgs.forEach(img => imgObserver.observe(img));

    // Immediately load images that are already visible (above-the-fold)
    lazyImgs.forEach(img => {
        try {
            const rect = img.getBoundingClientRect();
            const inViewport = rect.top < (window.innerHeight || document.documentElement.clientHeight) + 200 && rect.bottom > -200;
            if (inViewport) {
                const real = img.getAttribute('data-src');
                if (real) {
                    img.src = real;
                    img.removeAttribute('data-src');
                    imgObserver.unobserve(img);
                }
            }
        } catch (e) {
            // ignore
        }
    });

    // Fallback: after a short delay, attempt to load any remaining lazy images
    window.setTimeout(() => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            const real = img.getAttribute('data-src');
            if (real) {
                img.src = real;
                img.removeAttribute('data-src');
            }
        });
    }, 700);
}

// Lightweight particles for logo showcase (subtle, performant)
function initializeLogoParticles() {
    const canvas = document.getElementById('logoParticles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, DPR = window.devicePixelRatio || 1;
    const particles = [];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(w * DPR);
        canvas.height = Math.floor(h * DPR);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function createParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * Math.min(w, h) * 0.18 + 6;
        const speed = 0.12 + Math.random() * 0.28;
        return {
            x: w / 2 + Math.cos(angle) * (Math.random() * 30),
            y: h / 2 + Math.sin(angle) * (Math.random() * 30),
            vx: Math.cos(angle) * speed * (0.4 + Math.random() * 0.8),
            vy: Math.sin(angle) * speed * (0.4 + Math.random() * 0.8),
            r: Math.random() * 2.2 + 0.6,
            life: 60 + Math.random() * 140,
            alpha: 0.08 + Math.random() * 0.18
        };
    }

    function tick() {
        ctx.clearRect(0, 0, w, h);
        // create a few particles gradually
        if (particles.length < 48 && Math.random() < 0.6) particles.push(createParticle());

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 1;
            p.alpha *= 0.9998;

            ctx.beginPath();
            ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', () => {
        // small debounce
        clearTimeout(initializeLogoParticles._rt);
        initializeLogoParticles._rt = setTimeout(resize, 120);
    });

    // initial setup
    resize();
    tick();
}

const ROBOT_SHOWCASE_DATA = [
    {
        id: 'robosoccer',
        name: 'RoboSoccer',
        index: '01',
        category: 'Competition Build',
        description: 'High-performance soccer robot engineered with precision drive control and tactical maneuvering capabilities for competitive matches.',
        competitionInfo: 'Competition Build',
        features: ['Precision Drive Control', 'Tactical Maneuvering', 'Competition Matchplay'],
        technologies: ['Precision Drive Control', 'Tactical Maneuvering', 'Competition Matchplay'],
        teamContribution: 'Presented as part of the Texcelerators competitive robotics workflow, combining design, fabrication, and match preparation.',
        achievements: [],
        heroImage: 'assets/images/images/HomePage/Robots/RoboSoccer.jpg',
        cardImage: 'assets/images/images/HomePage/Robots/RoboSoccer.jpg',
        gallery: [
            'assets/images/images/Robots/Story/Quark.jpg',
            'assets/images/images/HomePage/Robots/RoboSoccer.jpg',
            'assets/images/images/HomePage/Main SlideShow/Soldering.jpg'
        ]
    },
    {
        id: 'robosumo',
        name: 'RoboSumo',
        index: '02',
        category: 'Combat Platform',
        description: 'Championship sumo robot combining robust mechanical design with intelligent combat strategies for competitive dominance.',
        competitionInfo: 'Combat Platform',
        features: ['Robust Mechanical Design', 'Intelligent Combat Strategies', 'Competitive Dominance'],
        technologies: ['Robust Mechanical Design', 'Intelligent Combat Strategies', 'Competitive Dominance'],
        teamContribution: 'Built within the club\'s competition-focused robotics process, pairing mechanical strength with tactical decision-making.',
        achievements: [
            '3rd place in Robo Sumo (Quark 2025)'
        ],
        heroImage: 'assets/images/images/HomePage/Robots/RoboSumo.jpg',
        cardImage: 'assets/images/images/HomePage/Robots/RoboSumo.jpg',
        gallery: [
            'assets/images/images/Robots/Story/Sail.jpg',
            'assets/images/images/HomePage/Robots/RoboSumo.jpg',
            'assets/images/images/HomePage/Achivements/BITSG2025Win.jpg'
        ]
    },
    {
        id: 'roborace',
        name: 'RoboRace',
        index: '03',
        category: 'Rescue Platform',
        description: 'Compact search and rescue robot designed to navigate through debris with ease and speed.',
        competitionInfo: 'Rescue Platform',
        features: ['Search and Rescue', 'Debris Navigation', 'High Speed'],
        technologies: ['Search and Rescue', 'Debris Navigation', 'High Speed'],
        teamContribution: 'Developed by the Texcelerators team as a compact rescue-focused build for high-mobility challenges.',
        achievements: [],
        heroImage: 'assets/images/images/HomePage/Robots/Roborace.JPG',
        cardImage: 'assets/images/images/HomePage/Robots/Roborace.JPG',
        gallery: [
            'assets/images/images/Robots/Behind The Build/sketched.png',
            'assets/images/images/HomePage/Robots/Roborace.JPG',
            'assets/images/images/HomePage/Main SlideShow/IITB2024.JPG'
        ]
    },
    {
        id: 'rcboats',
        name: 'RC Boats',
        index: '04',
        category: 'Inspection Concept',
        description: 'Wall-climbing robot with biomimetic adhesion technology inspired by geckos for vertical infrastructure inspection.',
        competitionInfo: 'Inspection Concept',
        features: ['Biomimetic Adhesion', 'Vertical Inspection', 'Wall Climbing'],
        technologies: ['Biomimetic Adhesion', 'Vertical Inspection', 'Wall Climbing'],
        teamContribution: 'Shown as a club-built concept focused on vertical inspection and experimental adhesion mechanics.',
        achievements: [
            'RC Boats clean sweep (1st, 2nd, 3rd)',
            '5th place in RC Boat Race'
        ],
        heroImage: 'assets/images/images/Robots/Story/Acrylic.png',
        cardImage: 'assets/images/images/Robots/Story/Acrylic.png',
        gallery: [
            'assets/images/images/Robots/Story/Acrylic.png',
            'assets/images/images/HomePage/Achivements/IITB2023.jpg',
            'assets/images/images/HomePage/Achivements/IITB2024.jpg'
        ]
    },
    {
        id: 'fpvdrone',
        name: 'FPV Drone',
        index: '05',
        category: 'Aerial Platform',
        description: 'Advanced aerial robotics platform built for precision navigation, real-time surveillance, and immersive first-person flight control.',
        competitionInfo: 'Aerial Platform',
        features: ['FPV', 'Precision Navigation', 'Real-time Surveillance', 'First-person Flight Control'],
        technologies: ['FPV', 'Precision Navigation', 'Real-time Surveillance', 'First-person Flight Control'],
        teamContribution: 'Developed as part of the Texcelerators aerial robotics showcase with a focus on control and observation.',
        achievements: [],
        heroImage: 'assets/images/images/HomePage/Robots/Drone.jpg',
        cardImage: 'assets/images/images/HomePage/Robots/Drone.jpg',
        gallery: [
            'assets/images/images/Robots/Behind The Build/sketched.png',
            'assets/images/images/HomePage/Robots/Drone.jpg',
            'assets/images/images/HomePage/Main SlideShow/Soldering.jpg'
        ]
    },
    {
        id: 'airavat',
        name: 'Airavat',
        index: '06',
        category: 'Soccer Platform',
        description: 'Premium competition soccer robot with AI-powered ball tracking and precision kicking mechanisms.',
        competitionInfo: 'Soccer Platform',
        features: ['AI Ball Tracking', 'Precision Kicking', 'Competition Soccer'],
        technologies: ['AI Ball Tracking', 'Precision Kicking', 'Competition Soccer'],
        teamContribution: 'Presented as a Texcelerators soccer build that combines perception and actuation in a competition context.',
        achievements: [],
        heroImage: 'assets/images/images/HomePage/Main SlideShow/BITSGATE2025.JPG',
        cardImage: 'assets/images/images/HomePage/Main SlideShow/BITSGATE2025.JPG',
        gallery: [
            'assets/images/images/Robots/Story/Quark.jpg',
            'assets/images/images/HomePage/Main SlideShow/BITSGATE2025.JPG',
            'assets/images/images/HomePage/Achivements/IIITN2024.jpg'
        ]
    }
];

function initializeRobotShowcase() {
    const showcaseSection = document.getElementById('robots-showcase');
    const showcaseGrid = document.getElementById('robotsShowcaseGrid');
    const filterContainer = document.getElementById('robotsCategoryFilters');
    const searchInput = document.getElementById('robotSearchInput');
    const resultCount = document.getElementById('robotsResultCount');
    const exploreAllButton = document.getElementById('robotsExploreAll');
    const modal = document.getElementById('robotDetailModal');

    if (!showcaseSection || !showcaseGrid || !filterContainer || !searchInput || !resultCount || !modal) {
        return;
    }

    const categories = ['All', ...new Set(ROBOT_SHOWCASE_DATA.map((robot) => robot.category))];
    let activeCategory = 'All';
    let activeQuery = '';
    let lastTrigger = null;

    function buildFilterButtons() {
        filterContainer.innerHTML = categories.map((category) => `
            <button type="button" class="robot-filter-chip${category === activeCategory ? ' active' : ''}" data-category="${category}">${category}</button>
        `).join('');
    }

    function matchesFilter(robot) {
        const haystack = [robot.name, robot.category, robot.description, ...(robot.features || []), ...(robot.technologies || [])].join(' ').toLowerCase();
        const categoryMatch = activeCategory === 'All' || robot.category === activeCategory;
        const queryMatch = !activeQuery || haystack.includes(activeQuery);
        return categoryMatch && queryMatch;
    }

    function renderCards() {
        const robots = ROBOT_SHOWCASE_DATA.filter(matchesFilter);
        resultCount.textContent = `${robots.length} robot${robots.length === 1 ? '' : 's'}`;

        if (!robots.length) {
            showcaseGrid.innerHTML = `
                <div class="robots-empty-state">
                    <h3>No robots match the current filters.</h3>
                    <p>Adjust the category or search term to continue exploring the current portfolio.</p>
                </div>
            `;
            return;
        }

        showcaseGrid.innerHTML = robots.map((robot, index) => `
            <article class="robot-showcase-card" role="listitem" data-robot-id="${robot.id}" data-category="${robot.category}" data-search="${[robot.name, robot.category, robot.description, ...(robot.features || []), ...(robot.technologies || [])].join(' ').toLowerCase()}" style="--card-delay:${index * 80}ms;">
                <div class="robot-showcase-media">
                    <img loading="lazy" src="${robot.cardImage}" alt="${robot.name}">
                    <div class="robot-showcase-media-glow" aria-hidden="true"></div>
                    <div class="robot-showcase-index">${robot.index}</div>
                </div>
                <div class="robot-showcase-copy">
                    <div class="robot-topline">
                        <span class="robot-index">${robot.index}</span>
                        <span class="robot-status">${robot.category}</span>
                    </div>
                    <h3>${robot.name}</h3>
                    <p>${robot.description}</p>
                    <div class="robot-tags" aria-label="${robot.name} technologies">
                        ${robot.technologies.map((tag) => `<span class="tech-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="robot-actions">
                        <button class="btn robot-btn project-details" type="button">View Details</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function revealShowcaseSection() {
        if (!showcaseSection.hidden) {
            return;
        }

        showcaseSection.hidden = false;
        showcaseSection.classList.add('is-visible');

        window.requestAnimationFrame(() => {
            showcaseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function openRobotShowcase() {
        revealShowcaseSection();
        showcaseSection.hidden = false;
        showcaseSection.classList.add('is-visible');
        renderCards();
        buildFilterButtons();
    }

    window.openRobotShowcase = openRobotShowcase;

    function closeRobotModal() {
        if (modal.hidden) return;

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('robot-modal-open');

        window.setTimeout(() => {
            modal.hidden = true;
        }, 220);

        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
        }
    }

    function setModalGallery(robot, heroImage) {
        const galleryRoot = document.getElementById('robotModalGallery');
        if (!galleryRoot) return;

        galleryRoot.innerHTML = robot.gallery.map((src, index) => `
            <button type="button" class="robot-gallery-thumb${index === 0 ? ' active' : ''}" data-gallery-src="${src}" aria-label="${robot.name} gallery image ${index + 1}">
                <img src="${src}" alt="${robot.name} gallery image ${index + 1}">
            </button>
        `).join('');

        galleryRoot.querySelectorAll('.robot-gallery-thumb').forEach((thumb) => {
            thumb.addEventListener('click', () => {
                const src = thumb.getAttribute('data-gallery-src');
                if (!src) return;

                const hero = document.getElementById('robotModalHeroImage');
                if (hero) {
                    hero.src = src;
                }

                galleryRoot.querySelectorAll('.robot-gallery-thumb').forEach((button) => button.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        const hero = document.getElementById('robotModalHeroImage');
        if (hero) {
            hero.src = heroImage;
        }
    }

    function openRobotModal(robotId) {
        const robot = ROBOT_SHOWCASE_DATA.find((entry) => entry.id === robotId);
        if (!robot) return;

        lastTrigger = document.activeElement;

        const hero = document.getElementById('robotModalHeroImage');
        const kicker = document.getElementById('robotModalKicker');
        const title = document.getElementById('robotModalTitle');
        const description = document.getElementById('robotModalDescription');
        const competition = document.getElementById('robotModalCompetition');
        const features = document.getElementById('robotModalFeatures');
        const technologies = document.getElementById('robotModalTechnologies');
        const contribution = document.getElementById('robotModalContribution');
        const achievements = document.getElementById('robotModalAchievements');

        if (!hero || !kicker || !title || !description || !competition || !features || !technologies || !contribution || !achievements) {
            return;
        }

        kicker.textContent = robot.category;
        title.textContent = robot.name;
        description.textContent = robot.description;
        competition.textContent = robot.competitionInfo;
        contribution.textContent = robot.teamContribution;
        features.innerHTML = robot.features.map((item) => `<span class="tech-tag">${item}</span>`).join('');
        technologies.innerHTML = robot.technologies.map((item) => `<span class="tech-tag">${item}</span>`).join('');

        achievements.innerHTML = robot.achievements.length
            ? robot.achievements.map((item) => `<li>${item}</li>`).join('')
            : '<li>No robot-specific achievement is listed in the current project content.</li>';

        hero.alt = `${robot.name} hero image`;
        setModalGallery(robot, robot.heroImage || robot.cardImage);

        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('robot-modal-open');
        window.requestAnimationFrame(() => modal.classList.add('is-open'));
    }

    filterContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.robot-filter-chip');
        if (!button) return;

        activeCategory = button.getAttribute('data-category') || 'All';
        buildFilterButtons();
        renderCards();
    });

    searchInput.addEventListener('input', () => {
        activeQuery = searchInput.value.trim().toLowerCase();
        renderCards();
    });

    document.addEventListener('click', (event) => {
        const detailsButton = event.target.closest('.project-details');
        if (detailsButton) {
            const card = detailsButton.closest('.robot-showcase-card, .robot-card');
            const robotId = card && (card.getAttribute('data-robot-id') || card.getAttribute('data-project'));
            if (robotId) {
                openRobotModal(robotId);
            }
            return;
        }

        const closeTarget = event.target.closest('[data-close-robot-modal]');
        if (closeTarget) {
            event.preventDefault();
            closeRobotModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeRobotModal();
        }
    });

    if (exploreAllButton) {
        exploreAllButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openRobotShowcase();
        });
    }

    buildFilterButtons();
    renderCards();

    if (window.location.hash === '#robots-showcase') {
        openRobotShowcase();
    }
}
function formatCurrency(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return INR_NUMBER_FORMATTER.format(0);
    return INR_NUMBER_FORMATTER.format(num);
}

function formatDate(value) {
    if (!value) return EMPTY_VALUE;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function createMetricCard(label, value, accent = '') {
    const card = document.createElement('div');
    card.className = `dashboard-stat-card glass-panel ${accent}`.trim();
    card.innerHTML = `
        <span class="card-caption">${label}</span>
        <strong class="dashboard-stat-value">${value}</strong>
    `;
    return card;
}

function createInstallmentItem(title, amount, status, isPaid) {
    const item = document.createElement('div');
    item.className = `installment-item ${isPaid ? 'is-paid' : 'is-due'}`;
    item.innerHTML = `
        <div>
            <strong>${title}</strong>
            <span>${formatCurrency(amount)}</span>
        </div>
        <span class="status-pill">${status}</span>
    `;
    return item;
}

function createQrSvgData(text) {
    const safeText = String(text || '').replace(/[<>&"]/g, '');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="Payment QR code">
            <rect width="220" height="220" rx="24" fill="#ffffff"/>
            <rect x="22" y="22" width="176" height="176" rx="18" fill="#0b1026"/>
            <rect x="36" y="36" width="36" height="36" rx="6" fill="#00d4ff"/>
            <rect x="148" y="36" width="36" height="36" rx="6" fill="#00d4ff"/>
            <rect x="36" y="148" width="36" height="36" rx="6" fill="#00d4ff"/>
            <text x="110" y="116" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">${safeText}</text>
            <text x="110" y="142" text-anchor="middle" fill="#b0b5c1" font-family="Arial, sans-serif" font-size="11">Scan to pay</text>
        </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ====== CENTRALIZED ACHIEVEMENT DATA (MODULAR & SCALABLE) ======
const ACHIEVEMENTS_DATA = [
    {
        id: 'bitsg2025',
        title: 'BITS GOA 2025',
        event: 'Quark 2025',
        achievement: '3rd place in Robo Sumo',
        date: '2025-02',
        dateDisplay: 'February 2025',
        image: 'assets/images/images/HomePage/Achivements/BITSG2025Win.jpg',
        featured: true,
        award: '3rd Place',
        category: 'Competition'
    },
    {
        id: 'iiitn2024',
        title: 'IIIT Nagpur 2024',
        event: 'Tantrafiesta',
        achievement: '2nd & 3rd place finishes + Robo Rumble victory',
        date: '2024-09',
        dateDisplay: 'September 2024',
        image: 'assets/images/images/HomePage/Achivements/IIITN2024.jpg',
        featured: false,
        award: '2nd, 3rd Place',
        category: 'Competition'
    },
    {
        id: 'iitb2023',
        title: 'IIT Bombay 2023',
        event: 'International Robotics Competition',
        achievement: 'RC Boats clean sweep (1st, 2nd, 3rd place)',
        date: '2023-12',
        dateDisplay: 'December 2023',
        image: 'assets/images/images/HomePage/Achivements/IITB2023.jpg',
        featured: false,
        award: 'Clean Sweep',
        category: 'Competition'
    },
    {
        id: 'technex2024',
        title: 'TECHNEX 2024',
        event: 'Tech Festival Showcase',
        achievement: 'Coastal Clash clean sweep (1st, 2nd, 3rd)',
        date: '2024-01',
        dateDisplay: 'January 2024',
        image: 'assets/images/images/HomePage/Achivements/TECHNEX2024.jpg',
        featured: false,
        award: 'Clean Sweep',
        category: 'Competition'
    },
    {
        id: 'iitb2024',
        title: 'IIT Bombay 2024',
        event: 'Robotics Championship',
        achievement: '5th place in RC Boat Race',
        date: '2024-12',
        dateDisplay: 'December 2024',
        image: 'assets/images/images/HomePage/Achivements/IITB2024.jpg',
        featured: false,
        award: '5th Place',
        category: 'Competition'
    },
    {
        id: 'technex2025',
        title: 'TECHNEX 2025',
        event: 'RC Division Racing',
        achievement: 'Drift Fury RC car race 1st place victory',
        date: '2025-01',
        dateDisplay: 'January 2025',
        image: 'assets/images/images/HomePage/Achivements/TECHNEX2025.jpg',
        featured: false,
        award: '1st Place',
        category: 'Racing'
    },
    {
        id: 'iiitn2023',
        title: 'IIIT Nagpur 2023',
        event: 'Tantrafiesta 2023',
        achievement: 'Robo Rumble 3rd place finish',
        date: '2023-09',
        dateDisplay: 'September 2023',
        image: 'assets/images/images/HomePage/Achivements/IIITN2023.jpg',
        featured: false,
        award: '3rd Place',
        category: 'Competition'
    },
    {
        id: 'iiitn2022',
        title: 'IIIT Nagpur 2022',
        event: 'Tantrafiesta 2022',
        achievement: 'Robo Rumble 1st place inaugural victory',
        date: '2022-10',
        dateDisplay: 'October 2022',
        image: 'assets/images/images/HomePage/Achivements/IIITN2022.JPG',
        featured: false,
        award: '1st Place',
        category: 'Competition'
    }
];

const ACHIEVEMENT_FILTERS = ['All', 'Robotics', 'AI', 'Workshops', 'National', 'International'];
let activeAchievementFilter = 'All';

// ====== ACHIEVEMENTS (PREMIUM) INTERACTIONS ======
function initializeAchievements() {
    const hallSection = document.querySelector('.achievements-hall');
    if (!hallSection) return;

    // Render stats
    renderAchievementStats();

    // Render featured achievement (first with featured: true)
    renderFeaturedAchievement();

    // Render premium vertical showcase
    renderAchievementsMasonry();

    // Setup modal handlers
    setupAchievementModalHandlers();
}

function renderAchievementStats() {
    const statsContainer = document.querySelector('.hall-stats');
    if (!statsContainer || !ACHIEVEMENTS_DATA.length) return;

    const competitionsAttended = new Set(ACHIEVEMENTS_DATA.map(item => item.event).filter(Boolean)).size;
    const awardsWon = ACHIEVEMENTS_DATA.filter(item => item.award || item.achievement).length;
    const nationalFinals = ACHIEVEMENTS_DATA.filter(item => achievementMatchesFilter(item, 'National')).length;
    const workshopsConducted = ACHIEVEMENTS_DATA.filter(item => achievementMatchesFilter(item, 'Workshops')).length;

    const totals = [
        { count: competitionsAttended, label: 'Competitions Attended' },
        { count: awardsWon, label: 'Awards Won' },
        { count: nationalFinals, label: 'National Finals' },
        { count: workshopsConducted, label: 'Workshops Conducted' }
    ];

    statsContainer.innerHTML = totals.map(s => `
        <div class="stat-panel">
            <div class="stat-number" data-count="${s.count}">0</div>
            <div class="stat-text">${s.label}</div>
            <div class="stat-glow"></div>
        </div>
    `).join('');

    // Animate when stats come into view
    const statObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.stat-number').forEach(num => {
                const target = parseInt(num.dataset.count, 10) || 0;
                animateCounter(num, target);
            });
            obs.disconnect();
        });
    }, { threshold: 0.4 });

    statObserver.observe(statsContainer);
}

function animateCounter(element, target) {
    let current = 0;
    const step = Math.ceil(target / 30);
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(interval);
        } else {
            element.textContent = current;
        }
    }, 20);
}

function renderFeaturedAchievement() {
    const featuredContainer = document.querySelector('.featured-achievement');
    if (!featuredContainer || !ACHIEVEMENTS_DATA.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Show the featured story first, then the remaining achievements by recency.
    const slides = ACHIEVEMENTS_DATA
        .slice()
        .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(b.date).localeCompare(String(a.date)));

    featuredContainer.innerHTML = `
        <div class="featured-carousel">
            <div class="featured-shell-label">
                <span>Achievement Spotlight</span>
                <span class="featured-counter" aria-live="polite">01 / ${String(slides.length).padStart(2, '0')}</span>
            </div>
            <div class="featured-slides">
                ${slides.map(s => `
                    <div class="featured-slide" data-id="${s.id}">
                        <div class="featured-image"><img src="${s.image}" alt="${s.title}" loading="lazy"></div>
                        <div class="featured-content">
                            <div class="featured-badge">${s.award || 'HIGHLIGHT'}</div>
                            <h3>${s.title}</h3>
                            <p class="event">${s.event}</p>
                            <p class="description">${s.achievement}</p>
                            <p class="meta">${s.dateDisplay}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="featured-controls">
                <button class="feat-prev" aria-label="Previous">\u2039</button>
                <div class="feat-indicators"></div>
                <button class="feat-next" aria-label="Next">\u203A</button>
            </div>
            <div class="featured-progress" aria-hidden="true"><span></span></div>
        </div>
    `;

    // Carousel behavior
    const carousel = featuredContainer.querySelector('.featured-carousel');
    const slideEls = Array.from(featuredContainer.querySelectorAll('.featured-slide'));
    const prevBtn = featuredContainer.querySelector('.feat-prev');
    const nextBtn = featuredContainer.querySelector('.feat-next');
    const indicatorsRoot = featuredContainer.querySelector('.feat-indicators');
    const counter = featuredContainer.querySelector('.featured-counter');
    const progress = featuredContainer.querySelector('.featured-progress span');
    let current = 0, autoTimer = null, isHover = false;

    function showSlide(i) {
        slideEls.forEach((el, idx) => {
            el.style.opacity = idx === i ? '1' : '0';
            el.style.pointerEvents = idx === i ? 'auto' : 'none';
            el.style.transform = idx === i ? 'translateX(0) scale(1)' : 'translateX(2.5%) scale(0.985)';
        });
        current = i;
        updateIndicators();
        if (counter) counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slideEls.length).padStart(2, '0')}`;
        if (progress) progress.style.transform = `scaleX(${slideEls.length > 1 ? (i + 1) / slideEls.length : 1})`;
    }

    function nextSlide() { showSlide((current + 1) % slideEls.length); }
    function prevSlide() { showSlide((current - 1 + slideEls.length) % slideEls.length); }

    function startAuto() {
        stopAuto();
        if (reducedMotion || slideEls.length < 2) return;
        autoTimer = setInterval(() => { if (!isHover) nextSlide(); }, 4500);
    }
    function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; }

    // Build indicators
    indicatorsRoot.setAttribute('role', 'tablist');
    indicatorsRoot.innerHTML = slideEls.map((_, idx) => `<button data-index="${idx}" class="${idx===0?'active':''}" aria-label="Go to slide ${idx+1}" aria-pressed="${idx===0 ? 'true' : 'false'}"></button>`).join('');
    indicatorsRoot.querySelectorAll('button').forEach(b => b.addEventListener('click', () => showSlide(parseInt(b.dataset.index,10))));

    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAuto(); });

    carousel.addEventListener('mouseenter', () => { isHover = true; });
    carousel.addEventListener('mouseleave', () => { isHover = false; });
    carousel.addEventListener('focusin', () => { isHover = true; });
    carousel.addEventListener('focusout', () => { isHover = false; });

    // Swipe support
    let startX = 0; let isDown = false;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDown = true; stopAuto(); });
    carousel.addEventListener('touchend', (e) => { if (!isDown) return; isDown = false; const dx = startX - e.changedTouches[0].clientX; if (dx > 40) nextSlide(); else if (dx < -40) prevSlide(); startAuto(); });
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); startAuto(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); startAuto(); }
    });

    function updateIndicators() {
        indicatorsRoot.querySelectorAll('button').forEach((b, idx) => {
            const active = idx === current;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    // Initialize styles for fade
    slideEls.forEach((el, idx) => { el.style.position = 'absolute'; el.style.inset = 0; el.style.transition = 'opacity 900ms cubic-bezier(.2,.9,.2,1), transform 900ms cubic-bezier(.2,.9,.2,1)'; el.style.opacity = idx === 0 ? '1' : '0'; el.style.transform = idx === 0 ? 'translateX(0) scale(1)' : 'translateX(2.5%) scale(0.985)'; });
    featuredContainer.querySelector('.featured-slides').style.position = 'relative';
    featuredContainer.querySelector('.featured-slides').style.height = '420px';
    carousel.setAttribute('tabindex', '0');

    // Click to open modal
    slideEls.forEach(el => el.addEventListener('click', () => openAchievementFullscreen(el.dataset.id)));

    showSlide(0);
    startAuto();
}

function renderAchievementsMasonry() {
    const masonryContainer = document.querySelector('.achievements-masonry');
    if (!masonryContainer) return;

    renderAchievementFilterTabs();

    const filteredAchievements = ACHIEVEMENTS_DATA.filter(item => achievementMatchesFilter(item, activeAchievementFilter));
    const groupedByYear = groupAchievementsByYear(filteredAchievements);

    if (!groupedByYear.length) {
        masonryContainer.innerHTML = `
            <div class="achievements-empty-state" role="status" aria-live="polite">
                <h4>No achievements found</h4>
                <p>Try another filter to explore all achievements.</p>
            </div>
        `;
        return;
    }

    masonryContainer.innerHTML = groupedByYear
        .map(group => `
            <section class="achievements-year-group" aria-label="Achievements in ${group.year}">
                <header class="achievements-year-header">
                    <h4>${group.year}</h4>
                    <span>${group.items.length} highlight${group.items.length === 1 ? '' : 's'}</span>
                </header>
                <div class="achievements-grid" role="list">
                    ${group.items.map(ach => `
                        <article class="achievement-item" data-achievement-id="${ach.id}" role="listitem">
                            <div class="achievement-image">
                                <img src="${ach.image}" alt="${ach.title}" loading="lazy">
                                <div class="achievement-category">${ach.category || 'Competition'}</div>
                            </div>
                            <div class="achievement-body">
                                <div class="achievement-meta-row">
                                    <div class="achievement-award">${ach.award || 'Achievement'}</div>
                                    <p class="achievement-date">${ach.dateDisplay}</p>
                                </div>
                                <h5>${ach.title}</h5>
                                <p class="achievement-event">${ach.event}</p>
                                <p class="achievement-content">${ach.achievement}</p>
                                <button class="achievement-view-btn" type="button" data-achievement-id="${ach.id}">View Details</button>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        `)
        .join('');

    masonryContainer.onclick = (event) => {
        const trigger = event.target.closest('[data-achievement-id]');
        if (!trigger) return;
        const achId = trigger.dataset.achievementId;
        if (achId) openAchievementFullscreen(achId);
    };

    const cards = Array.from(masonryContainer.querySelectorAll('.achievement-item'));

    // Reveal items when they enter viewport (staggered)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });

    cards.forEach(c => revealObserver.observe(c));
}

function renderAchievementFilterTabs() {
    const filtersContainer = document.getElementById('achievementsFilters');
    if (!filtersContainer) return;

    const counts = ACHIEVEMENT_FILTERS.reduce((acc, filter) => {
        acc[filter] = filter === 'All'
            ? ACHIEVEMENTS_DATA.length
            : ACHIEVEMENTS_DATA.filter(item => achievementMatchesFilter(item, filter)).length;
        return acc;
    }, {});

    filtersContainer.innerHTML = ACHIEVEMENT_FILTERS
        .map(filter => `
            <button
                class="achievement-filter-tab ${activeAchievementFilter === filter ? 'active' : ''}"
                type="button"
                role="tab"
                aria-selected="${activeAchievementFilter === filter ? 'true' : 'false'}"
                data-filter="${filter}">
                <span>${filter}</span>
                <small>${counts[filter]}</small>
            </button>
        `)
        .join('');

    filtersContainer.querySelectorAll('.achievement-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const nextFilter = tab.dataset.filter;
            if (!nextFilter || nextFilter === activeAchievementFilter) return;
            activeAchievementFilter = nextFilter;
            renderAchievementsMasonry();
        });
    });
}

function groupAchievementsByYear(achievements) {
    const yearMap = achievements.reduce((acc, item) => {
        const year = String(item.date || '').slice(0, 4) || 'Other';
        if (!acc[year]) acc[year] = [];
        acc[year].push(item);
        return acc;
    }, {});

    return Object.keys(yearMap)
        .sort((a, b) => b.localeCompare(a))
        .map(year => ({
            year,
            items: yearMap[year].slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
        }));
}

function achievementMatchesFilter(achievement, filter) {
    if (!achievement) return false;
    if (filter === 'All') return true;

    const title = String(achievement.title || '').toLowerCase();
    const event = String(achievement.event || '').toLowerCase();
    const description = String(achievement.achievement || '').toLowerCase();
    const category = String(achievement.category || '').toLowerCase();
    const combined = `${title} ${event} ${description} ${category}`;

    if (filter === 'Robotics') {
        return /(robot|robo|rc|tech|tantrafiesta|competition|racing)/.test(combined);
    }
    if (filter === 'AI') {
        return /(\bai\b|artificial intelligence|ml|machine learning)/.test(combined);
    }
    if (filter === 'Workshops') {
        return /(workshop|bootcamp|training|seminar)/.test(combined);
    }
    if (filter === 'National') {
        return /(iit|iiit|bits|technex|national|india)/.test(combined);
    }
    if (filter === 'International') {
        return /(international|global|world)/.test(combined);
    }

    return true;
}

function openAchievementFullscreen(achievementId) {
    const ach = ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
    if (!ach) return;

    const modal = document.querySelector('.achievement-fullscreen');
    if (!modal) return;

    // Populate modal
    const mediaImg = modal.querySelector('.fullscreen-media img');
    const detailsTitle = modal.querySelector('.fullscreen-details h2');
    const detailsEvent = modal.querySelector('.detail-event');
    const detailsDesc = modal.querySelector('.detail-description');
    const detailsMeta = modal.querySelector('.detail-meta');

    if (mediaImg) mediaImg.src = ach.image;
    if (detailsTitle) detailsTitle.textContent = ach.title;
    if (detailsEvent) detailsEvent.textContent = ach.event;
    if (detailsDesc) detailsDesc.textContent = ach.achievement;
    if (detailsMeta) {
        detailsMeta.innerHTML = `
            <div class="meta-item">
                <span class="meta-label">DATE</span>
                <span>${ach.dateDisplay}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">AWARD</span>
                <span>${ach.award || ach.category || 'Achievement'}</span>
            </div>
        `;
    }

    // Show modal
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('achievement-fullscreen-open');
}

function closeAchievementFullscreen() {
    const modal = document.querySelector('.achievement-fullscreen');
    if (modal && !modal.hidden) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('achievement-fullscreen-open');
    }
}

function setupAchievementModalHandlers() {
    const modal = document.querySelector('.achievement-fullscreen');
    if (!modal) return;

    const closeBtn = modal.querySelector('.fullscreen-close');
    const backdrop = modal.querySelector('.fullscreen-backdrop');

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAchievementFullscreen);
    }

    // Backdrop click
    if (backdrop) {
        backdrop.addEventListener('click', closeAchievementFullscreen);
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            closeAchievementFullscreen();
        }
    });
}

// ====== TEAM SHOWCASE (PREMIUM) ======
const TEAM_DATA = [
    {
        key: 'mentor',
        title: 'Mentor',
        subtitle: 'Strategic direction',
        spotlight: true,
        members: [
            {
                name: 'Ashutosh Maske',
                role: 'Robotics Mentor',
                image: 'assets/images/images/Team/Mentor/Ashutosh.jpg',
                bio: 'Guides the team through technical direction and mentorship.',
                focus: 'center 15%'
            }
        ]
    },
    {
        key: 'designing',
        title: 'Designing Team',
        subtitle: 'Industrial design and CAD',
        members: [
            { name: 'Pranay Gourkar', role: 'Web Developer & Designer', image: 'assets/images/images/Team/Designing/Pranay_Gourkar.jpg', focus: 'center 16%' },
            { name: 'Arnav Borikar', role: 'CAD Designer', image: 'assets/images/images/Team/Designing/Arnav.jpg', focus: 'center 20%' },
            { name: 'Harshit Pahune', role: 'CAD Designer', image: 'assets/images/images/Team/Designing/Harshit.jpeg', focus: 'center 18%' },
            { name: 'Mayur Dhomne', role: 'RC Boats Designer', image: 'assets/images/images/Team/Designing/Mayur_Dhomne.jpg', focus: 'center 18%' }
        ]
    },
    {
        key: 'technical',
        title: 'Technical Team',
        subtitle: 'Build, wiring, and systems',
        members: [
            { name: 'Viraj Gaherwar', role: 'Technical Crew', image: 'assets/images/images/Team/Technical/Viraj_Gaherwar.jpg', focus: 'center 16%' },
            { name: 'Nishant Mujaria', role: 'Technical Crew', image: 'assets/images/images/Team/Technical/Nishant_Mujaria.jpg', focus: 'center 15%' },
            { name: 'Palak Khonde', role: 'Technical Crew', image: 'assets/images/images/Team/Technical/Palak_Khonde.jpg', focus: 'center 16%' },
            { name: 'Jay Moundekar', role: 'Technical Crew', image: 'assets/images/images/Team/Technical/Jay_Moundekar.jpg', focus: 'center 16%' }
        ]
    },
    {
        key: 'fabrication',
        title: 'Fabrication Team',
        subtitle: 'Structure and mechanical execution',
        members: [
            { name: 'Kaushal Bodakhe', role: 'Structural Fabricator', image: 'assets/images/images/Team/fabricator/Kaushal.jpg', focus: 'center 18%' },
            { name: 'Utkarsh Dhore', role: 'Structural Fabricator', image: 'assets/images/images/Team/fabricator/Utkarsh_Dhore.jpg', focus: 'center 18%' },
            { name: 'Joel Jacob Varghese', role: 'Structural Fabricator', image: 'assets/images/images/Team/fabricator/Joel.jpg', focus: 'center 18%' },
            { name: 'Aryan Mahule', role: 'Structural Fabricator', image: 'assets/images/images/Team/fabricator/Aryan.jpg', focus: 'center 18%' }
        ]
    },
    {
        key: 'management',
        title: 'Management Team',
        subtitle: 'Operations and finance',
        members: [
            { name: 'Devanshu Ekhar', role: 'Finance Management', image: 'assets/images/images/Team/Management/Devanshu_Ekhar.jpg', focus: 'center 18%' },
            { name: 'Hannah Elsa Abraham', role: 'Team Management', image: 'assets/images/images/Team/Management/Hannah.jpg', focus: 'center 18%' }
        ]
    },
    {
        key: 'media',
        title: 'Media Team',
        subtitle: 'Storytelling and content',
        members: [
            { name: 'Om Gawande', role: 'Media Crew', image: 'assets/images/images/Team/Media/Om.jpg', focus: 'center 18%' },
            { name: 'Dhananjay Landge', role: 'Media Crew', image: 'assets/images/images/Team/Media/Dhananjay_Landge.jpg', focus: 'center 18%' },
            { name: 'Krishna Khodke', role: 'Media Crew', image: 'assets/images/images/Team/Media/Krishna.jpg', focus: 'center 18%' }
        ]
    },
    {
        key: 'maintenance',
        title: 'Maintenance Team',
        subtitle: 'Continuity and upkeep',
        members: [
            { name: 'Lanngam Kabui', role: 'Maintenance Crew', image: 'assets/images/images/Team/Maintenance/Lanngam.jpg', focus: 'center 18%' },
            { name: 'Anwesh Sonkusare', role: 'Maintenance Crew', image: 'assets/images/images/Team/Maintenance/Answesh_Sonkusare.jpg', focus: 'center 18%' },
            { name: 'Manasvi Wagh', role: 'Maintenance Crew', image: 'assets/images/images/Team/Maintenance/Manaswi.jpg', focus: 'center 18%' },
            { name: 'Jay Aaglave', role: 'Maintenance Crew', image: 'assets/images/images/Team/Maintenance/Jay_Aaglave.jpg', focus: 'center 18%' }
        ]
    }
];

function initializeTeamShowcase() {
    const teamSection = document.querySelector('.team-showcase');
    if (!teamSection) return;

    renderTeamSpotlight();
    renderTeamMetrics();
    renderTeamFilters();
    renderTeamSections();
    setupTeamFilterInteractions();
    setupTeamCursorGlow();
}

function renderTeamMetrics() {
    const metricsContainer = document.getElementById('teamMetrics');
    if (!metricsContainer) return;

    const groups = TEAM_DATA.filter(group => !group.spotlight);
    const totalMembers = groups.reduce((count, group) => count + group.members.length, 0);

    metricsContainer.innerHTML = [
        { value: groups.length, label: 'Disciplines', icon: 'fa-layer-group' },
        { value: totalMembers, label: 'Team Members', icon: 'fa-users' },
        { value: 1, label: 'Mentor', icon: 'fa-satellite-dish' }
    ].map(metric => `
        <div class="team-metric">
            <span class="team-metric-icon" aria-hidden="true"><i class="fas ${metric.icon}"></i></span>
            <strong>${metric.value}</strong>
            <span>${metric.label}</span>
        </div>
    `).join('');
}

function renderTeamSpotlight() {
    const spotlightContainer = document.getElementById('teamSpotlight');
    if (!spotlightContainer) return;

    const mentorGroup = TEAM_DATA.find(group => group.spotlight);
    const mentor = mentorGroup && mentorGroup.members[0];
    if (!mentor) return;

    spotlightContainer.innerHTML = `
        <article class="mentor-spotlight-card" data-reveal>
            <div class="mentor-spotlight-visual">
                <div class="mentor-portrait-frame">
                    <img loading="lazy" src="${mentor.image}" alt="${mentor.name}" style="object-position:${mentor.focus || 'center 18%'};">
                </div>
            </div>
            <div class="mentor-spotlight-content">
                <p class="mentor-kicker">Technical Guidance</p>
                <h3>${mentor.name}</h3>
                <p class="mentor-role">${mentor.role}</p>
                <p class="mentor-bio">${mentor.bio}</p>
                <div class="team-spotlight-metrics" id="teamMetrics"></div>
                <blockquote class="mentor-quote">
                    Precision, mentorship, and disciplined execution are what turn a team into a robotics organization.
                </blockquote>
            </div>
        </article>
    `;
}

function renderTeamFilters() {
    const filtersContainer = document.getElementById('teamFilters');
    if (!filtersContainer) return;

    const categories = [{ label: 'All', key: 'all' }, ...TEAM_DATA.filter(group => !group.spotlight).map(group => ({ label: group.title, key: group.key }))];
    filtersContainer.innerHTML = categories.map((category, index) => `
        <button type="button" class="team-filter-chip${index === 0 ? ' active' : ''}" data-team-filter="${category.key}">${category.label}</button>
    `).join('');
}

function renderTeamSections() {
    const sectionsContainer = document.getElementById('teamSections');
    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = TEAM_DATA
        .filter(group => !group.spotlight)
        .map((group, index) => `
            <section class="team-category-panel" id="team-${group.key}" data-team-group="${group.key}" data-team-title="${group.title}" data-reveal>
                <div class="team-category-header">
                    <div>
                        <p class="team-category-kicker">${String(index + 1).padStart(2, '0')}</p>
                        <h3>${group.title}</h3>
                    </div>
                    <div class="team-category-meta">
                        <span>${group.subtitle}</span>
                        <strong>${group.members.length} members</strong>
                    </div>
                </div>
                <div class="team-category-divider" aria-hidden="true"></div>
                <div class="team-person-grid">
                    ${group.members.map(member => `
                        <article class="team-person-card" data-reveal data-team-category="${group.title}">
                            <div class="team-person-media">
                                <img loading="lazy" src="${member.image}" alt="${member.name}" style="object-position:${member.focus || 'center 18%'};">
                            </div>
                            <div class="team-person-content">
                                <span class="team-person-tag">${group.title}</span>
                                <h4>${member.name}</h4>
                                <p class="team-person-role">${member.role}</p>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        `)
        .join('');
}

function setupTeamFilterInteractions() {
    const filtersContainer = document.getElementById('teamFilters');
    const sections = Array.from(document.querySelectorAll('.team-category-panel'));
    if (!filtersContainer || !sections.length) return;

    filtersContainer.addEventListener('click', (event) => {
        const button = event.target.closest('[data-team-filter]');
        if (!button) return;

        const filter = button.getAttribute('data-team-filter') || 'all';
        filtersContainer.querySelectorAll('.team-filter-chip').forEach(chip => chip.classList.toggle('active', chip === button));

        sections.forEach(section => {
            const shouldShow = filter === 'all' || section.dataset.teamGroup === filter;
            if (shouldShow) {
                section.hidden = false;
                section.style.display = '';
                window.requestAnimationFrame(() => section.classList.add('is-visible'));
            } else {
                section.classList.remove('is-visible');
                section.style.display = 'none';
            }
        });

        if (filter !== 'all') {
            const target = document.getElementById(`team-${filter}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

function setupTeamCursorGlow() {
    const teamSection = document.querySelector('.team-showcase');
    if (!teamSection || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    teamSection.addEventListener('pointermove', (event) => {
        const rect = teamSection.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        teamSection.style.setProperty('--team-glow-x', `${x}%`);
        teamSection.style.setProperty('--team-glow-y', `${y}%`);
    });
}

// ====== COLLABORATION PORTAL ======
function initializeCollaborationPortal() {
    const collaborationSection = document.querySelector('.collaboration');
    const form = document.getElementById('collaborationForm');
    const status = document.getElementById('collaborationStatus');
    const submitButton = form ? form.querySelector('.collaboration-btn-primary[type="submit"]') : null;

    if (!collaborationSection || !form || !status) return;

    const focusableFields = Array.from(form.querySelectorAll('input, select, textarea'));
    const requiredFields = focusableFields.filter((field) => field.hasAttribute('required'));
    const originalSubmitContent = submitButton ? submitButton.innerHTML : '';

    function ensureToastHost() {
        let host = document.getElementById('collaborationToastHost');
        if (host) return host;

        host = document.createElement('div');
        host.id = 'collaborationToastHost';
        host.className = 'collaboration-toast-host';
        host.setAttribute('aria-live', 'polite');
        host.setAttribute('aria-atomic', 'true');
        document.body.appendChild(host);
        return host;
    }

    function showToast(message, type = 'success') {
        const host = ensureToastHost();
        const toast = document.createElement('div');
        toast.className = `collaboration-toast collaboration-toast-${type}`;
        toast.setAttribute('role', 'status');
        const iconWrap = document.createElement('span');
        iconWrap.className = 'collaboration-toast-icon';
        iconWrap.setAttribute('aria-hidden', 'true');

        const icon = document.createElement('i');
        icon.className = `fas ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`;
        iconWrap.appendChild(icon);

        const copy = document.createElement('div');
        copy.className = 'collaboration-toast-copy';

        const title = document.createElement('strong');
        title.textContent = type === 'success' ? 'Texcelerators' : 'Action needed';

        const text = document.createElement('p');
        text.textContent = message;

        copy.appendChild(title);
        copy.appendChild(text);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'collaboration-toast-close';
        closeButton.setAttribute('aria-label', 'Dismiss notification');
        closeButton.textContent = 'Ã—';

        toast.appendChild(iconWrap);
        toast.appendChild(copy);
        toast.appendChild(closeButton);

        const closeToast = () => {
            toast.classList.remove('is-visible');
            window.setTimeout(() => toast.remove(), 280);
        };

        closeButton.addEventListener('click', closeToast);
        host.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('is-visible');
        });

        window.setTimeout(closeToast, 3200);
    }

    function setLoadingState(isLoading) {
        if (!submitButton) return;

        submitButton.disabled = isLoading;
        submitButton.classList.toggle('is-loading', isLoading);
        submitButton.setAttribute('aria-busy', String(isLoading));
        submitButton.innerHTML = isLoading
            ? '<span>Submitting...</span><span class="btn-spinner" aria-hidden="true"></span>'
            : originalSubmitContent;
    }

    function setStatus(message, type = 'success') {
        status.hidden = false;
        status.className = `form-status ${type} is-visible`;
        status.textContent = message;
    }

    function clearStatus() {
        status.className = 'form-status';
        status.hidden = true;
        status.textContent = '';
    }

    function markFieldState(field, isValid) {
        field.classList.toggle('is-invalid', !isValid);
        field.classList.toggle('is-valid', isValid);
    }

    function validateField(field) {
        const value = field.value.trim();
        let valid = true;

        if (field.required && !value) {
            valid = false;
        }

        if (field.type === 'email' && value) {
            valid = /^\S+@\S+\.\S+$/.test(value);
        }

        if (field.type === 'url' && value) {
            try {
                const parsed = new URL(value);
                valid = ['http:', 'https:'].includes(parsed.protocol);
            } catch (_) {
                valid = false;
            }
        }

        markFieldState(field, valid);
        return valid;
    }

    function validateForm() {
        const invalidFields = requiredFields.filter((field) => !validateField(field));
        return invalidFields.length === 0;
    }

    focusableFields.forEach((field) => {
        field.addEventListener('input', () => {
            clearStatus();
            validateField(field);
        });

        field.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            setStatus('Please complete the required fields before starting collaboration.', 'error');
            showToast('Please complete the required fields before starting collaboration.', 'error');
            return;
        }

        // Prevent duplicate submission
        if (form.classList.contains('is-submitting')) {
            return;
        }

        form.classList.add('is-submitting');
        setLoadingState(true);
        setStatus('Submitting your inquiry...', 'info');

        try {
            // Collect form data
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData);

            // Map form field names to API expected names
            const data = {
                fullName: payload.fullName || '',
                email: payload.email || '',
                phone: payload.phone || '',
                college: payload.organization || '',
                roleInterested: payload.role || '',
                skills: payload.skills || '',
                collaborationReason: payload.why || '',
                portfolioLink: payload.socialLink || ''
            };

            const response = await fetch('/api/collaboration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit collaboration form');
            }

            if (result.success) {
                const successMessage = 'Collaboration request received successfully.\n\nYour profile has been forwarded for evaluation by the Texcelerators team. If shortlisted, our team will reach out through the provided contact details.';
                setStatus(successMessage, 'success');
                showToast(successMessage, 'success');
                collaborationSection.classList.add('is-submitted');
                form.classList.add('is-submitted');
                form.reset();

                focusableFields.forEach((field) => {
                    field.classList.remove('is-valid', 'is-invalid');
                });

                window.clearTimeout(initializeCollaborationPortal._statusTimer);
                initializeCollaborationPortal._statusTimer = window.setTimeout(() => {
                    collaborationSection.classList.remove('is-submitted');
                }, 2400);
            }
        } catch (error) {
            console.error('Collaboration form submission error:', error);
            setStatus(error.message || 'An error occurred. Please try again.', 'error');
            showToast(error.message || 'An error occurred. Please try again.', 'error');
        } finally {
            form.classList.remove('is-submitting');
            setLoadingState(false);
        }
    });
}

function setupPremiumRipples() {
    const rippleTargets = '.hero-cta-primary, .hero-cta-secondary, .hero-slider-controls .btn, .collaboration-btn-primary, .collaboration-btn-secondary, .social-pill, .footer-mini-socials a';

    document.addEventListener('click', (event) => {
        const target = event.target.closest(rippleTargets);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'premium-ripple';

        const size = Math.max(rect.width, rect.height) * 1.35;
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        target.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 650);
    });
}

// ====== ROBOTS CAROUSEL (AUTO-SLIDING) ======
function initializeRobotsCarousel() {
    const carouselWrapper = document.getElementById('robotsCarouselWrapper');
    const carouselContainer = document.getElementById('robotsCarousel');
    const prevBtn = document.getElementById('robotsCarouselPrev');
    const nextBtn = document.getElementById('robotsCarouselNext');
    const indicatorsContainer = document.getElementById('robotsCarouselIndicators');

    if (!carouselContainer || !carouselWrapper) return;

    let currentIndex = 0;
    let autoPlayTimer = null;
    let touchStartX = 0;
    let isDragging = false;

    const ROBOT_CAROUSEL_DATA = [
        {
            id: 'robosoccer',
            name: 'RoboSoccer',
            index: '01',
            category: 'Competition Build',
            description: 'High-performance soccer robot engineered with precision drive control and tactical maneuvering capabilities for competitive matches.',
            technologies: ['Precision Drive Control', 'Tactical Maneuvering', 'Competition Matchplay'],
            image: 'assets/images/images/HomePage/Robots/RoboSoccer.jpg'
        },
        {
            id: 'robosumo',
            name: 'RoboSumo',
            index: '02',
            category: 'Combat Platform',
            description: 'Championship sumo robot combining robust mechanical design with intelligent combat strategies for competitive dominance.',
            technologies: ['Robust Mechanical Design', 'Intelligent Combat Strategies', 'Competitive Dominance'],
            image: 'assets/images/images/HomePage/Robots/RoboSumo.jpg'
        },
        {
            id: 'roborace',
            name: 'RoboRace',
            index: '03',
            category: 'Rescue Platform',
            description: 'Compact search and rescue robot designed to navigate through debris with ease and speed.',
            technologies: ['Search and Rescue', 'Debris Navigation', 'High Speed'],
            image: 'assets/images/images/HomePage/Robots/Roborace.JPG'
        },
        {
            id: 'rcboats',
            name: 'RC Boats',
            index: '04',
            category: 'Inspection Concept',
            description: 'Wall-climbing robot with biomimetic adhesion technology inspired by geckos for vertical infrastructure inspection.',
            technologies: ['Biomimetic Adhesion', 'Vertical Inspection', 'Wall Climbing'],
            image: 'assets/images/images/Robots/Story/Acrylic.png'
        },
        {
            id: 'fpvdrone',
            name: 'FPV Drone',
            index: '05',
            category: 'Aerial Platform',
            description: 'Advanced aerial robotics platform built for precision navigation, real-time surveillance, and immersive first-person flight control.',
            technologies: ['FPV', 'Precision Navigation', 'Real-time Surveillance', 'First-person Flight Control'],
            image: 'assets/images/images/HomePage/Robots/Drone.jpg'
        },
        {
            id: 'airavat',
            name: 'Airavat',
            index: '06',
            category: 'Soccer Platform',
            description: 'Premium competition soccer robot with AI-powered ball tracking and precision kicking mechanisms.',
            technologies: ['AI Ball Tracking', 'Precision Kicking', 'Competition Soccer'],
            image: 'assets/images/images/HomePage/Main SlideShow/BITSGATE2025.JPG'
        }
    ];

    function buildCarousel() {
        try {
            carouselContainer.innerHTML = ROBOT_CAROUSEL_DATA.map((robot, idx) => `
                <div class="robots-carousel-slide" data-index="${idx}" data-robot-id="${robot.id}">
                    <article class="project-card robot-card" data-project="${robot.id}">
                        <div class="robot-media">
                            <div class="media-container robot-media-frame">
                                <img loading="lazy" src="${robot.image}" alt="${robot.name}">
                            </div>
                            <div class="robot-image-glow" aria-hidden="true"></div>
                        </div>
                        <div class="robot-copy">
                            <div class="robot-topline">
                                <span class="robot-index">${robot.index}</span>
                                <span class="robot-status">${robot.category}</span>
                            </div>
                            <h3>${robot.name}</h3>
                            <p>${robot.description}</p>
                            <div class="robot-tags" aria-label="${robot.name} technologies">
                                ${robot.technologies.map((tag) => `<span class="tech-tag">${tag}</span>`).join('')}
                            </div>
                            <div class="robot-actions">
                                <button class="btn robot-btn project-details" type="button">View Details</button>
                            </div>
                        </div>
                    </article>
                </div>
            `).join('');

            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = ROBOT_CAROUSEL_DATA.map((_, idx) => `
                    <button type="button" class="robots-carousel-indicator${idx === 0 ? ' active' : ''}" data-index="${idx}" aria-label="Go to robot ${idx + 1}"></button>
                `).join('');
            }

            attachEventListeners();
        } catch (err) {
            console.error('Error building robots carousel:', err);
        }
    }

    function attachEventListeners() {
        document.querySelectorAll('.robots-carousel-slide .project-details').forEach((btn) => {
            btn.addEventListener('click', function() {
                const card = this.closest('.robot-card');
                if (card && window.openRobotDetail) {
                    window.openRobotDetail(card);
                }
            });
        });

        document.querySelectorAll('.robots-carousel-indicator').forEach((btn) => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index, 10);
                goToSlide(idx);
            });
        });
    }

    function updateIndicators() {
        document.querySelectorAll('.robots-carousel-indicator').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = (index + ROBOT_CAROUSEL_DATA.length) % ROBOT_CAROUSEL_DATA.length;
        updateCarouselPosition();
        updateIndicators();
        resetAutoPlay();
    }

    function updateCarouselPosition() {
        const slides = carouselContainer.querySelectorAll('.robots-carousel-slide');
        if (!slides || slides.length === 0) return;
        const gap = parseFloat(getComputedStyle(carouselContainer).gap) || 16;
        const slideWidth = Math.round(slides[0].getBoundingClientRect().width + gap);
        const left = Math.round(currentIndex * slideWidth);
        try {
            carouselContainer.scrollTo({ left, behavior: 'smooth' });
        } catch (err) {
            carouselContainer.scrollLeft = left;
        }
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    function startAutoPlay() {
        autoPlayTimer = setInterval(() => {
            nextSlide();
        }, 4800);
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
    carouselWrapper.addEventListener('mouseleave', startAutoPlay);

    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
        stopAutoPlay();
    });

    carouselContainer.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        startAutoPlay();
    });

    buildCarousel();
    updateCarouselPosition();
    startAutoPlay();
}

function renderDashboardApp() {
    const dashboardRoot = document.querySelector('[data-dashboard-root]');
    if (!dashboardRoot) {
        return;
    }

    // Backend API base
    const storedApiBase = localStorage.getItem('API_BASE');
    const currentOrigin = window.location.origin;
    const legacyBases = new Set(['http://localhost:3000', 'http://localhost:5000']);
    const API_BASE = storedApiBase && !legacyBases.has(storedApiBase)
        ? storedApiBase
        : currentOrigin;

    // Auto-migrate old stored values to the active origin.
    if (!storedApiBase || legacyBases.has(storedApiBase)) {
        localStorage.setItem('API_BASE', currentOrigin);
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
        localStorage.removeItem('currentUser');
        currentUser = null;
    }

    // If not authenticated, redirect to login
    if (!token) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        return;
    }

    let userRole = (currentUser && currentUser.role) ? currentUser.role : 'member';
    const dashboardRootEl = document.querySelector('[data-dashboard-root]');
    if (dashboardRootEl) {
        dashboardRootEl.setAttribute('aria-busy', 'true');
    }

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

        const analyticsGrid = document.querySelector('#analytics .charts-grid.premium-charts');
        const memberChartColumn = analyticsGrid ? analyticsGrid.querySelector('.chart-small.premium-chart-small') : null;
        if (analyticsGrid && memberChartColumn && userRole === 'member') {
            analyticsGrid.style.gridTemplateColumns = '1fr';
            memberChartColumn.style.display = 'none';
        }
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
        enterprise: {
            memberTransactions: [],
            reimbursements: [],
            projects: [],
            events: [],
            contributionStats: {}
        },
        finance: {
            totalIncome: 0,
            totalExpenses: 0,
            totalFunds: 0
        },
        paymentFlow: {
            qrScanned: false
        },
        profileEditor: {
            isEditing: false,
            draft: null,
            saving: false,
            clearProfilePic: false
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
                role: data.user.role,
                phone: data.user.phone || '',
                skills: Array.isArray(data.user.skills) ? data.user.skills : [],
                certificates: Array.isArray(data.user.certificates) ? data.user.certificates : [],
                createdAt: data.user.createdAt || null,
                updatedAt: data.user.updatedAt || null
            };
            userRole = state.user.role;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }

        state.expenses = Array.isArray(data.expenses) ? data.expenses.map(mapApiExpense) : [];
        state.enterprise = data && data.enterprise ? data.enterprise : {
            memberTransactions: [],
            reimbursements: [],
            projects: [],
            events: [],
            contributionStats: {}
        };

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
            const incomingMembers = Array.isArray(data.members) ? data.members : [];
            state.members = incomingMembers.length
                ? incomingMembers.map((member) => ({
                    id: String(member.id),
                    name: member.name,
                    status: member.status || (member.active ? 'active' : 'inactive'),
                    active: member.status ? member.status === 'active' : member.active !== false,
                    joinedAt: member.createdAt || null
                }))
                : [{
                    id: String(state.user.id),
                    name: state.user.name,
                    status: 'active',
                    active: true,
                    joinedAt: state.user.createdAt || null
                }];

            const summary = data.summary || {};
            state.finance.totalIncome = Number(summary.paymentsApprovedTotal) || 0;
            state.finance.totalExpenses = Number(summary.expensesTotal) || 0;
            state.finance.totalFunds = Number(summary.balance) || 0;
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
        sidebarProfileName: document.getElementById('sidebarProfileName'),
        sidebarProfileAvatar: document.getElementById('sidebarProfileAvatar'),
        topbarAvatar: document.getElementById('topbarAvatar'),
        welcomeName: document.getElementById('welcomeName'),
        welcomeRole: document.getElementById('welcomeRole'),
        paymentsContainer: document.getElementById('payments-container'),
        installmentsContainer: document.getElementById('installments-container'),
        amountToPay: document.getElementById('amountToPay'),
        qrCode: document.getElementById('qrCode'),
        receiptInput: document.getElementById('receiptInput'),
        memberReceiptStatus: document.getElementById('reimbursement-container'),
        transactionsContainer: document.getElementById('transactions-container'),
        memberExpensesContainer: document.getElementById('member-expenses-container'),
        expenseTableBody: document.getElementById('expense-table-body'),
        expenseEmptyState: document.getElementById('expense-empty-state'),
        membersContainer: document.getElementById('members-container'),
        expensesContainer: document.getElementById('expenses-container'),
        receiptVerificationContainer: document.getElementById('receipt-verification-container'),
        incomeBar: document.getElementById('incomeBar'),
        expenseBar: document.getElementById('expenseBar'),
        netBar: document.getElementById('netBar'),
        totalIncomeCard: document.getElementById('totalIncomeCard'),
        totalExpensesCard: document.getElementById('totalExpensesCard'),
        totalFundsCard: document.getElementById('totalFundsCard'),
        activeMembersCard: document.getElementById('activeMembersCard'),
        pendingVerificationsCard: document.getElementById('pendingVerificationsCard'),
        pendingVerificationsSmall: document.getElementById('pendingVerificationsSmall'),
        recentReceiptsCount: document.getElementById('recentReceiptsCount'),
        sidebarLinks: document.querySelectorAll('[data-sidebar-link]'),
        logoutButton: document.getElementById('logoutButton'),
        payNowButton: document.getElementById('payNowButton'),
        viewDetailsButton: document.getElementById('viewDetailsButton'),
        scanDoneButton: document.getElementById('scanDoneButton'),
        paidButton: document.getElementById('paidButton'),
        submitReceiptButton: document.getElementById('submitReceiptButton'),
        paymentFlowMessage: document.getElementById('paymentFlowMessage'),
        memberReceiptPreview: document.getElementById('memberReceiptPreview'),
        memberPaymentHistoryBody: document.getElementById('memberPaymentHistoryBody'),
        memberPaymentHistoryEmpty: document.getElementById('memberPaymentHistoryEmpty'),
        paymentStatusChip: document.getElementById('paymentStatusChip'),
        copyUpiButton: document.getElementById('copyUpiButton'),
        clubUpiId: document.getElementById('clubUpiId'),
        adminPaymentForm: document.getElementById('adminPaymentForm'),
        adminPaymentMember: document.getElementById('adminPaymentMember'),
        adminPaymentAmount: document.getElementById('adminPaymentAmount'),
        adminPaymentDate: document.getElementById('adminPaymentDate'),
        adminReceiptInput: document.getElementById('adminReceiptInput'),
        adminReceiptPreview: document.getElementById('adminReceiptPreview'),
        memberTransactionForm: document.getElementById('memberTransactionForm'),
        memberTransactionReceiver: document.getElementById('memberTransactionReceiver'),
        memberTransactionReason: document.getElementById('memberTransactionReason'),
        memberTransactionAmount: document.getElementById('memberTransactionAmount'),
        memberTransactionDescription: document.getElementById('memberTransactionDescription'),
        memberTransactionReceipt: document.getElementById('memberTransactionReceipt'),
        reimbursementForm: document.getElementById('reimbursementForm'),
        reimbursementItemName: document.getElementById('reimbursementItemName'),
        reimbursementCategory: document.getElementById('reimbursementCategory'),
        reimbursementQuantity: document.getElementById('reimbursementQuantity'),
        reimbursementUnitPrice: document.getElementById('reimbursementUnitPrice'),
        reimbursementPurchaseDate: document.getElementById('reimbursementPurchaseDate'),
        reimbursementVendorName: document.getElementById('reimbursementVendorName'),
        reimbursementVendorContact: document.getElementById('reimbursementVendorContact'),
        reimbursementLinkedProjectId: document.getElementById('reimbursementLinkedProjectId'),
        reimbursementReceipt: document.getElementById('reimbursementReceipt'),
        projectForm: document.getElementById('projectForm'),
        projectName: document.getElementById('projectName'),
        projectCategory: document.getElementById('projectCategory'),
        projectBudgetAllocated: document.getElementById('projectBudgetAllocated'),
        projectStartDate: document.getElementById('projectStartDate'),
        projectEndDate: document.getElementById('projectEndDate'),
        projectVisibility: document.getElementById('projectVisibility'),
        projectDescription: document.getElementById('projectDescription'),
        eventForm: document.getElementById('eventForm'),
        eventName: document.getElementById('eventName'),
        eventType: document.getElementById('eventType'),
        eventStartDate: document.getElementById('eventStartDate'),
        eventEndDate: document.getElementById('eventEndDate'),
        eventLocation: document.getElementById('eventLocation'),
        eventRegistrationFee: document.getElementById('eventRegistrationFee'),
        eventVisibility: document.getElementById('eventVisibility'),
        eventDescription: document.getElementById('eventDescription'),
        expenseForm: document.getElementById('expenseForm'),
        expenseTitle: document.getElementById('expenseTitle'),
        expenseAmount: document.getElementById('expenseAmount'),
        expenseDate: document.getElementById('expenseDate'),
        expenseCategory: document.getElementById('expenseCategory'),

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
        if (elements.sidebarProfileName) elements.sidebarProfileName.textContent = state.user.name;
        if (elements.sidebarProfileAvatar) {
            elements.sidebarProfileAvatar.innerHTML = getAvatarMarkup({
                name: state.user.name,
                profilePic: state.user.profilePic,
                imageClass: 'sidebar-profile-avatar-image',
                placeholderClass: 'sidebar-profile-avatar-placeholder',
                alt: 'Sidebar profile photo'
            });
        }
        if (elements.topbarAvatar) {
            elements.topbarAvatar.innerHTML = getAvatarMarkup({
                name: state.user.name,
                profilePic: state.user.profilePic,
                imageClass: 'topbar-avatar-image',
                placeholderClass: 'topbar-avatar-placeholder',
                alt: 'Top bar profile photo'
            });
        }
        if (elements.welcomeName) elements.welcomeName.textContent = state.user.name;
        if (elements.welcomeRole) elements.welcomeRole.textContent = state.user.role;
    }

    function getCurrentMemberRecord() {
        return state.members.find((member) => String(member.id) === String(state.user.id)) || state.members[0] || null;
    }

    function getCurrentMemberId() {
        const currentUserRecord = state.users.find((user) => user.email === state.user.email);
        return currentUserRecord ? currentUserRecord.id : null;
    }

    function parseProfileListInput(rawValue) {
        return String(rawValue || '')
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 20);
    }

    function getProfileDraftFromState() {
        const memberRecord = getCurrentMemberRecord() || {};
        return {
            name: state.user.name || '',
            phone: memberRecord.phone || state.user.phone || '',
            skillsText: Array.isArray(memberRecord.skills) && memberRecord.skills.length
                ? memberRecord.skills.join(', ')
                : Array.isArray(state.user.skills) && state.user.skills.length
                    ? state.user.skills.join(', ')
                    : '',
            certificatesText: Array.isArray(memberRecord.certificates) && memberRecord.certificates.length
                ? memberRecord.certificates.join(', ')
                : Array.isArray(state.user.certificates) && state.user.certificates.length
                    ? state.user.certificates.join(', ')
                    : ''
        };
    }

    function setProfileEditMode(isEditing) {
        state.profileEditor.isEditing = Boolean(isEditing);
        if (state.profileEditor.isEditing && !state.profileEditor.draft) {
            state.profileEditor.draft = getProfileDraftFromState();
        }
        if (!state.profileEditor.isEditing) {
            state.profileEditor.draft = null;
            state.profileEditor.saving = false;
            state.profileEditor.clearProfilePic = false;
        }
        renderMemberProfile();
    }

    async function saveMemberProfileFromEditor() {
        if (userRole !== 'member' || state.profileEditor.saving) return;

        const nameInput = document.getElementById('profileEditName');
        const phoneInput = document.getElementById('profileEditPhone');
        const skillsInput = document.getElementById('profileEditSkills');
        const certsInput = document.getElementById('profileEditCertificates');
        const profilePicInput = document.getElementById('profilePicInput');
        const profileCertificatesInput = document.getElementById('profileCertificatesInput');

        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
            showDashboardToast('Name is required.', 'error');
            return;
        }

        state.profileEditor.saving = true;
        renderMemberProfile();

        try {
            // 1) Upload profile picture if selected
            let uploadedProfileUser = null;
            if (!state.profileEditor.clearProfilePic && profilePicInput && profilePicInput.files && profilePicInput.files.length) {
                const f = profilePicInput.files[0];
                const fd = new FormData();
                fd.append('profilePic', f);
                const upRes = await apiRequest('/members/upload-profile-pic', { method: 'POST', body: fd, isForm: true });
                if (upRes && upRes.user) {
                    uploadedProfileUser = upRes.user;
                    state.user.profilePic = upRes.user.profilePic || state.user.profilePic;
                }
            }

            // 2) Upload certificates if any selected
            let uploadedCertsUser = null;
            if (profileCertificatesInput && profileCertificatesInput.files && profileCertificatesInput.files.length) {
                const fd = new FormData();
                Array.from(profileCertificatesInput.files).forEach((file) => fd.append('certificates', file));
                const certRes = await apiRequest('/members/upload-certificates', { method: 'POST', body: fd, isForm: true });
                if (certRes && certRes.user) {
                    uploadedCertsUser = certRes.user;
                    // update local certificates list for immediate preview
                    state.user.certificates = Array.isArray(certRes.user.certificates) ? certRes.user.certificates : state.user.certificates;
                }
            }

            // 3) Build payload for textual fields (merge certificates if upload returned them)
            const payload = {
                name,
                phone: phoneInput ? phoneInput.value.trim() : '',
                skills: parseProfileListInput(skillsInput ? skillsInput.value : ''),
                certificates: uploadedCertsUser && Array.isArray(uploadedCertsUser.certificates) && uploadedCertsUser.certificates.length
                    ? uploadedCertsUser.certificates
                    : parseProfileListInput(certsInput ? certsInput.value : '')
            };

            if (state.profileEditor.clearProfilePic) {
                payload.profilePic = '';
            }

            // 4) Persist textual changes
            const result = await apiRequest('/members/update-my-profile', { method: 'PUT', body: payload });

            if (result && result.user) {
                const hasProfilePic = Object.prototype.hasOwnProperty.call(result.user, 'profilePic');
                state.user = {
                    ...state.user,
                    name: result.user.name,
                    email: result.user.email,
                    phone: result.user.phone || '',
                    skills: Array.isArray(result.user.skills) ? result.user.skills : [],
                    certificates: Array.isArray(result.user.certificates) ? result.user.certificates : [],
                    profilePic: hasProfilePic ? (result.user.profilePic || '') : state.user.profilePic,
                    createdAt: result.user.createdAt || state.user.createdAt || null,
                    updatedAt: result.user.updatedAt || state.user.updatedAt || null
                };

                localStorage.setItem('currentUser', JSON.stringify(result.user));

                if (Array.isArray(state.members) && state.members[0]) {
                    state.members[0] = {
                        ...state.members[0],
                        name: state.user.name,
                        phone: state.user.phone,
                        skills: state.user.skills,
                        certificates: state.user.certificates,
                        profilePic: state.user.profilePic
                    };
                }
            }

            syncHeader();
            state.profileEditor.isEditing = false;
            state.profileEditor.draft = null;
            state.profileEditor.saving = false;
            state.profileEditor.clearProfilePic = false;
            renderMemberProfile();
            showDashboardToast('Profile updated successfully.', 'success');
        } catch (err) {
            state.profileEditor.saving = false;
            renderMemberProfile();
            if (!handleAuthFailure(err)) {
                showDashboardToast(err.message || 'Failed to update profile.', 'error');
            }
        }
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

    function populateMemberReceiverSelect() {
        if (!elements.memberTransactionReceiver) return;
        const memberOptions = state.users.filter((user) => user.role === 'member' && user.id !== state.user.id);
        elements.memberTransactionReceiver.innerHTML = `
            <option value="">Select receiver</option>
            ${memberOptions.map((member) => `<option value="${member.id}">${member.name}</option>`).join('')}
        `;
    }

    function renderEvents() {
        const container = document.getElementById('events-container');
        if (!container) return;

        const events = Array.isArray(state.enterprise && state.enterprise.events) ? state.enterprise.events : [];

        if (events.length === 0) {
            container.innerHTML = userRole === 'member'
                ? '<div class="receipt-empty">No upcoming events available right now. New workshops and competitions will appear here.</div>'
                : '<div class="receipt-empty">No events scheduled yet. Create one from this panel.</div>';
            return;
        }

        container.innerHTML = events.map((event) => `
            <article class="info-card enterprise-card event-card-item">
                <div class="info-card-head">
                    <div>
                        <strong>${event.name || 'Untitled event'}</strong>
                        <span>${event.eventType || 'event'} · ${event.status || 'planning'}</span>
                    </div>
                    <span class="status-chip status-${event.status || 'planning'}">${event.visibility || 'public'}</span>
                </div>
                <div class="info-card-body">
                    <p>${event.description || 'No event description added yet.'}</p>
                    <div class="enterprise-meta-grid">
                        <div><span>Start</span><strong>${formatDate(event.startDate || event.createdAt || new Date())}</strong></div>
                        <div><span>End</span><strong>${formatDate(event.endDate || event.startDate || new Date())}</strong></div>
                        <div><span>Fee</span><strong>${formatCurrency(Number(event.registrationFee) || 0)}</strong></div>
                        <div><span>Location</span><strong>${event.location || 'TBA'}</strong></div>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function renderMemberTransactions() {
        const container = document.getElementById('member-transactions-container');
        if (!container) return;

        const transactions = Array.isArray(state.enterprise && state.enterprise.memberTransactions) ? state.enterprise.memberTransactions : [];
        const visibleTransactions = userRole === 'member'
            ? transactions.filter((transaction) => {
                const senderId = transaction.sender && (transaction.sender._id || transaction.sender.id) ? String(transaction.sender._id || transaction.sender.id) : String(transaction.sender || '');
                const receiverId = transaction.receiver && (transaction.receiver._id || transaction.receiver.id) ? String(transaction.receiver._id || transaction.receiver.id) : String(transaction.receiver || '');
                return senderId === String(state.user.id) || receiverId === String(state.user.id);
            })
            : transactions;

        if (visibleTransactions.length === 0) {
            container.innerHTML = '<div class="receipt-empty">No transfer records available.</div>';
            return;
        }

        container.innerHTML = visibleTransactions.map((transaction) => {
            const sender = transaction.sender && transaction.sender.name ? transaction.sender.name : 'Unknown';
            const receiver = transaction.receiver && transaction.receiver.name ? transaction.receiver.name : 'Unknown';
            return `
                <div class="list-row enterprise-list-row">
                    <div>
                        <strong>${sender} → ${receiver}</strong>
                        <span>${transaction.reason || 'other'} · ${formatDate(transaction.createdAt || transaction.updatedAt || new Date())}</span>
                    </div>
                    <div class="list-amount">${formatCurrency(Number(transaction.amount) || 0)}</div>
                </div>
            `;
        }).join('');
    }

    function renderReimbursements() {
        if (!elements.memberReceiptStatus) return;

        const reimbursements = Array.isArray(state.enterprise && state.enterprise.reimbursements) ? state.enterprise.reimbursements : [];
        const visibleReimbursements = userRole === 'member'
            ? reimbursements.filter((claim) => {
                const memberId = claim.member && (claim.member._id || claim.member.id) ? String(claim.member._id || claim.member.id) : String(claim.member || '');
                return memberId === String(state.user.id);
            })
            : reimbursements;

        if (visibleReimbursements.length === 0) {
            elements.memberReceiptStatus.innerHTML = userRole === 'member'
                ? '<div class="receipt-empty">No expense claims submitted yet.</div>'
                : '<div class="receipt-empty">No reimbursement claims yet.</div>';
            return;
        }

        elements.memberReceiptStatus.innerHTML = visibleReimbursements.map((claim) => {
            const claimant = claim.member && claim.member.name ? claim.member.name : 'Member';
            const projectName = claim.linkedProject && claim.linkedProject.name ? claim.linkedProject.name : '';
            return `
                <div class="receipt-row reimbursement-row">
                    <div>
                        <strong>${claim.itemName || 'Reimbursement'} · ${formatCurrency(Number(claim.totalAmount) || 0)}</strong>
                        <span>${claimant}${projectName ? ` | ${projectName}` : ''} | ${formatDate(claim.purchaseDate || claim.createdAt || new Date())}</span>
                    </div>
                    <span class="status-chip status-${claim.status || 'submitted'}">${claim.status || 'submitted'}</span>
                </div>
            `;
        }).join('');
    }

    function renderContributionAnalytics() {
        const container = document.getElementById('contribution-analytics-container');
        if (!container) return;

        const stats = state.enterprise && state.enterprise.contributionStats ? state.enterprise.contributionStats : {};
        const topContributors = Array.isArray(stats.topContributors) ? stats.topContributors : [];
        const topRequests = Array.isArray(stats.topRequests) ? stats.topRequests : [];

        const contributorRows = topContributors.slice(0, 5).map((entry) => {
            const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
            return `<div class="list-row"><div><strong>${user && user.name ? user.name : 'Member'}</strong><span>${Number(entry.transactionCount) || 0} contributions</span></div><div class="list-amount">${formatCurrency(Number(entry.totalContributed) || 0)}</div></div>`;
        }).join('');

        const requestRows = topRequests.slice(0, 5).map((entry) => {
            const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
            return `<div class="list-row"><div><strong>${user && user.name ? user.name : 'Member'}</strong><span>${Number(entry.transactionCount) || 0} requests</span></div><div class="list-amount">${formatCurrency(Number(entry.totalReceived) || 0)}</div></div>`;
        }).join('');

        container.innerHTML = `
            <div class="enterprise-columns">
                <div class="enterprise-column">
                    <h4>Top Contributors</h4>
                    ${contributorRows || '<div class="receipt-empty">No contribution data yet.</div>'}
                </div>
                <div class="enterprise-column">
                    <h4>Top Requests</h4>
                    ${requestRows || '<div class="receipt-empty">No contribution requests yet.</div>'}
                </div>
            </div>
        `;
    }

    function renderAnnouncements() {
        const container = document.getElementById('announcements-container');
        if (!container || userRole !== 'member') return;

        const events = Array.isArray(state.enterprise && state.enterprise.events) ? state.enterprise.events : [];
        const pendingAmount = Number(state.memberFee && state.memberFee.remainingAmount) || 0;

        const eventAnnouncements = events
            .slice()
            .sort((a, b) => new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0))
            .slice(0, 4)
            .map((event) => ({
                title: `${event.eventType || 'Club'} update: ${event.name || 'Upcoming activity'}`,
                detail: `${formatDate(event.startDate || event.createdAt || new Date())} · ${event.location || 'Venue to be announced'}`
            }));

        const baseAnnouncements = [
            {
                title: pendingAmount > 0 ? 'Membership fee reminder' : 'Membership fee status',
                detail: pendingAmount > 0
                    ? `Your pending fee is ${formatCurrency(pendingAmount)}. Please complete payment and upload receipt.`
                    : 'Your membership fee is currently up to date.'
            },
            {
                title: 'Project assignment updates',
                detail: 'Projects assigned by administrators will appear in your Projects page.'
            }
        ];

        const announcements = [...baseAnnouncements, ...eventAnnouncements].slice(0, 6);
        container.innerHTML = announcements.map((item) => `
            <div class="list-row enterprise-list-row">
                <div>
                    <strong>${item.title}</strong>
                    <span>${item.detail}</span>
                </div>
            </div>
        `).join('');
    }

    function renderMemberProfile() {
        const container = document.getElementById('member-profile-container');
        if (!container || userRole !== 'member') return;

        const memberRecord = getCurrentMemberRecord() || {};
        const memberStatus = String(memberRecord.status || (memberRecord.active === false ? 'inactive' : 'active')).toLowerCase();
        const memberStatusClass = memberStatus === 'active' ? 'active' : 'pending';
        const memberStatusLabel = memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1);
        const joinDate = memberRecord.joinedAt || state.user.createdAt || state.user.joinDate || null;
        const skills = Array.isArray(memberRecord.skills) && memberRecord.skills.length
            ? memberRecord.skills
            : (Array.isArray(state.user.skills) ? state.user.skills : []);
        const certs = Array.isArray(memberRecord.certificates) && memberRecord.certificates.length
            ? memberRecord.certificates
            : (Array.isArray(state.user.certificates) ? state.user.certificates : []);
        const getCertificateName = (certUrl) => {
            const rawName = String(certUrl || '').split('/').pop() || 'Certificate.pdf';
            try {
                return decodeURIComponent(rawName);
            } catch (_) {
                return rawName;
            }
        };

        const renderCertificateCards = (certificateUrls, isEditMode) => {
            if (!Array.isArray(certificateUrls) || !certificateUrls.length) {
                return '<div class="cert-empty-state">No certificates added yet</div>';
            }

            return certificateUrls.map((certUrl) => `
                <article class="cert-doc-card" data-url="${certUrl}">
                    <div class="cert-doc-icon" aria-hidden="true"><i class="fas fa-file-pdf"></i></div>
                    <div class="cert-doc-meta">
                        <div class="cert-doc-name" title="${getCertificateName(certUrl)}">${getCertificateName(certUrl)}</div>
                    </div>
                    <div class="cert-doc-actions">
                        <a class="cert-view-btn" href="${certUrl}" target="_blank" rel="noopener">View</a>
                        ${isEditMode ? `<button class="cert-delete-btn cert-remove" data-url="${certUrl}" type="button" title="Delete certificate">Delete</button>` : ''}
                    </div>
                </article>
            `).join('');
        };

        if (!state.profileEditor.draft) {
            state.profileEditor.draft = getProfileDraftFromState();
        }

        if (!state.profileEditor.isEditing) {
            container.innerHTML = `
                <div class="profile-shell">
                    <aside class="profile-left-panel" aria-label="Profile panel">
                        <div id="profilePicPreview" class="profile-pic-preview profile-avatar-wrap">
                            ${getAvatarMarkup({
                                name: state.user.name,
                                profilePic: state.profileEditor.clearProfilePic ? '' : state.user.profilePic,
                                imageClass: 'profile-thumb profile-thumb-avatar',
                                placeholderClass: 'profile-thumb-placeholder profile-thumb-avatar-placeholder',
                                alt: 'Profile photo'
                            })}
                        </div>
                        <span class="status-pill ${memberStatusClass} profile-member-status">${memberStatusLabel}</span>
                    </aside>
                    <div class="profile-content-wrap">
                        <div class="profile-section-header">
                            <div>
                                <h3 class="profile-section-title">Profile</h3>
                                <p class="profile-section-subtitle">View your member profile and certificate records.</p>
                            </div>
                            <button class="profile-edit-action" id="profileEditButton" type="button"><i class="fas fa-pen"></i> Edit Profile</button>
                        </div>
                        <div class="member-profile-grid enterprise-columns profile-content">
                            <section class="enterprise-column member-profile-column">
                                <h4>Member Details</h4>
                                <div class="member-profile-row"><span class="member-profile-key">Name</span><strong class="member-profile-value">${state.user.name || '—'}</strong></div>
                                <div class="member-profile-row"><span class="member-profile-key">Role</span><strong class="member-profile-value">${state.user.role || 'member'}</strong></div>
                                <div class="member-profile-row"><span class="member-profile-key">Membership ID</span><strong class="member-profile-value">${memberRecord.memberId || memberRecord._id || 'Not assigned'}</strong></div>
                                <div class="member-profile-row"><span class="member-profile-key">Join Date</span><strong class="member-profile-value">${joinDate ? formatDate(joinDate) : 'Not available'}</strong></div>
                            </section>
                            <section class="enterprise-column member-profile-column">
                                <h4>Contact & Skills</h4>
                                <div class="member-profile-row"><span class="member-profile-key">Email</span><strong class="member-profile-value">${state.user.email || '—'}</strong></div>
                                <div class="member-profile-row"><span class="member-profile-key">Phone</span><strong class="member-profile-value">${memberRecord.phone || state.user.phone || 'Not provided'}</strong></div>
                                <div class="member-profile-row"><span class="member-profile-key">Skills</span><strong class="member-profile-value">${skills.length ? skills.join(', ') : 'No skills added yet'}</strong></div>
                                <div class="member-profile-row">
                                    <span class="member-profile-key">Certificates</span>
                                    <div class="member-profile-value">
                                        <div class="cert-doc-list cert-doc-readonly">${renderCertificateCards(certs, false)}</div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            `;

            const editButton = document.getElementById('profileEditButton');
            if (editButton) {
                editButton.addEventListener('click', () => setProfileEditMode(true));
            }
            return;
        }

        container.innerHTML = `
            <div class="profile-shell">
                <aside class="profile-left-panel" aria-label="Profile panel">
                    <div id="profilePicPreview" class="profile-pic-preview profile-avatar-wrap">
                        ${getAvatarMarkup({
                            name: state.user.name,
                            profilePic: state.profileEditor.clearProfilePic ? '' : state.user.profilePic,
                            imageClass: 'profile-thumb profile-thumb-avatar',
                            placeholderClass: 'profile-thumb-placeholder profile-thumb-avatar-placeholder',
                            alt: 'Profile photo'
                        })}
                    </div>
                    <div class="profile-photo-actions">
                        <label for="profilePicInput" class="profile-photo-trigger"><i class="fas fa-camera"></i> Change Photo</label>
                        <button class="profile-photo-remove" id="profileRemovePhotoButton" type="button" ${state.profileEditor.saving ? 'disabled' : ''}><i class="fas fa-trash"></i> Remove Photo</button>
                    </div>
                    <input type="file" id="profilePicInput" class="profile-photo-input" accept="image/*">
                    <span class="status-pill ${memberStatusClass} profile-member-status">${memberStatusLabel}</span>
                </aside>
                <div class="profile-content-wrap">
                    <div class="profile-section-header profile-section-header-edit">
                        <div>
                            <h3 class="profile-section-title">Profile</h3>
                            <p class="profile-section-subtitle">Edit your name, phone, skills, photo, and certificates.</p>
                        </div>
                        <div class="profile-section-actions">
                            <button class="profile-action profile-action-secondary" id="profileCancelButton" type="button" ${state.profileEditor.saving ? 'disabled' : ''}>Cancel</button>
                            <button class="profile-action profile-action-save" id="profileSaveButton" type="button" ${state.profileEditor.saving ? 'disabled' : ''}>${state.profileEditor.saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                    <div class="member-profile-grid enterprise-columns profile-content">
                        <section class="enterprise-column member-profile-column">
                            <h4>Member Details</h4>
                            <div class="member-profile-row"><span class="member-profile-key">Name</span><input class="member-profile-input" id="profileEditName" type="text" maxlength="80" required></div>
                            <div class="member-profile-row"><span class="member-profile-key">Role</span><strong class="member-profile-value">${state.user.role || 'member'}</strong></div>
                            <div class="member-profile-row"><span class="member-profile-key">Membership ID</span><strong class="member-profile-value">${memberRecord.memberId || memberRecord._id || 'Not assigned'}</strong></div>
                            <div class="member-profile-row"><span class="member-profile-key">Join Date</span><strong class="member-profile-value">${joinDate ? formatDate(joinDate) : 'Not available'}</strong></div>
                        </section>
                        <section class="enterprise-column member-profile-column">
                            <h4>Contact & Skills</h4>
                            <div class="member-profile-row"><span class="member-profile-key">Email</span><strong class="member-profile-value">${state.user.email || '—'}</strong></div>
                            <div class="member-profile-row"><span class="member-profile-key">Phone</span><input class="member-profile-input" id="profileEditPhone" type="text" maxlength="20"></div>
                            <div class="member-profile-row"><span class="member-profile-key">Skills</span><textarea class="member-profile-input member-profile-textarea" id="profileEditSkills" rows="2" placeholder="e.g. CAD, Arduino, Embedded C"></textarea></div>
                            <div class="member-profile-row"><span class="member-profile-key">Certificates</span>
                                    <div class="member-profile-value">
                                        <div id="profileCertificatesExisting" class="cert-doc-list cert-doc-edit">${renderCertificateCards(certs, true)}</div>
                                        <div class="cert-upload-toolbar">
                                            <label for="profileCertificatesInput" class="cert-upload-btn"><i class="fas fa-upload"></i> Upload Certificates</label>
                                            <input type="file" id="profileCertificatesInput" class="profile-cert-input" accept=".pdf,application/pdf" multiple>
                                        </div>
                                        <div id="profileCertificatesPending" class="cert-doc-list cert-doc-pending">
                                            <div class="cert-empty-state">No new certificates selected</div>
                                        </div>
                                    </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        `;

        const draft = state.profileEditor.draft || getProfileDraftFromState();
        const nameInput = document.getElementById('profileEditName');
        const phoneInput = document.getElementById('profileEditPhone');
        const skillsInput = document.getElementById('profileEditSkills');
        const certsInput = document.getElementById('profileEditCertificates');
        if (nameInput) nameInput.value = draft.name || '';
        if (phoneInput) phoneInput.value = draft.phone || '';
        if (skillsInput) skillsInput.value = draft.skillsText || '';
        if (certsInput) certsInput.value = draft.certificatesText || '';

        const cancelButton = document.getElementById('profileCancelButton');
        const saveButton = document.getElementById('profileSaveButton');

        if (cancelButton) {
            cancelButton.addEventListener('click', () => setProfileEditMode(false));
        }

        if (saveButton) {
            saveButton.addEventListener('click', saveMemberProfileFromEditor);
        }

        [nameInput, phoneInput, skillsInput, certsInput].forEach((input) => {
            if (!input) return;
            input.addEventListener('input', () => {
                state.profileEditor.draft = {
                    name: nameInput ? nameInput.value : '',
                    phone: phoneInput ? phoneInput.value : '',
                    skillsText: skillsInput ? skillsInput.value : '',
                    certificatesText: certsInput ? certsInput.value : ''
                };
            });
        });

        // Preview selected files for profile photo and certificates
        const profilePicInput = document.getElementById('profilePicInput');
        const profileCertificatesInput = document.getElementById('profileCertificatesInput');
        const profilePicPreview = document.getElementById('profilePicPreview');
        const certsExistingRoot = document.getElementById('profileCertificatesExisting');
        const certsPendingRoot = document.getElementById('profileCertificatesPending');

        if (profilePicInput) {
            profilePicInput.addEventListener('change', () => {
                const f = profilePicInput.files && profilePicInput.files[0];
                if (!f) {
                    if (profilePicPreview) {
                        profilePicPreview.innerHTML = getAvatarMarkup({
                            name: state.user.name,
                            profilePic: state.profileEditor.clearProfilePic ? '' : state.user.profilePic,
                            imageClass: 'profile-thumb profile-thumb-avatar',
                            placeholderClass: 'profile-thumb-placeholder profile-thumb-avatar-placeholder',
                            alt: 'Profile photo'
                        });
                    }
                    return;
                }
                state.profileEditor.clearProfilePic = false;
                if (f.type && f.type.startsWith('image/')) {
                    const url = URL.createObjectURL(f);
                    if (profilePicPreview) profilePicPreview.innerHTML = `<img src="${url}" alt="Profile preview" class="profile-thumb profile-thumb-avatar">`;
                } else {
                    if (profilePicPreview) profilePicPreview.innerHTML = `<div class="profile-thumb-placeholder profile-thumb-avatar-placeholder">${f.name}</div>`;
                }
            });
        }

        const editPhotoButton = document.getElementById('profileEditPhotoButton');
        if (editPhotoButton && profilePicInput) {
            editPhotoButton.addEventListener('click', () => profilePicInput.click());
        }

        const removePhotoButton = document.getElementById('profileRemovePhotoButton');
        if (removePhotoButton && profilePicInput) {
            removePhotoButton.addEventListener('click', () => {
                state.profileEditor.clearProfilePic = true;
                profilePicInput.value = '';
                if (profilePicPreview) {
                    profilePicPreview.innerHTML = getAvatarMarkup({
                        name: state.user.name,
                        profilePic: '',
                        imageClass: 'profile-thumb profile-thumb-avatar',
                        placeholderClass: 'profile-thumb-placeholder profile-thumb-avatar-placeholder',
                        alt: 'Profile photo'
                    });
                }
            });
        }

        if (profileCertificatesInput) {
            profileCertificatesInput.addEventListener('change', () => {
                const files = profileCertificatesInput.files ? Array.from(profileCertificatesInput.files) : [];
                if (!certsPendingRoot) return;

                if (!files.length) {
                    certsPendingRoot.innerHTML = '<div class="cert-empty-state">No new certificates selected</div>';
                    return;
                }

                certsPendingRoot.innerHTML = files.map((f, index) => {
                    const fileUrl = URL.createObjectURL(f);
                    return `
                        <article class="cert-doc-card cert-doc-card-pending" data-index="${index}">
                            <div class="cert-doc-icon" aria-hidden="true"><i class="fas fa-file-pdf"></i></div>
                            <div class="cert-doc-meta">
                                <div class="cert-doc-name" title="${f.name}">${f.name}</div>
                            </div>
                            <div class="cert-doc-actions">
                                <a class="cert-view-btn" href="${fileUrl}" target="_blank" rel="noopener">View</a>
                                <button class="cert-delete-btn cert-remove-pending" data-index="${index}" type="button" title="Remove selected file">Delete</button>
                            </div>
                        </article>
                    `;
                }).join('');
            });
        }

        // Handle removal of already uploaded certificates
        if (certsExistingRoot) {
            certsExistingRoot.addEventListener('click', async (ev) => {
                const btn = ev.target.closest('.cert-remove');
                if (!btn) return;
                const url = btn.dataset.url;
                if (!url) return;
                const confirmRemove = confirm('Remove this certificate from your profile?');
                if (!confirmRemove) return;
                try {
                    const res = await apiRequest('/members/remove-certificate', { method: 'POST', body: { url } });
                    if (res && res.user) {
                        state.user.certificates = Array.isArray(res.user.certificates) ? res.user.certificates : [];
                        // re-render profile to reflect removal
                        renderMemberProfile();
                        showDashboardToast('Certificate removed.', 'success');
                    }
                } catch (err) {
                    if (!handleAuthFailure(err)) showDashboardToast(err.message || 'Failed to remove certificate', 'error');
                }
            });
        }

        // Handle removal of newly selected (unsaved) certificate files
        if (certsPendingRoot && profileCertificatesInput) {
            certsPendingRoot.addEventListener('click', (ev) => {
                const btn = ev.target.closest('.cert-remove-pending');
                if (!btn) return;

                const removeIndex = Number(btn.dataset.index);
                if (!Number.isInteger(removeIndex) || removeIndex < 0) return;

                const currentFiles = profileCertificatesInput.files ? Array.from(profileCertificatesInput.files) : [];
                if (!currentFiles.length) return;

                const transfer = new DataTransfer();
                currentFiles.forEach((file, idx) => {
                    if (idx !== removeIndex) transfer.items.add(file);
                });
                profileCertificatesInput.files = transfer.files;
                profileCertificatesInput.dispatchEvent(new Event('change'));
            });
        }

        if (nameInput) {
            nameInput.focus();
            nameInput.selectionStart = nameInput.value.length;
            nameInput.selectionEnd = nameInput.value.length;
        }
    }

    function renderRulesPortal() {
        const toc = document.getElementById('rulesToc');
        const content = document.getElementById('rulesContent');
        const progressBar = document.getElementById('rulesProgressBar');
        const progressText = document.getElementById('rulesProgressText');
        const searchInput = document.getElementById('rulesSearchInput');
        const acceptanceCheckbox = document.getElementById('sopAcceptanceCheckbox');

        if (!toc || !content) return;

        const currentUser = state.user || {};
        const isAccepted = Boolean(currentUser.sopAcceptedAt && currentUser.sopAcceptedVersion === SOP_VERSION);
        if (acceptanceCheckbox) acceptanceCheckbox.checked = isAccepted;

        toc.innerHTML = SOP_SECTIONS.map((section, index) => `
            <button type="button" class="sop-nav-item" data-section-target="${section.id}" data-section-number="${String(index + 1).padStart(2, '0')}">
                <span>${section.title}</span>
            </button>
        `).join('');

        content.innerHTML = SOP_SECTIONS.map((section, index) => `
            <article class="sop-card" id="${section.id}" data-rules-section data-section-number="${String(index + 1).padStart(2, '0')}">
                <header class="rules-section-header">
                    <h3>${section.title}</h3>
                </header>
                <div class="rules-section-body">${buildSopSectionHtml(section)}</div>
            </article>
        `).join('');

        const sectionCards = Array.from(content.querySelectorAll('[data-rules-section]'));
        const navItems = Array.from(toc.querySelectorAll('[data-section-target]'));

        const setActiveSection = (sectionId) => {
            navItems.forEach((button) => {
                const isActive = button.getAttribute('data-section-target') === sectionId;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-current', isActive ? 'true' : 'false');
            });
        };

        if (sectionCards[0]) {
            setActiveSection(sectionCards[0].id);
        }

        const updateProgress = () => {
            const viewportTop = window.scrollY + 120;
            let visibleCount = 0;
            sectionCards.forEach((card) => {
                const top = card.getBoundingClientRect().top + window.scrollY;
                if (top <= viewportTop) visibleCount += 1;
            });
            const pct = Math.max(0, Math.min(100, Math.round((visibleCount / SOP_SECTIONS.length) * 100)));
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `${pct}% read`;
        };

        toc.querySelectorAll('[data-section-target]').forEach((button) => {
            button.addEventListener('click', () => {
                const target = document.getElementById(button.getAttribute('data-section-target'));
                if (target) {
                    setActiveSection(target.id);
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        const observer = 'IntersectionObserver' in window
            ? new IntersectionObserver((entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0] && visible[0].target && visible[0].target.id) {
                    setActiveSection(visible[0].target.id);
                }
            }, {
                root: null,
                rootMargin: '-20% 0px -60% 0px',
                threshold: [0.2, 0.4, 0.6, 0.8]
            })
            : null;

        if (observer) {
            sectionCards.forEach((card) => observer.observe(card));
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                sectionCards.forEach((card) => {
                    const match = !query || card.textContent.toLowerCase().includes(query);
                    card.style.display = match ? '' : 'none';
                });

                const firstVisible = sectionCards.find((card) => card.style.display !== 'none');
                if (firstVisible) {
                    setActiveSection(firstVisible.id);
                }
            });
        }

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });

        const saveAcceptanceBtn = document.getElementById('saveSopAcceptanceButton');
        if (saveAcceptanceBtn && acceptanceCheckbox) {
            saveAcceptanceBtn.addEventListener('click', async () => {
                if (!acceptanceCheckbox.checked) {
                    showDashboardToast('Please check the acknowledgement box first.', 'error');
                    return;
                }

                try {
                    const result = await apiRequest('/members/accept-sop', {
                        method: 'POST',
                        body: { version: SOP_VERSION }
                    });

                    if (result && result.user) {
                        state.user.sopAcceptedAt = result.user.sopAcceptedAt;
                        state.user.sopAcceptedVersion = result.user.sopAcceptedVersion;
                        localStorage.setItem('currentUser', JSON.stringify({
                            ...currentUser,
                            sopAcceptedAt: result.user.sopAcceptedAt,
                            sopAcceptedVersion: result.user.sopAcceptedVersion
                        }));
                    }

                    showDashboardToast('SOP acknowledgement saved.', 'success');
                } catch (err) {
                    if (!handleAuthFailure(err)) {
                        showDashboardToast(err.message || 'Failed to save acknowledgement.', 'error');
                    }
                }
            });
        }

        const printBtn = document.getElementById('printRulesButton');
        if (printBtn) printBtn.addEventListener('click', () => window.print());
    }

    const SOP_VERSION = 'official-sop-v1';
    const SOP_SECTIONS = [
        {
            id: 'purpose',
            title: '1. Purpose',
            text: 'This SOP defines the operational structure, membership policies, financial guidelines, and project execution process for Texcelrators Robotics Club to ensure smooth functioning, transparency, and efficiency.'
        },
        {
            id: 'objectives',
            title: '2. Objectives',
            bullets: [
                'Promote robotics, automation, and AI among students.',
                'Provide hands-on learning experiences through technical projects.',
                'Organize workshops, competitions, and guest lectures.',
                'Represent the college in national and international robotics competitions.',
                'Collaborate with industry experts, companies, and academic institutions.'
            ]
        },
        {
            id: 'membership-guidelines',
            title: '3. Membership Guidelines',
            bullets: [
                'Eligibility: Open to all students of the college from any branch.',
                'Membership Categories:',
                'New Members: Students joining the club for the first time.',
                'Renewing Members: Students who have completed one year in the club.',
                'Fee Structure:',
                'New Members: ₹10,000 per year (payable in two installments of ₹5,000 each).',
                'Renewing Members: ₹2,000 per year.',
                'Responsibilities:',
                'Active participation in club projects, competitions, and meetings.',
                'Contribution to club activities, mentoring juniors, and maintaining discipline.',
                'Non-Payment Penalty:',
                'If a member fails to pay the second installment on time, they will be given a grace period of 15 days.',
                'After that, they will be temporarily suspended from club activities until the payment is made',
                'Renewing members must pay within the first month of the new term to maintain active status.'
            ]
        },
        {
            id: 'leadership-core-team-selection',
            title: '4. Leadership & Core Team Selection',
            bullets: [
                'Organizational Structure:',
                'President: Leads the club and oversees all activities.',
                'Vice President: Assists the president and manages internal affairs.',
                'General Secretary: Maintains records, documentation, and official communication.',
                'Technical Head: Leads technical projects, training, and innovation initiatives.',
                'Event Coordinator: Manages workshops, competitions, and logistics.',
                'Treasurer: Handles financial transactions, budgeting, and sponsorships.',
                'Mentors: Alumni or senior members providing technical and strategic guidance.',
                'Selection Process:',
                'The President and Vice President will be selected based on leadership skills, past contributions, and performance in the club.',
                'Other core team positions will be appointed based on interviews, project involvement, and experience.',
                'Leadership roles are held for one academic year, with re-elections at the end of the term.'
            ]
        },
        {
            id: 'meetings-communication',
            title: '5. Meetings & Communication',
            bullets: [
                'Regular Meetings: Weekly or bi-weekly to discuss project updates and upcoming events.',
                'Emergency Meetings: Conducted as needed for urgent decisions or competition preparations.',
                'Communication Platforms: WhatsApp/Discord for quick updates, and email for formal communication.',
                'Meeting Documentation: The General Secretary records meeting minutes, which are shared with members.'
            ]
        },
        {
            id: 'project-execution-lab-access',
            title: '6. Project Execution & Lab Access',
            bullets: [
                'Project Assignment: Teams are formed based on interest and expertise. Each project must have a team leader and mentor.',
                'Lab & Equipment Access:',
                'Members can use club resources but must follow proper handling procedures.',
                'Any damage to equipment due to negligence may require reimbursement from the responsible member(s).',
                'Access to certain high-cost or sensitive equipment may require prior approval from the core team.',
                'Intellectual Property: Any robotics projects developed under the club belong to the team and the club, and cannot be used for personal gain without approval.'
            ]
        },
        {
            id: 'financial-policy',
            title: '7. Financial Policy',
            bullets: [
                'Membership Fees:',
                'New Members: ₹10,000 per year (payable in two installments of ₹5,000 each).',
                'Renewing Members: ₹2,000 per year.',
                'Payment Schedule:',
                'New Members: ₹5,000 at the time of joining + ₹5,000 at mid-year.',
                'Renewing Members: ₹2,000 at the start of the new membership cycle.',
                'Expenses Not Covered:',
                'Accommodation and food costs for competitions, workshops, and events must be borne separately by members.',
                'Travel Fee Reimbursement:',
                'Travel expenses for club-related activities will be refunded by the college.',
                'Reimbursement applies only to sleeper class train tickets (other classes or modes of transport will not be covered).',
                'If members travel in AC class, the refund will be given equivalent to a sleeper class fare.',
                'Members must submit valid travel receipts and required documents for reimbursement.',
                'Utilization of Funds:',
                'Purchasing robotics kits, components, and tools.',
                'Organizing workshops, competitions, and guest lectures.',
                'Maintenance and upgrades of lab infrastructure.',
                'Participation in national and international competitions.',
                'Competition Winnings:',
                'The full amount won in competitions will be given to the students who participated.',
                'The club will not take any percentage of the prize money.',
                'Financial Transparency: The Treasurer will maintain detailed financial records, and an annual budget report will be shared with members.'
            ]
        },
        {
            id: 'event-management',
            title: '8. Event Management',
            bullets: [
                'Workshops & Training: Organized to train members in robotics, AI, and automation.',
                'Competitions:',
                'The club will participate in and host robotics competitions.',
                'Members selected for competitions must demonstrate commitment and technical skills.',
                'Collaborations: The club will seek tie-ups with companies, research institutions, and alumni to provide opportunities for members.',
                'Feedback & Improvement: After every event, a review meeting will be conducted to discuss improvements.'
            ]
        },
        {
            id: 'code-of-conduct',
            title: '9. Code of Conduct',
            bullets: [
                'Members must maintain professionalism, teamwork, and respect.',
                'Any misconduct, rule violation, or unethical behaviour (e.g., plagiarism, misuse of funds, or damaging club property) may result in suspension or termination.',
                'Confidentiality: Members must not share confidential club projects or strategies with external organizations without approval.'
            ]
        },
        {
            id: 'amendments-review',
            title: '10. Amendments & Review',
            bullets: [
                'This SOP will be reviewed annually, and necessary updates will be made.',
                'Any changes require approval from the core team and faculty advisor.'
            ]
        },
        {
            id: 'approval-signatures',
            title: '11. Approval & Signatures',
            bullets: [
                'Approved by:',
                'Ashutosh Maske',
                'Founder & Faculty Advisor, Texcelrators Robotics Club',
                'Signature - _____________________',
                'Date - __________________________'
            ]
        }
    ];

    function buildSopSectionHtml(section) {
        if (section.text) {
            return `<p>${section.text}</p>`;
        }

        if (Array.isArray(section.bullets)) {
            return `<ul>${section.bullets.map((item) => `<li>${item}</li>`).join('')}</ul>`;
        }

        return '';
    }

    function renderRulesPortal() {
        const toc = document.getElementById('rulesToc');
        const content = document.getElementById('rulesContent');
        const progressBar = document.getElementById('rulesProgressBar');
        const progressText = document.getElementById('rulesProgressText');
        const searchInput = document.getElementById('rulesSearchInput');
        const acceptanceCheckbox = document.getElementById('sopAcceptanceCheckbox');

        if (!toc || !content) return;

        const currentUser = state.user || {};
        const acceptedVersion = currentUser.sopAcceptedVersion || '';
        const isAccepted = Boolean(currentUser.sopAcceptedAt && acceptedVersion === SOP_VERSION);

        if (acceptanceCheckbox) acceptanceCheckbox.checked = isAccepted;

        toc.innerHTML = SOP_SECTIONS.map((section) => `
            <button type="button" class="rules-toc-link" data-section-target="${section.id}">
                <span>${section.title}</span>
            </button>
        `).join('');

        content.innerHTML = SOP_SECTIONS.map((section) => `
            <section class="rules-section-card" id="${section.id}" data-rules-section>
                <button type="button" class="rules-section-header" data-section-toggle="${section.id}">
                    <span>${section.title}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="rules-section-body">${buildSopSectionHtml(section)}</div>
            </section>
        `).join('');

        const sectionCards = Array.from(content.querySelectorAll('[data-rules-section]'));

        const updateProgress = () => {
            const viewportTop = window.scrollY + 120;
            let visibleCount = 0;
            sectionCards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const top = rect.top + window.scrollY;
                if (top <= viewportTop) visibleCount += 1;
            });
            const pct = Math.max(0, Math.min(100, Math.round((visibleCount / SOP_SECTIONS.length) * 100)));
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `${pct}% read`;
        };

        const scrollToSection = (id) => {
            const target = document.getElementById(id);
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        toc.querySelectorAll('[data-section-target]').forEach((button) => {
            button.addEventListener('click', () => scrollToSection(button.getAttribute('data-section-target')));
        });

        content.querySelectorAll('[data-section-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const card = button.closest('.rules-section-card');
                if (!card) return;
                card.classList.toggle('is-collapsed');
            });
        });

        const expandAllBtn = document.getElementById('expandAllRulesButton');
        const collapseAllBtn = document.getElementById('collapseAllRulesButton');

        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => sectionCards.forEach((card) => card.classList.remove('is-collapsed')));
        }
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => sectionCards.forEach((card) => card.classList.add('is-collapsed')));
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                sectionCards.forEach((card) => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = !query || text.includes(query) ? '' : 'none';
                });
            });
        }

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });

        const saveAcceptanceBtn = document.getElementById('saveSopAcceptanceButton');
        if (saveAcceptanceBtn && acceptanceCheckbox) {
            saveAcceptanceBtn.addEventListener('click', async () => {
                if (!acceptanceCheckbox.checked) {
                    showDashboardToast('Please check the acknowledgement box first.', 'error');
                    return;
                }

                try {
                    const result = await apiRequest('/members/accept-sop', {
                        method: 'POST',
                        body: { version: SOP_VERSION }
                    });

                    if (result && result.user) {
                        state.user.sopAcceptedAt = result.user.sopAcceptedAt;
                        state.user.sopAcceptedVersion = result.user.sopAcceptedVersion;
                        localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, sopAcceptedAt: result.user.sopAcceptedAt, sopAcceptedVersion: result.user.sopAcceptedVersion }));
                    }

                    showDashboardToast('SOP acknowledgement saved.', 'success');
                } catch (err) {
                    if (!handleAuthFailure(err)) {
                        showDashboardToast(err.message || 'Failed to save acknowledgement.', 'error');
                    }
                }
            });
        }

        const printBtn = document.getElementById('printRulesButton');
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
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

        if (elements.paymentStatusChip) {
            const paid = Number(state.memberFee.paidAmount) || 0;
            const total = Number(state.memberFee.totalFee) || 0;
            const settled = total > 0 && paid >= total;
            elements.paymentStatusChip.textContent = settled ? 'Paid' : 'Pending';
            elements.paymentStatusChip.className = `status-chip ${settled ? 'status-active' : 'status-pending'}`;
        }

        const progressFill = document.getElementById('paymentProgress');
        if (progressFill) {
            progressFill.style.width = `${state.memberFee.progress}%`;
        }

        if (elements.qrCode) {
            // Try to auto-crop the source QR image in-browser so only the QR square remains.
            // Falls back to background image if cropping fails.
            (function cropAndSetQr(targetEl, srcUrl) {
                const img = new Image();
                img.src = srcUrl;
                img.onload = () => {
                    try {
                        const w = img.naturalWidth;
                        const h = img.naturalHeight;
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const data = ctx.getImageData(0, 0, w, h).data;
                        const threshold = 250; // consider pixel 'non-white' if any channel < threshold
                        let minX = w, minY = h, maxX = 0, maxY = 0;
                        for (let y = 0; y < h; y++) {
                            for (let x = 0; x < w; x++) {
                                const i = (y * w + x) * 4;
                                const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
                                if (a > 16 && (r < threshold || g < threshold || b < threshold)) {
                                    if (x < minX) minX = x;
                                    if (y < minY) minY = y;
                                    if (x > maxX) maxX = x;
                                    if (y > maxY) maxY = y;
                                }
                            }
                        }
                        // if no dark pixels found, fallback
                        if (minX > maxX || minY > maxY) throw new Error('no-qr-found');
                        // add small padding
                        const pad = Math.round(Math.max((maxX-minX), (maxY-minY)) * 0.06);
                        minX = Math.max(0, minX - pad);
                        minY = Math.max(0, minY - pad);
                        maxX = Math.min(w, maxX + pad);
                        maxY = Math.min(h, maxY + pad);
                        const cw = maxX - minX;
                        const ch = maxY - minY;
                        const out = document.createElement('canvas');
                        const size = Math.max(cw, ch);
                        out.width = size;
                        out.height = size;
                        const octx = out.getContext('2d');
                        // fill white background (preserve QR contrast)
                        octx.fillStyle = '#ffffff';
                        octx.fillRect(0,0,size,size);
                        // draw cropped area centered
                        octx.drawImage(canvas, minX, minY, cw, ch, (size - cw)/2, (size - ch)/2, cw, ch);
                        const dataUrl = out.toDataURL('image/png');
                        targetEl.innerHTML = `<img class="qr-img-cropped" src="${dataUrl}" alt="Payment QR">`;
                    } catch (err) {
                        // fallback to background div if any error (CORS or detection failure)
                        targetEl.innerHTML = `<div class="qr-bg" style="background-image:url('${srcUrl}');" aria-hidden="true"></div>`;
                    }
                };
                img.onerror = () => {
                    targetEl.innerHTML = `<div class="qr-bg" style="background-image:url('${srcUrl}');" aria-hidden="true"></div>`;
                };
            })(elements.qrCode, 'assets/images/payment-qr.png');
        }

        renderMemberPaymentHistory();

        updatePaymentFlowUI();
    }

    function renderMemberPaymentHistory() {
        if (!elements.memberPaymentHistoryBody) return;

        const paymentRows = state.payments
            .filter((payment) => {
                const paymentUser = state.users.find((user) => user.id === payment.userId);
                return paymentUser && paymentUser.name === state.user.name;
            })
            .sort((a, b) => String(b.date).localeCompare(String(a.date)));

        if (!paymentRows.length) {
            elements.memberPaymentHistoryBody.innerHTML = '';
            if (elements.memberPaymentHistoryEmpty) elements.memberPaymentHistoryEmpty.style.display = 'block';
            return;
        }

        if (elements.memberPaymentHistoryEmpty) elements.memberPaymentHistoryEmpty.style.display = 'none';

        elements.memberPaymentHistoryBody.innerHTML = paymentRows.map((payment) => {
            const status = payment.status || 'pending';
            const normalizedStatus = String(status).toLowerCase();
            const canDownloadReceipt = normalizedStatus === 'verified' || normalizedStatus === 'approved';
            const receiptCell = payment.receiptPreview && payment.receiptType === 'image'
                ? `<img src="${payment.receiptPreview}" alt="Receipt" class="receipt-thumb">`
                : `<span class="receipt-file-name">${payment.receiptName || 'NA'}</span>`;
            const downloadLink = canDownloadReceipt && payment.receiptPreview
                ? `<a href="${payment.receiptPreview}" class="dashboard-button" download>Download</a>`
                : '';

            return `
                <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td>${formatCurrency(payment.amount)}</td>
                    <td><span class="status-chip status-${status}">${status}</span></td>
                    <td><div class="receipt-cell">${receiptCell}</div></td>
                    <td>${downloadLink}</td>
                </tr>
            `;
        }).join('');
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
        if (!elements.expenseTableBody) return;

        if (!Array.isArray(state.expenses) || state.expenses.length === 0) {
            elements.expenseTableBody.innerHTML = '';
            if (elements.expenseEmptyState) elements.expenseEmptyState.style.display = 'block';
            return;
        }

        if (elements.expenseEmptyState) elements.expenseEmptyState.style.display = 'none';

        elements.expenseTableBody.innerHTML = state.expenses.map((expense) => `
            <tr>
                <td>
                    <div class="member-cell">
                        <span class="member-avatar" aria-hidden="true">${String(expense.title || 'E').trim().charAt(0).toUpperCase()}</span>
                        <span class="member-name">${expense.title || 'Untitled Expense'}</span>
                    </div>
                </td>
                <td><span class="status-chip status-pending">${expense.category || 'Other'}</span></td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${formatDate(expense.date)}</td>
                <td><span class="status-chip status-active">Recorded</span></td>
                <td class="expense-actions">
                    <button type="button" class="dashboard-button">View</button>
                </td>
            </tr>
        `).join('');
    }

    function renderMemberReceiptStatus() {
        renderReimbursements();
    }

    function renderVerificationQueue() {
        if (!elements.receiptVerificationContainer || userRole !== 'admin') return;
        const pendingPayments = state.payments.filter((payment) => payment.status === 'pending');

        if (pendingPayments.length === 0) {
            elements.receiptVerificationContainer.innerHTML = `
                <div class="verification-empty">
                    <div class="verification-empty-icon"><i class="fas fa-shield-check"></i></div>
                    <strong>No pending verifications</strong>
                    <span>Everything is up to date</span>
                </div>
            `;
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
                            <td>
                                <div class="member-cell">
                                    <span class="member-avatar" aria-hidden="true">${String(member.name || 'M').trim().charAt(0).toUpperCase()}</span>
                                    <span class="member-name">${member.name}</span>
                                </div>
                            </td>
                            ${isAdmin ? `<td><span class="status-chip status-${member.status || 'inactive'}">${formatMemberStatus(member.status)}</span></td>` : ''}
                            <td>${formatCurrency(member.paid)}</td>
                            <td>${formatCurrency(member.remaining)}</td>
                            ${isAdmin ? `
                                <td class="member-actions-cell">
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

        const recentActivity = [];

        state.members.slice(0, 2).forEach((member) => {
            recentActivity.push({
                icon: 'fa-user-plus',
                title: 'Member joined',
                meta: member.name,
                amount: null,
                date: member.createdAt || member.joinedAt || new Date().toISOString(),
                tone: 'neutral'
            });
        });

        state.payments.slice(0, 2).forEach((payment) => {
            const paymentUser = state.users.find((user) => user.id === payment.userId);
            recentActivity.push({
                icon: 'fa-credit-card',
                title: 'Payment recorded',
                meta: paymentUser ? paymentUser.name : 'Member payment',
                amount: payment.amount,
                date: payment.date,
                tone: payment.status === 'verified' ? 'success' : 'warning'
            });
        });

        state.expenses.slice(0, 2).forEach((expense) => {
            recentActivity.push({
                icon: 'fa-receipt',
                title: 'Expense added',
                meta: expense.title,
                amount: expense.amount,
                date: expense.date,
                tone: 'danger'
            });
        });

        const verifiedPayments = state.payments.filter((payment) => payment.status === 'verified').slice(0, 1);
        verifiedPayments.forEach((payment) => {
            const paymentUser = state.users.find((user) => user.id === payment.userId);
            recentActivity.push({
                icon: 'fa-circle-check',
                title: 'Verification approved',
                meta: paymentUser ? paymentUser.name : 'Payment verified',
                amount: payment.amount,
                date: payment.date,
                tone: 'success'
            });
        });

        recentActivity.sort((a, b) => String(b.date).localeCompare(String(a.date)));

        elements.expensesContainer.innerHTML = recentActivity.length === 0
            ? '<div class="receipt-empty">No recent activity.</div>'
            : recentActivity.slice(0, 4).map((item) => `
                <div class="activity-item recent-activity-item recent-${item.tone}">
                    <div class="activity-leading">
                        <div class="activity-icon"><i class="fas ${item.icon}"></i></div>
                        <div>
                            <strong>${item.title}</strong>
                            <span>${item.meta}</span>
                        </div>
                    </div>
                    <div class="activity-trailing">
                        ${item.amount != null ? `<div class="list-amount ${item.tone === 'danger' ? 'is-danger' : 'is-success'}">${formatCurrency(item.amount)}</div>` : ''}
                        <div class="activity-time">${formatDate(item.date)}</div>
                    </div>
                </div>
            `).join('');
    }

    function renderFinance() {
        if (elements.totalIncomeCard) elements.totalIncomeCard.textContent = formatCurrency(state.finance.totalIncome);
        if (elements.totalExpensesCard) elements.totalExpensesCard.textContent = formatCurrency(state.finance.totalExpenses);
        if (elements.totalFundsCard) elements.totalFundsCard.textContent = formatCurrency(state.finance.totalFunds);

        const activeMembers = state.members.filter((member) => member.active !== false && member.status !== 'inactive' && member.status !== 'removed').length;
        const pendingVerifications = Array.isArray(state.payments) ? state.payments.filter((payment) => payment.status === 'pending').length : 0;
        const recentReceipts = Array.isArray(state.payments) ? state.payments.filter((payment) => Boolean(payment.receiptName || payment.receiptPreview)).length : 0;

        if (elements.activeMembersCard) elements.activeMembersCard.textContent = activeMembers ? String(activeMembers) : '—';
        if (elements.pendingVerificationsCard) elements.pendingVerificationsCard.textContent = pendingVerifications ? String(pendingVerifications) : '—';
        if (elements.pendingVerificationsSmall) elements.pendingVerificationsSmall.textContent = pendingVerifications ? String(pendingVerifications) : '—';
        if (elements.recentReceiptsCount) elements.recentReceiptsCount.textContent = recentReceipts ? String(recentReceipts) : '—';

        const clubSummaryFundsCard = document.getElementById('clubSummaryFundsCard');
        const clubSummaryMembersCard = document.getElementById('clubSummaryMembersCard');
        const recentClubMembersList = document.getElementById('recentClubMembersList');
        const totalMembers = Array.isArray(state.members) ? state.members.length : 0;
        const recentMembers = Array.isArray(state.members) ? state.members.slice(0, 5) : [];

        if (clubSummaryFundsCard) clubSummaryFundsCard.textContent = formatCurrency(Number(state.finance.totalFunds) || 0);
        if (clubSummaryMembersCard) clubSummaryMembersCard.textContent = String(totalMembers || 0);
        if (recentClubMembersList) {
            recentClubMembersList.innerHTML = recentMembers.length
                ? recentMembers.map((member) => `
                    <div class="activity-item" style="padding:8px 6px;">
                        <div style="display:flex;gap:10px;align-items:center;">
                            <div class="activity-icon" aria-hidden="true"><i class="fas fa-user"></i></div>
                            <div style="line-height:1.05;">
                                <strong style="display:block;">${(member && member.name) ? member.name : 'Member'}</strong>
                                <small class="dashboard-subtle" style="font-size:0.85rem; color:var(--text-secondary);">${(member && (member.status === 'active' || member.active)) ? 'Active' : ''}</small>
                            </div>
                        </div>
                    </div>
                `).join('')
                : '';
        }

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
            populateAdminMemberSelect();
            populateMemberReceiverSelect();
            renderProjects();
            renderEvents();
            renderMemberTransactions();
            renderReimbursements();
            renderContributionAnalytics();
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
            populateAdminMemberSelect();
            populateMemberReceiverSelect();
            renderProjects();
            renderEvents();
            renderMemberTransactions();
            renderReimbursements();
            renderContributionAnalytics();
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
            populateAdminMemberSelect();
            populateMemberReceiverSelect();
            renderProjects();
            renderEvents();
            renderMemberTransactions();
            renderReimbursements();
            renderContributionAnalytics();
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
            renderProjects();
            renderEvents();
            renderMemberTransactions();
            renderReimbursements();
            renderContributionAnalytics();
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
            populateMemberReceiverSelect();
            renderProjects();
            renderEvents();
            renderMemberTransactions();
            renderReimbursements();
            renderContributionAnalytics();
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

    function focusDashboardForm(sectionId, selector) {
        activateDashboardSection(sectionId);
        window.setTimeout(() => {
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            const targetField = selector ? document.querySelector(selector) : null;
            if (targetField && typeof targetField.focus === 'function') {
                targetField.focus({ preventScroll: true });
            }
        }, 50);
    }

    async function createProject(event) {
        event.preventDefault();

        const name = elements.projectName?.value?.trim();
        const category = elements.projectCategory?.value;
        const budgetAllocated = Number(elements.projectBudgetAllocated?.value);
        const startDate = elements.projectStartDate?.value;
        const endDate = elements.projectEndDate?.value;
        const visibility = elements.projectVisibility?.value || 'team_only';
        const description = elements.projectDescription?.value?.trim() || '';

        if (!name || !category || !budgetAllocated || !startDate) {
            alert('Please fill in the project name, category, budget, and start date.');
            return;
        }

        try {
            await apiRequest('/projects/create', {
                method: 'POST',
                body: {
                    name,
                    category,
                    budgetAllocated,
                    startDate,
                    endDate: endDate || undefined,
                    visibility,
                    description
                }
            });

            elements.projectForm?.reset();
            await refreshDashboardFromApi();
            populateAdminMemberSelect();
            populateMemberReceiverSelect();
            renderProjects();
            renderContributionAnalytics();
            showDashboardToast('Project created successfully.', 'success');
        } catch (err) {
            console.error('Create project failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to create project');
            }
        }
    }

    async function createEvent(event) {
        event.preventDefault();

        const name = elements.eventName?.value?.trim();
        const eventType = elements.eventType?.value;
        const startDate = elements.eventStartDate?.value;
        const endDate = elements.eventEndDate?.value;
        const location = elements.eventLocation?.value?.trim() || '';
        const registrationFee = Number(elements.eventRegistrationFee?.value || 0);
        const visibility = elements.eventVisibility?.value || 'public';
        const description = elements.eventDescription?.value?.trim() || '';

        if (!name || !eventType || !startDate || !endDate) {
            alert('Please fill in the event name, type, start date, and end date.');
            return;
        }

        try {
            await apiRequest('/events/create', {
                method: 'POST',
                body: {
                    name,
                    eventType,
                    startDate,
                    endDate,
                    location,
                    registrationFee,
                    visibility,
                    description
                }
            });

            elements.eventForm?.reset();
            await refreshDashboardFromApi();
            renderEvents();
            renderContributionAnalytics();
            showDashboardToast('Event created successfully.', 'success');
        } catch (err) {
            console.error('Create event failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to create event');
            }
        }
    }

    async function createMemberTransaction(event) {
        event.preventDefault();

        const receiverId = elements.memberTransactionReceiver?.value;
        const amount = Number(elements.memberTransactionAmount?.value);
        const reason = elements.memberTransactionReason?.value;
        const description = elements.memberTransactionDescription?.value?.trim() || '';
        const receiptFile = elements.memberTransactionReceipt?.files && elements.memberTransactionReceipt.files[0];

        if (!receiverId || !amount || !reason) {
            alert('Please choose a receiver, amount, and reason.');
            return;
        }

        const formData = new FormData();
        formData.append('receiverId', receiverId);
        formData.append('amount', String(amount));
        formData.append('reason', reason);
        formData.append('description', description);
        if (receiptFile) {
            formData.append('receipt', receiptFile);
        }

        try {
            await apiRequest('/member-transactions/create', { method: 'POST', body: formData, isForm: true });
            elements.memberTransactionForm?.reset();
            await refreshDashboardFromApi();
            populateAdminMemberSelect();
            populateMemberReceiverSelect();
            renderMemberTransactions();
            renderContributionAnalytics();
            showDashboardToast('Transfer created successfully.', 'success');
        } catch (err) {
            console.error('Create member transaction failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to create transfer');
            }
        }
    }

    async function createReimbursement(event) {
        event.preventDefault();

        const itemName = elements.reimbursementItemName?.value?.trim();
        const category = elements.reimbursementCategory?.value;
        const quantity = Number(elements.reimbursementQuantity?.value);
        const unitPrice = Number(elements.reimbursementUnitPrice?.value);
        const purchaseDate = elements.reimbursementPurchaseDate?.value;
        const vendorName = elements.reimbursementVendorName?.value?.trim() || '';
        const vendorContact = elements.reimbursementVendorContact?.value?.trim() || '';
        const linkedProjectId = elements.reimbursementLinkedProjectId?.value?.trim() || '';
        const receiptFile = elements.reimbursementReceipt?.files && elements.reimbursementReceipt.files[0];

        if (!itemName || !category || !quantity || !unitPrice || !purchaseDate || !receiptFile) {
            alert('Please complete all reimbursement fields and attach a receipt.');
            return;
        }

        const formData = new FormData();
        formData.append('itemName', itemName);
        formData.append('category', category);
        formData.append('quantity', String(quantity));
        formData.append('unitPrice', String(unitPrice));
        formData.append('purchaseDate', purchaseDate);
        formData.append('vendor', JSON.stringify({ name: vendorName, contact: vendorContact }));
        if (linkedProjectId) {
            formData.append('linkedProjectId', linkedProjectId);
        }
        formData.append('receipt', receiptFile);

        try {
            await apiRequest('/reimbursements/submit', { method: 'POST', body: formData, isForm: true });
            elements.reimbursementForm?.reset();
            await refreshDashboardFromApi();
            renderReimbursements();
            renderContributionAnalytics();
            showDashboardToast('Reimbursement submitted successfully.', 'success');
        } catch (err) {
            console.error('Create reimbursement failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to submit reimbursement');
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

                // toggle active state on sidebar links
                document.querySelectorAll('[data-sidebar-link]').forEach((l) => l.classList.remove('is-active'));
                link.classList.add('is-active');

                // show only the selected dashboard section
                document.querySelectorAll('[data-dashboard-section]').forEach((section) => {
                    section.classList.remove('is-active');
                    section.style.display = 'none';
                });

                targetSection.classList.add('is-active');
                targetSection.style.display = '';
                // show any sections that are linked to this target (e.g., club summary shown with analytics)
                showLinkedSections(targetId);
                updateDashboardWorkspaceState(targetId);
            });
        });
    }

    function updateDashboardWorkspaceState(activeSectionId) {
        if (!dashboardRootEl) return;

        const isMember = userRole === 'member';
        const isOverview = activeSectionId === 'analytics';

        dashboardRootEl.classList.toggle('is-member', isMember);
        dashboardRootEl.classList.toggle('member-overview-active', isMember && isOverview);
        dashboardRootEl.setAttribute('data-active-section', activeSectionId || '');
    }

    function showLinkedSections(activeSectionId) {
        if (!activeSectionId) return;
        const selector = `[data-dashboard-section][data-dashboard-show-with="${activeSectionId}"]`;
        document.querySelectorAll(selector).forEach((s) => {
            s.classList.add('is-active');
            s.style.display = '';
        });
    }

    function activateDashboardSection(targetId) {
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;
        // activate matching sidebar link if exists
        document.querySelectorAll('[data-sidebar-link]').forEach((link) => link.classList.remove('is-active'));
        const matchingLink = document.querySelector(`[data-sidebar-link][data-target="${targetId}"]`);
        if (matchingLink) matchingLink.classList.add('is-active');

        document.querySelectorAll('[data-dashboard-section]').forEach((section) => {
            section.classList.remove('is-active');
            section.style.display = 'none';
        });

        targetSection.classList.add('is-active');
        targetSection.style.display = '';
        // show any linked sections
        showLinkedSections(targetId);
        updateDashboardWorkspaceState(targetId);
    }

    // ===== PROJECT MANAGEMENT SYSTEM =====

    let currentProjectId = null;
    let currentProjectExpenses = [];

    function openProjectDetailModal(projectId) {
        currentProjectId = projectId;
        const modal = document.getElementById('projectDetailModal');
        const projects = state.enterprise?.projects || [];
        const project = projects.find(p => p._id === projectId);

        if (!project) {
            alert('Project not found');
            return;
        }

        // Set project info
        document.getElementById('projectModalTitle').textContent = project.name || 'Project Details';
        document.getElementById('projectModalSubtitle').textContent = `${project.category} • ${formatDate(project.createdAt)}`;
        document.getElementById('projectDisplayName').textContent = project.name || '—';
        document.getElementById('projectDisplayCategory').textContent = project.category || '—';
        document.getElementById('projectDisplayDescription').value = project.description || '';
        document.getElementById('projectDisplayVisibility').textContent = project.visibility || '—';

        // Status badge
        const statusEl = document.getElementById('projectDisplayStatus');
        statusEl.textContent = project.status || 'planning';
        statusEl.className = `status-pill status-${project.status || 'planning'}`;

        // Team lead
        const teamLeadName = project.teamLead?.name || project.teamLead?.email || 'Not assigned';
        document.getElementById('projectDisplayTeamLead').textContent = teamLeadName;

        // Dates
        document.getElementById('projectDisplayStartDate').textContent = formatDate(project.startDate) || '—';
        document.getElementById('projectDisplayEndDate').textContent = formatDate(project.endDate) || '—';

        // Budget information
        const allocated = Number(project.budgetAllocated) || 0;
        const spent = Number(project.totalExpense) || 0;
        const remaining = allocated - spent;
        const usedPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

        document.getElementById('projectBudgetAllocated').textContent = formatCurrency(allocated);
        document.getElementById('projectBudgetSpent').textContent = formatCurrency(spent);
        document.getElementById('projectBudgetRemaining').textContent = formatCurrency(remaining);
        document.getElementById('projectBudgetUsedPercent').textContent = `${usedPercent}%`;
        document.getElementById('projectBudgetBar').style.width = `${Math.min(usedPercent, 100)}%`;

        // Progress calculation based on dates
        const progress = calculateProjectProgress(project.startDate, project.endDate);
        document.getElementById('projectDisplayProgress').textContent = `${progress}%`;

        // Load expenses
        loadProjectExpenses(projectId);

        // Load team members
        loadProjectTeamMembers(project.teamMembers || []);

        // Load reimbursements
        loadProjectReimbursements(projectId);

        // Show modal
        modal.classList.remove('modal-hidden');
    }

    function closeProjectDetailModal() {
        const modal = document.getElementById('projectDetailModal');
        modal.classList.add('modal-hidden');
        currentProjectId = null;
        currentProjectExpenses = [];
    }

    function calculateProjectProgress(startDate, endDate) {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        const totalDuration = end - start;
        const elapsed = now - start;
        const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

        return Math.max(progress, 0);
    }

    async function loadProjectExpenses(projectId) {
        try {
            const response = await apiRequest(`/projects/${projectId}/expenses`, { method: 'GET' });
            currentProjectExpenses = response.expenses || [];

            const tbody = document.getElementById('expensesTableBody');
            const emptyState = document.getElementById('expensesEmptyState');
            const table = document.getElementById('expensesTableContent');

            if (currentProjectExpenses.length === 0) {
                tbody.innerHTML = '';
                table.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                table.style.display = 'table';
                emptyState.style.display = 'none';
                tbody.innerHTML = currentProjectExpenses.map((expense) => `
                    <tr>
                        <td>${formatDate(expense.date)}</td>
                        <td>${expense.title || 'Untitled'}</td>
                        <td>${expense.category || '—'}</td>
                        <td>${formatCurrency(expense.amount)}</td>
                        <td>
                            <button class="icon-btn delete-expense-btn" data-expense-id="${expense._id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');

                // Add delete listeners
                document.querySelectorAll('.delete-expense-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const expenseId = e.currentTarget.dataset.expenseId;
                        if (confirm('Delete this expense?')) {
                            await deleteProjectExpense(expenseId);
                        }
                    });
                });
            }
        } catch (err) {
            console.error('Load expenses failed:', err);
        }
    }

    async function loadProjectTeamMembers(teamMemberIds) {
        const container = document.getElementById('projectTeamList');
        
        if (!teamMemberIds || teamMemberIds.length === 0) {
            container.innerHTML = '<p class="empty-state-text">No team members assigned.</p>';
            return;
        }

        const members = state.members || [];
        const teamMembers = members.filter(m => 
            teamMemberIds.includes(m._id) || teamMemberIds.includes(m._id?.toString())
        );

        if (teamMembers.length === 0) {
            container.innerHTML = '<p class="empty-state-text">No team members assigned.</p>';
            return;
        }

        container.innerHTML = teamMembers.map((member) => {
            const initials = (member.name || member.email || 'M').substring(0, 2).toUpperCase();
            return `
                <div class="team-member-card">
                    <div class="team-member-avatar">${initials}</div>
                    <div class="team-member-name">${member.name || member.email}</div>
                    <div class="team-member-role">${member.role || 'Member'}</div>
                </div>
            `;
        }).join('');
    }

    async function loadProjectReimbursements(projectId) {
        try {
            // Get reimbursements linked to this project
            const allReimbursements = state.enterprise?.memberTransactions || [];
            const projectReimbursements = allReimbursements.filter(t => 
                t.linkedProject?.toString() === projectId || t.linkedProject === projectId
            );

            const tbody = document.getElementById('reimbursementsTableBody');
            const emptyState = document.getElementById('reimbursementsEmptyState');
            const table = document.getElementById('reimbursementsTableContent');

            if (projectReimbursements.length === 0) {
                tbody.innerHTML = '';
                table.style.display = 'none';
                emptyState.style.display = 'block';
            } else {
                table.style.display = 'table';
                emptyState.style.display = 'none';
                tbody.innerHTML = projectReimbursements.map((reimb) => {
                    const memberName = reimb.sender?.name || reimb.sender?.email || 'Unknown';
                    return `
                        <tr>
                            <td>${memberName}</td>
                            <td>${reimb.description || reimb.reason}</td>
                            <td>${formatCurrency(reimb.amount)}</td>
                            <td><span class="status-pill status-${reimb.status}">${reimb.status}</span></td>
                            <td>
                                <button class="icon-btn" title="View details">
                                    <i class="fas fa-external-link-alt"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (err) {
            console.error('Load reimbursements failed:', err);
        }
    }

    async function addProjectExpense(event) {
        event.preventDefault();

        if (!currentProjectId) {
            alert('No project selected');
            return;
        }

        const title = document.getElementById('expenseTitle')?.value?.trim();
        const amount = Number(document.getElementById('expenseAmount')?.value);
        const category = document.getElementById('expenseCategory')?.value;
        const date = document.getElementById('expenseDate')?.value;
        const notes = document.getElementById('expenseNotes')?.value?.trim() || '';

        if (!title || !amount || !date) {
            alert('Please fill in title, amount, and date');
            return;
        }

        try {
            await apiRequest(`/projects/${currentProjectId}/add-expense`, {
                method: 'POST',
                body: {
                    title,
                    amount,
                    category: category || 'other',
                    notes,
                    expenseDate: date
                }
            });

            document.getElementById('projectExpenseForm').reset();
            document.getElementById('projectExpenseForm').style.display = 'none';
            document.getElementById('addExpenseToProjectBtn').style.display = 'inline-flex';

            await loadProjectExpenses(currentProjectId);
            await refreshDashboardFromApi();
            renderProjects();

            showDashboardToast('Expense added successfully', 'success');
        } catch (err) {
            console.error('Add expense failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to add expense');
            }
        }
    }

    async function deleteProjectExpense(expenseId) {
        try {
            // Note: You may need to add a DELETE endpoint for expenses
            // For now, this is a placeholder - the backend would handle this
            alert('Expense deletion endpoint needed on backend');
        } catch (err) {
            console.error('Delete expense failed:', err);
        }
    }

    async function editProject() {
        if (!currentProjectId) return;

        const projects = state.enterprise?.projects || [];
        const project = projects.find(p => p._id === currentProjectId);
        if (!project) return;

        const newStatus = prompt('Enter new status (planning/active/in_progress/completed/archived):', project.status);
        if (!newStatus) return;

        const newBudget = prompt('Enter new budget amount:', project.budgetAllocated);
        if (!newBudget) return;

        try {
            await apiRequest(`/projects/${currentProjectId}`, {
                method: 'PUT',
                body: {
                    status: newStatus,
                    budgetAllocated: Number(newBudget),
                    description: document.getElementById('projectDisplayDescription').value
                }
            });

            await refreshDashboardFromApi();
            renderProjects();
            openProjectDetailModal(currentProjectId);

            showDashboardToast('Project updated successfully', 'success');
        } catch (err) {
            console.error('Update project failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to update project');
            }
        }
    }

    async function archiveProject() {
        if (!currentProjectId) return;

        if (!confirm('Archive this project? It will remain editable by admins.')) return;

        try {
            await apiRequest(`/projects/${currentProjectId}`, {
                method: 'PUT',
                body: {
                    status: 'archived'
                }
            });

            await refreshDashboardFromApi();
            renderProjects();
            closeProjectDetailModal();

            showDashboardToast('Project archived successfully', 'success');
        } catch (err) {
            console.error('Archive project failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to archive project');
            }
        }
    }

    async function deleteProject() {
        if (!currentProjectId) return;

        if (!confirm('Permanently delete this project? This cannot be undone.')) return;

        try {
            // Note: You may need to add a DELETE endpoint for projects on the backend
            // For now, this marks it as archived instead
            await apiRequest(`/projects/${currentProjectId}`, {
                method: 'PUT',
                body: {
                    status: 'archived'
                }
            });

            await refreshDashboardFromApi();
            renderProjects();
            closeProjectDetailModal();

            showDashboardToast('Project archived (delete endpoint needed on backend)', 'success');
        } catch (err) {
            console.error('Delete project failed:', err);
            if (!handleAuthFailure(err)) {
                alert(err.message || 'Failed to delete project');
            }
        }
    }

    function renderProjects() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        const allProjects = Array.isArray(state.enterprise && state.enterprise.projects) ? state.enterprise.projects : [];
        const projects = userRole === 'member'
            ? allProjects.filter((project) => {
                const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : [];
                return teamMembers.some((member) => {
                    const memberId = member && (member._id || member.id || member);
                    return String(memberId) === String(state.user.id);
                });
            })
            : allProjects;

        if (projects.length === 0) {
            container.innerHTML = userRole === 'member'
                ? '<div class="receipt-empty">No project assignments available currently. Projects assigned by administrators will appear here.</div>'
                : '<div class="receipt-empty">No projects yet. Use New to create one.</div>';
            return;
        }

        container.innerHTML = projects.map((project) => {
            const progress = calculateProjectProgress(project.startDate, project.endDate);
            const allocated = Number(project.budgetAllocated) || 0;
            const spent = Number(project.totalExpense) || 0;
            const usedPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            const teamLeadName = project.teamLead?.name || project.teamLead?.email || 'Not assigned';
            const tasksAssigned = Array.isArray(project.tasks)
                ? project.tasks.filter((task) => {
                    const assignee = task.assignee && (task.assignee._id || task.assignee.id || task.assignee);
                    return String(assignee) === String(state.user.id);
                }).length
                : 0;

            return `
                <article class="info-card enterprise-card project-card-item" data-project-id="${project._id}">
                    <div class="info-card-head">
                        <div>
                            <strong>${project.name || 'Untitled project'}</strong>
                            <span>${project.category || 'uncategorized'} · ${project.status || 'planning'}</span>
                        </div>
                        <span class="status-chip status-${project.status || 'planning'}">${progress}% done</span>
                    </div>
                    <div class="info-card-body">
                        <p>${project.description || (userRole === 'member' ? 'Project details will be shared by your administrators.' : 'No project description added yet.')}</p>
                        <div class="enterprise-meta-grid">
                            ${userRole === 'member'
                                ? `
                            <div><span>Role</span><strong>${project.memberRole || 'Contributor'}</strong></div>
                            <div><span>Team Lead</span><strong>${teamLeadName}</strong></div>
                            <div><span>Deadline</span><strong>${project.endDate ? formatDate(project.endDate) : 'TBA'}</strong></div>
                            <div><span>Tasks Assigned</span><strong>${tasksAssigned}</strong></div>
                                `
                                : `
                            <div><span>Budget</span><strong>${formatCurrency(allocated)}</strong></div>
                            <div><span>Spent</span><strong>${formatCurrency(spent)}</strong></div>
                            <div><span>Remaining</span><strong>${formatCurrency(Math.max(allocated - spent, 0))}</strong></div>
                            <div><span>Used %</span><strong>${usedPercent}%</strong></div>
                                `}
                        </div>
                        <div style="height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; margin-top: 12px; overflow: hidden;">
                            <div style="height: 100%; width: ${usedPercent}%; background: linear-gradient(90deg, #0099ff, #00d4ff); border-radius: 4px;"></div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Add click listeners to project cards
        document.querySelectorAll('.project-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.projectId;
                openProjectDetailModal(projectId);
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

        const openProjectModal = document.getElementById('openProjectModal');
        if (openProjectModal && userRole === 'admin') {
            openProjectModal.addEventListener('click', () => focusDashboardForm('projects-section', '#projectName'));
        }

        const openEventModal = document.getElementById('openEventModal');
        if (openEventModal && userRole === 'admin') {
            openEventModal.addEventListener('click', () => focusDashboardForm('events-section', '#eventName'));
        }

        const openMemberTransferModal = document.getElementById('openMemberTransferModal');
        if (openMemberTransferModal) {
            openMemberTransferModal.addEventListener('click', () => focusDashboardForm('member-transactions-section', '#memberTransactionReceiver'));
        }

        const openReimbursementModal = document.getElementById('openReimbursementModal');
        if (openReimbursementModal && userRole === 'member') {
            openReimbursementModal.addEventListener('click', () => focusDashboardForm('reimbursement-section', '#reimbursementItemName'));
        }

        const downloadRulesPdfButton = document.getElementById('downloadRulesPdfButton');
        if (downloadRulesPdfButton) {
            downloadRulesPdfButton.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = 'assets/CLUB SOP.pdf';
                link.download = 'Texcelerators-Official-SOP.pdf';
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        }

        const printRulesButton = document.getElementById('printRulesButton');
        if (printRulesButton) {
            printRulesButton.addEventListener('click', () => window.print());
        }

        if (elements.payNowButton && userRole === 'member') {
            elements.payNowButton.addEventListener('click', () => {
                state.paymentFlow.qrScanned = false;
                updatePaymentFlowUI();
                activateDashboardSection('payments');
                // then focus the QR area if present
                setTimeout(() => document.getElementById('payment-qr')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
            });
        }

        if (elements.viewDetailsButton && userRole === 'member') {
            elements.viewDetailsButton.addEventListener('click', () => {
                activateDashboardSection('transactions');
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

        if (elements.copyUpiButton && userRole === 'member') {
            elements.copyUpiButton.addEventListener('click', async () => {
                const upiId = elements.clubUpiId ? elements.clubUpiId.textContent.trim() : '';
                if (!upiId) return;
                try {
                    await navigator.clipboard.writeText(upiId);
                    showDashboardToast('UPI ID copied.', 'success');
                } catch (err) {
                    console.warn('Failed to copy UPI ID', err);
                }
            });
        }

        if (elements.submitReceiptButton && userRole === 'member') {
            elements.submitReceiptButton.addEventListener('click', () => {
                const selectedFile = elements.receiptInput && elements.receiptInput.files ? elements.receiptInput.files[0] : null;
                if (!selectedFile) {
                    alert('Please upload a receipt before submitting.');
                    return;
                }
                submitReceiptForVerification(selectedFile);
            });
        }

        if (elements.receiptInput && userRole === 'member') {
            elements.receiptInput.addEventListener('change', () => {
                const selectedFile = elements.receiptInput.files && elements.receiptInput.files[0];
                if (!selectedFile) return;
                const previewInfo = getReceiptPreviewInfo(selectedFile);
                if (elements.memberReceiptPreview) {
                    elements.memberReceiptPreview.innerHTML = previewInfo.previewUrl
                        ? `<img src="${previewInfo.previewUrl}" alt="Receipt preview" class="receipt-thumb-large">`
                        : `<div class="receipt-file-name">${selectedFile.name}</div>`;
                }
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

        if (elements.projectForm && userRole === 'admin') {
            elements.projectForm.addEventListener('submit', createProject);
        }

        // Project Management Modal Listeners
        const closeProjectModal = document.getElementById('closeProjectModal');
        const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
        const editProjectBtn = document.getElementById('editProjectBtn');
        const archiveProjectBtn = document.getElementById('archiveProjectBtn');
        const deleteProjectBtn = document.getElementById('deleteProjectBtn');
        const addExpenseToProjectBtn = document.getElementById('addExpenseToProjectBtn');
        const projectExpenseForm = document.getElementById('projectExpenseForm');
        const cancelExpenseFormBtn = document.getElementById('cancelExpenseFormBtn');

        if (closeProjectModal) {
            closeProjectModal.addEventListener('click', closeProjectDetailModal);
        }

        if (closeProjectModalBtn) {
            closeProjectModalBtn.addEventListener('click', closeProjectDetailModal);
        }

        if (editProjectBtn && userRole === 'admin') {
            editProjectBtn.addEventListener('click', editProject);
        }

        if (archiveProjectBtn && userRole === 'admin') {
            archiveProjectBtn.addEventListener('click', archiveProject);
        }

        if (deleteProjectBtn && userRole === 'admin') {
            deleteProjectBtn.addEventListener('click', deleteProject);
        }

        if (addExpenseToProjectBtn && userRole === 'admin') {
            addExpenseToProjectBtn.addEventListener('click', (e) => {
                e.currentTarget.style.display = 'none';
                projectExpenseForm.style.display = 'block';
                document.getElementById('expenseTitle').focus();
            });
        }

        if (cancelExpenseFormBtn) {
            cancelExpenseFormBtn.addEventListener('click', () => {
                projectExpenseForm.style.display = 'none';
                if (addExpenseToProjectBtn) {
                    addExpenseToProjectBtn.style.display = 'inline-flex';
                }
            });
        }

        if (projectExpenseForm) {
            projectExpenseForm.addEventListener('submit', addProjectExpense);
        }

        if (elements.eventForm && userRole === 'admin') {
            elements.eventForm.addEventListener('submit', createEvent);
        }

        if (elements.memberTransactionForm) {
            elements.memberTransactionForm.addEventListener('submit', createMemberTransaction);
        }

        if (elements.reimbursementForm && userRole === 'member') {
            elements.reimbursementForm.addEventListener('submit', createReimbursement);
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

        // expose the current dashboard state for analytics helpers
        window.__dashboardState = state;

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
        populateMemberReceiverSelect();
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        if (elements.adminPaymentDate && !elements.adminPaymentDate.value) elements.adminPaymentDate.value = today;
        if (elements.expenseDate && !elements.expenseDate.value) elements.expenseDate.value = today;
        if (elements.reimbursementPurchaseDate && !elements.reimbursementPurchaseDate.value) elements.reimbursementPurchaseDate.value = today;
        if (elements.projectStartDate && !elements.projectStartDate.value) elements.projectStartDate.value = today;
        if (elements.eventStartDate && !elements.eventStartDate.value) elements.eventStartDate.value = today;
        if (elements.eventEndDate && !elements.eventEndDate.value) elements.eventEndDate.value = tomorrow;
        renderMemberPayments();
        renderTransactions();
        renderMembers();
        renderExpenses();
        renderMemberExpenses();
        renderMemberReceiptStatus();
        renderVerificationQueue();
        renderFinance();
        renderProjects();
        renderEvents();
        renderMemberTransactions();
        renderReimbursements();
        renderContributionAnalytics();
        renderAnnouncements();
        renderMemberProfile();
        renderRulesPortal();
        // Build and populate charts from freshest state
        try {
            initDashboardCharts();
            const analyticsSelect = document.getElementById('analyticsRange');
            const rangeDays = analyticsSelect ? Number(analyticsSelect.value || 30) : 30;
            buildAnalyticsFromState(rangeDays);
            if (analyticsSelect) analyticsSelect.addEventListener('change', () => buildAnalyticsFromState(Number(analyticsSelect.value || 30)));
        } catch (e) { console.warn('Analytics update failed', e); }
        bindSidebarNavigation();
        bindActions();
        setDashboardLoadingState(false);
        if (dashboardRootEl) {
            dashboardRootEl.removeAttribute('aria-busy');
        }

        // Set default section based on role and visible sections
        const visibleSections = Array.from(document.querySelectorAll('[data-dashboard-section]'))
            .filter((section) => section.style.display !== 'none');
        const firstVisibleSection = visibleSections[0] || null;
        if (firstVisibleSection) {
            document.querySelectorAll('[data-dashboard-section]').forEach(s => { s.classList.remove('is-active'); s.style.display = 'none'; });
            const defaultSection = userRole === 'member'
                ? document.getElementById('payments') || firstVisibleSection
                : firstVisibleSection;
            defaultSection.classList.add('is-active');
            defaultSection.style.display = '';

            // activate matching sidebar link if present
            const sid = defaultSection.getAttribute('id');
            if (sid) {
                document.querySelectorAll('[data-sidebar-link]').forEach(l => l.classList.remove('is-active'));
                const matchingLink = document.querySelector(`[data-sidebar-link][data-target="${sid}"]`);
                if (matchingLink) matchingLink.classList.add('is-active');
                // show any linked sections for the default section (e.g., club summary with analytics)
                showLinkedSections(sid);
                updateDashboardWorkspaceState(sid);
            }
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
            if (elements.receiptInput) elements.receiptInput.value = '';
            if (elements.memberReceiptPreview) elements.memberReceiptPreview.innerHTML = 'No receipt selected';
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

