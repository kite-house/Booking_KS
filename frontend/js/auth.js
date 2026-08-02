// frontend/js/auth.js
const API_BASE = '/api';

class Auth {
    constructor() {
        this.currentUser = null;
        this.token = null;
    }

    async login(employeeId) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ employee_id: employeeId })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.token = data.token || 'dummy-token';
                return { success: true, data };
            } else {
                return { success: false, error: data.detail || 'Ошибка авторизации' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    isAuthenticated() {
        return this.currentUser && this.token;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    hasAccess() {
        return this.currentUser && this.currentUser.has_access === true;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
}

const auth = new Auth();