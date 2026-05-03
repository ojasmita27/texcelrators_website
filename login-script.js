// ===========================
// LOGIN PAGE SCRIPT
// ===========================

// Dummy user database for role-based login
const USERS_SEED = [
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
    localStorage.setItem('usersDatabase', JSON.stringify(USERS_SEED));
    return USERS_SEED.slice();
}

function saveUsersDatabase(users) {
    localStorage.setItem('usersDatabase', JSON.stringify(users));
}

// Get DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const toast = document.getElementById('toast');

// ===========================
// PASSWORD VISIBILITY TOGGLE
// ===========================
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update icon
    const icon = togglePasswordBtn.querySelector('i');
    if (type === 'text') {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// ===========================
// TOAST NOTIFICATION SYSTEM
// ===========================
function showToast(message, type = 'info', duration = 4000) {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ===========================
// FORM VALIDATION
// ===========================
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        showToast('Please enter your email address', 'error');
        emailInput.focus();
        return false;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        emailInput.focus();
        return false;
    }

    if (!password) {
        showToast('Please enter your password', 'error');
        passwordInput.focus();
        return false;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        passwordInput.focus();
        return false;
    }

    return true;
}

// ===========================
// FORM SUBMISSION
// ===========================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Get form data
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById('remember').checked;

    // Simulate loading state
    const submitBtn = loginForm.querySelector('.login-button');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    // Simulate API call (remove this when adding real backend)
    setTimeout(() => {
        const usersDatabase = getUsersDatabase();
        // Check user credentials against database
        const user = usersDatabase.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Successful login
            console.log('Login successful for:', email, 'Role:', user.role);
            
            // Store user data in localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isFirstLogin: user.isFirstLogin
            }));
            
            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
                localStorage.setItem('remember_me', 'true');
            } else {
                localStorage.removeItem('remembered_email');
                localStorage.setItem('remember_me', 'false');
            }
            
            showToast(`Welcome ${user.name}! Redirecting to dashboard...`, 'success', 2000);
            
            // Redirect based on first login flag
            setTimeout(() => {
                if (user.isFirstLogin) {
                    window.location.href = 'change-password.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 800);
        } else {
            // Failed login
            console.log('Login failed for:', email);
            showToast('Invalid email or password. Please try again.', 'error', 4000);
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }, 1500);
});

// ===========================
// FORGOT PASSWORD HANDLER
// ===========================
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (email && validateEmail(email)) {
        showToast(`Password reset link sent to ${email}`, 'success', 4000);
    } else if (email) {
        showToast('Please enter a valid email address', 'error');
        emailInput.focus();
    } else {
        showToast('Please enter your email address first', 'info', 3000);
        emailInput.focus();
    }
    
    console.log('Forgot Password - Email:', email);
}

// ===========================
// CONTACT ADMIN HANDLER
// ===========================
function handleContactAdmin(e) {
    e.preventDefault();
    
    showToast('Contact form opened - Email admin@texcelerators.com for support', 'info', 5000);
    
    // In production, you could open a contact form modal or redirect to contact page
    // Example: window.location.href = 'index.html#contact';
    
    console.log('Contact Admin clicked');
}

// ===========================
// INPUT INTERACTIONS
// ===========================
// Add focus effects
emailInput.addEventListener('focus', function() {
    this.parentElement.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
});

emailInput.addEventListener('blur', function() {
    this.parentElement.style.boxShadow = 'none';
});

passwordInput.addEventListener('focus', function() {
    this.closest('.form-group').style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.2)';
});

passwordInput.addEventListener('blur', function() {
    this.closest('.form-group').style.boxShadow = 'none';
});

// ===========================
// KEYBOARD SHORTCUTS
// ===========================
document.addEventListener('keydown', (e) => {
    // Submit form with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }

    // ESC to clear password field
    if (e.key === 'Escape' && passwordInput === document.activeElement) {
        passwordInput.value = '';
    }
});

// ===========================
// PAGE LOAD ANIMATIONS
// ===========================
window.addEventListener('load', () => {
    // Subtle animation on page load
    document.body.style.animation = 'fadeIn 0.6s ease-in';
});

// ===========================
// REMEMBER ME FUNCTIONALITY
// ===========================
const rememberCheckbox = document.getElementById('remember');

// Load saved email if remember me was checked
window.addEventListener('load', () => {
    const savedEmail = localStorage.getItem('remembered_email');
    const shouldRemember = localStorage.getItem('remember_me');

    if (shouldRemember === 'true' && savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }
    
    // Clear currentUser on page load (prevents auto-login)
    // This is handled by the backend in production
});

// ===========================
// ACCESSIBILITY
// ===========================
// Enhance keyboard navigation
function addKeyboardNavigation() {
    const inputs = [emailInput, passwordInput];
    const buttons = [togglePasswordBtn, loginForm.querySelector('.login-button')];
    const allFocusable = [...inputs, ...buttons];

    allFocusable.forEach((element, index) => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const nextIndex = (index + 1) % allFocusable.length;
                if (!e.shiftKey) {
                    e.preventDefault();
                    allFocusable[nextIndex].focus();
                }
            }
        });
    });
}

addKeyboardNavigation();

// ===========================
// CONSOLE WELCOME MESSAGE
// ===========================
console.log('%cWelcome to Texcelerators Login', 'font-size: 16px; color: #00d4ff; font-weight: bold;');
console.log('%cTest Credentials:', 'font-size: 12px; color: #43e97b; font-weight: bold;');
console.log('%cAdmin: admin@texcelerators.com / admin123', 'font-size: 11px; color: #43e97b;');
console.log('%cMember Examples:', 'font-size: 11px; color: #ffc43d;');
console.log('%c  aarav@texcelerators.com / aarav@123', 'font-size: 10px; color: #ffc43d;');
console.log('%c  meera@texcelerators.com / meera@123', 'font-size: 10px; color: #ffc43d;');
console.log('%cBackend integration coming soon!', 'font-size: 12px; color: #b0b5c1;');
console.log('%cFor support, contact: hello@texcelerators.com', 'font-size: 11px; color: #0099ff;');

// ===========================
// ERROR HANDLING
// ===========================
window.addEventListener('error', (event) => {
    console.error('An error occurred:', event.error);
    // Don't show user-facing errors for demo purposes
});
