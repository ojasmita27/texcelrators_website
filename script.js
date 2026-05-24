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

    console.log('%cWelcome to Texcelerators! 🚀', 'font-size: 16px; color: #00d4ff; font-weight: bold;');
    console.log('%cThis is a demo website built with HTML, CSS, and JavaScript', 'font-size: 12px; color: #b0b5c1;');
    console.log('%cBackend integration coming soon!', 'font-size: 12px; color: #0099ff;');
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
    if (Number.isNaN(num)) return value === 0 ? '$0.00' : '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
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

// ====== ACHIEVEMENTS (PREMIUM) INTERACTIONS ======
function initializeAchievements() {
    const hallSection = document.querySelector('.achievements-hall');
    if (!hallSection) return;

    // Render stats
    renderAchievementStats();

    // Render featured achievement (first with featured: true)
    renderFeaturedAchievement();

    // Render masonry grid with all achievements
    renderAchievementsMasonry();

    // Setup modal handlers
    setupAchievementModalHandlers();
}

function renderAchievementStats() {
    const statsContainer = document.querySelector('.hall-stats');
    if (!statsContainer || !ACHIEVEMENTS_DATA.length) return;
    // Use fixed stats provided in project brief
    const totals = [
        { count: 12, label: 'National Championships' },
        { count: 18, label: 'Robots Built' },
        { count: 4, label: 'International Awards' },
        { count: 18, label: 'Team Members' }
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
                <button class="feat-prev" aria-label="Previous">‹</button>
                <div class="feat-indicators"></div>
                <button class="feat-next" aria-label="Next">›</button>
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

    masonryContainer.innerHTML = ACHIEVEMENTS_DATA
        .map((ach, idx) => `
            <div class="achievement-item" data-achievement-id="${ach.id}">
                <div class="achievement-image">
                    <img src="${ach.image}" alt="${ach.title}" loading="lazy">
                </div>
                <div class="achievement-body">
                    <div class="achievement-award">${ach.category || 'ACHIEVEMENT'}</div>
                    <h4>${ach.title}</h4>
                    <p class="achievement-date">${ach.dateDisplay}</p>
                    <p class="achievement-content">${ach.achievement}</p>
                </div>
            </div>
        `)
        .join('');

    // Add click handlers and reveal animations
    const cards = Array.from(document.querySelectorAll('.achievement-item'));
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const achId = card.dataset.achievementId;
            openAchievementFullscreen(achId);
        });
    });

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

    // Make horizontal rail draggable on desktop (mouse drag + touch)
    let isDown = false, startX = 0, scrollStart = 0;
    masonryContainer.addEventListener('mousedown', (e) => {
        isDown = true; masonryContainer.classList.add('dragging'); startX = e.pageX - masonryContainer.offsetLeft; scrollStart = masonryContainer.scrollLeft;
    });
    masonryContainer.addEventListener('mouseleave', () => { isDown = false; masonryContainer.classList.remove('dragging'); });
    masonryContainer.addEventListener('mouseup', () => { isDown = false; masonryContainer.classList.remove('dragging'); });
    masonryContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return; e.preventDefault(); const x = e.pageX - masonryContainer.offsetLeft; const walk = (x - startX) * 1.3; masonryContainer.scrollLeft = scrollStart - walk;
    });
    // touch support
    masonryContainer.addEventListener('touchstart', (e) => { startX = e.touches[0].pageX - masonryContainer.offsetLeft; scrollStart = masonryContainer.scrollLeft; });
    masonryContainer.addEventListener('touchmove', (e) => { const x = e.touches[0].pageX - masonryContainer.offsetLeft; const walk = (x - startX) * 1.2; masonryContainer.scrollLeft = scrollStart - walk; });
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

    if (!collaborationSection || !form || !status) return;

    const focusableFields = Array.from(form.querySelectorAll('input, select, textarea'));
    const requiredFields = focusableFields.filter((field) => field.hasAttribute('required'));

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

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!validateForm()) {
            setStatus('Please complete the required fields before starting collaboration.', 'error');
            return;
        }

        setStatus('Welcome to the Texcelerators innovation ecosystem.', 'success');
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
            const prevBtn = document.getElementById('robotsCarouselPrev'); 
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
