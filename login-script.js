// ===========================
// LOGIN PAGE SCRIPT
// ===========================

// Backend API base
// If you're using Live Server or a different port, update this value.
const storedApiBase = localStorage.getItem('API_BASE');
const API_BASE = storedApiBase === 'http://localhost:3000'
    ? 'http://localhost:5000'
    : (storedApiBase || 'http://localhost:5000');

// Auto-migrate old stored value
if (storedApiBase === 'http://localhost:3000') {
    localStorage.setItem('API_BASE', 'http://localhost:5000');
}

// Get DOM Elements
const loginForm = document.getElementById('loginForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const roleSelect = document.getElementById('loginRole');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const togglePasswordBtn = document.getElementById('togglePassword');
const backButton = document.getElementById('backButton') || document.querySelector('.back-button');
const toast = document.getElementById('toast');

let pendingLogin = null; // { token, oldPassword }

// ===========================
// BACK NAVIGATION
// ===========================
if (backButton) {
    const goBack = (event) => {
        const canUseHistory = window.history.length > 1 && document.referrer;

        if (canUseHistory) {
            event.preventDefault();

            const currentUrl = window.location.href;
            window.history.back();

            window.setTimeout(() => {
                if (window.location.href === currentUrl) {
                    window.location.href = 'index.html';
                }
            }, 200);
        }
    };

    backButton.addEventListener('click', goBack);
    backButton.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            goBack(event);
        }
    });
}

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

async function apiRequest(path, { method = 'GET', token = null, body = null } = {}) {
    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body
            ? (body instanceof FormData ? body : JSON.stringify(body))
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

function setLoading(button, isLoading, loadingText = 'Signing in...') {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }
}

function showChangePasswordUI() {
    if (loginForm) loginForm.style.display = 'none';
    if (changePasswordForm) changePasswordForm.style.display = '';
}

// ===========================
// FORM SUBMISSION
// ===========================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Get form data
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const role = roleSelect ? roleSelect.value : 'member';
    const rememberMe = document.getElementById('remember').checked;

    const submitBtn = loginForm.querySelector('.login-button');
    setLoading(submitBtn, true, 'Signing in...');

    try {
        const result = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password, role }
        });

        const { token, user } = result;
        if (!token || !user) {
            throw new Error('Unexpected login response');
        }

        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Store remember me preference
        if (rememberMe) {
            localStorage.setItem('remembered_email', email);
            localStorage.setItem('remembered_role', role);
            localStorage.setItem('remember_me', 'true');
        } else {
            localStorage.removeItem('remembered_email');
            localStorage.removeItem('remembered_role');
            localStorage.setItem('remember_me', 'false');
        }

        if (user.mustChangePassword) {
            pendingLogin = { token, oldPassword: password };
            showToast('First login: please change your password.', 'info', 4000);
            showChangePasswordUI();
            setLoading(submitBtn, false);
            return;
        }

        showToast(`Welcome ${user.name}! Redirecting to dashboard...`, 'success', 2000);
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } catch (err) {
        console.error('Login error:', err);
        showToast(err.message || 'Login failed. Please try again.', 'error', 4000);
        setLoading(submitBtn, false);
    }
});

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!pendingLogin || !pendingLogin.token) {
            showToast('Please login again.', 'error');
            return;
        }

        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmNewPassword = confirmNewPasswordInput ? confirmNewPasswordInput.value : '';

        if (!newPassword || newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const submitBtn = changePasswordForm.querySelector('.login-button');
        setLoading(submitBtn, true, 'Updating...');

        try {
            const result = await apiRequest('/auth/change-password', {
                method: 'POST',
                token: pendingLogin.token,
                body: { oldPassword: pendingLogin.oldPassword, newPassword }
            });

            if (result && result.user) {
                localStorage.setItem('currentUser', JSON.stringify(result.user));
            }

            showToast('Password updated! Redirecting...', 'success', 2000);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } catch (err) {
            console.error('Change password error:', err);
            showToast(err.message || 'Failed to change password', 'error', 4000);
            setLoading(submitBtn, false);
        }
    });
}

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
    const savedRole = localStorage.getItem('remembered_role');

    if (shouldRemember === 'true' && savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
        if (roleSelect && savedRole) {
            roleSelect.value = savedRole;
        }
    }

    // If user chose to stay signed in and a token exists, go to dashboard.
    const token = localStorage.getItem('authToken');
    if (shouldRemember === 'true' && token) {
        window.location.href = 'dashboard.html';
    }
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
console.log('%cBackend connected:', 'font-size: 12px; color: #43e97b; font-weight: bold;');
console.log(`%cAPI: ${API_BASE}`, 'font-size: 11px; color: #43e97b;');
console.log('%cFor support, contact: hello@texcelerators.com', 'font-size: 11px; color: #0099ff;');

// ===========================
// ERROR HANDLING
// ===========================
window.addEventListener('error', (event) => {
    console.error('An error occurred:', event.error);
    // Don't show user-facing errors for demo purposes
});
