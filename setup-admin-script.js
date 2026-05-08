// First-time admin setup only.

const storedApiBase = localStorage.getItem('API_BASE');
const API_BASE = storedApiBase === 'http://localhost:3000'
    ? 'http://localhost:5000'
    : (storedApiBase || 'http://localhost:5000');

if (storedApiBase === 'http://localhost:3000') {
    localStorage.setItem('API_BASE', 'http://localhost:5000');
}

const form = document.getElementById('setupAdminForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const toast = document.getElementById('toast');

function showToast(message, type = 'info', duration = 4000) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        return;
    }

    button.disabled = false;
    if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function apiRequest(path, { method = 'GET', body = null } = {}) {
    const headers = {};
    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data && data.message ? data.message : 'Request failed');
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields.', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            confirmPasswordInput.focus();
            return;
        }

        const submitButton = form.querySelector('.login-button');
        setLoading(submitButton, true);

        try {
            await apiRequest('/auth/register-admin', {
                method: 'POST',
                body: { name, email, password }
            });

            showToast('Admin created successfully. Redirecting to login...', 'success', 2500);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 900);
        } catch (err) {
            console.error('Admin setup failed:', err);
            if (err && err.message === 'Admin already exists') {
                showToast('Admin already registered', 'error');
            } else {
                showToast(err.message || 'Failed to create admin.', 'error');
            }
            setLoading(submitButton, false);
        }
    });
}
