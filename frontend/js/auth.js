// frontend/js/auth.js
const API_BASE = '/api';

class Auth {
    constructor() {
        this.currentUser = null;
        this.token = null;
    }

    async checkUser(employeeId) {
        if (!/^\d+$/.test(employeeId)) {
            return { 
                success: false, 
                error: 'Employee ID должен содержать только цифры' 
            };
        }

        try {
            const response = await fetch(`${API_BASE}/auth/check-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ employee_id: employeeId })
            });

            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, error: data.detail || 'Ошибка проверки' };
            }
        } catch (error) {
            console.error('Check user error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    async register(employeeId, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    employee_id: employeeId, 
                    password: password 
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.token = data.token || 'dummy-token';
                return { success: true, data };
            } else {
                return { success: false, error: data.detail || 'Ошибка регистрации' };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    async login(employeeId, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    employee_id: employeeId, 
                    password: password 
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.token = data.token || 'dummy-token';
                return { success: true, data };
            } else {
                return { success: false, error: data.detail || 'Ошибка входа' };
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
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'super_admin');
    }

    hasAccess() {
        return this.currentUser && this.currentUser.has_access === true;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
}

const auth = new Auth();