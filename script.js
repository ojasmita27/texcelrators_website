// ===========================
// MOBILE MENU TOGGLE
// ===========================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===========================
// LOGIN MODAL
// ===========================
const loginModal = document.getElementById('loginModal');
const loginBtn = document.querySelector('.login-btn');
const closeModal = document.getElementById('closeModal');
const loginForm = document.querySelector('.login-form');

// Open modal
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'block';
});

// Close modal when X is clicked
closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Handle form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple demo notification
    alert(`Login attempt with email: ${email}\n\nNote: This is a demo. Backend integration coming soon!`);
    
    // Reset form
    loginForm.reset();
    loginModal.style.display = 'none';
});

// ===========================
// SMOOTH SCROLL ENHANCEMENT
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#login') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===========================
// SCROLL ANIMATIONS
// ===========================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all project cards, team members, and stat cards
document.querySelectorAll('.project-card, .team-member, .stat-card, .gallery-item').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
});

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// ===========================
// HERO LOGO ANIMATION ENHANCEMENT
// ===========================
const logoIcon = document.querySelector('.logo-icon');

if (logoIcon) {
    logoIcon.addEventListener('mouseenter', () => {
        logoIcon.style.animation = 'none';
        setTimeout(() => {
            logoIcon.style.animation = 'float 3s ease-in-out infinite';
        }, 10);
    });
}

// ===========================
// ACTIVE NAV LINK INDICATOR
// ===========================
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = 'var(--secondary-color)';
        } else {
            link.style.color = 'var(--text-secondary)';
        }
    });
});

// ===========================
// PAGE LOAD ANIMATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Add subtle stagger animation
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.animation = `fadeIn 0.8s ease-out ${index * 0.1}s`;
        section.style.animationFillMode = 'both';
    });
});

// Fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal.style.display === 'block') {
        loginModal.style.display = 'none';
    }
});

// Prevent body scroll when modal is open
function toggleBodyScroll(disable) {
    if (disable) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Update modal scroll lock
const originalLoginClick = loginBtn.onclick;
loginBtn.addEventListener('click', () => {
    toggleBodyScroll(true);
});

closeModal.addEventListener('click', () => {
    toggleBodyScroll(false);
});

window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        toggleBodyScroll(false);
    }
});

// ===========================
// CONSOLE LOG FOR DEMO
// ===========================
console.log('%cWelcome to Texcelerators! 🚀', 'font-size: 16px; color: #00d4ff; font-weight: bold;');
console.log('%cThis is a demo website built with HTML, CSS, and JavaScript', 'font-size: 12px; color: #b0b5c1;');
console.log('%cBackend integration coming soon!', 'font-size: 12px; color: #0099ff;');
