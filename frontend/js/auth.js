// frontend/js/auth.js
const API_BASE = '/api';

class Auth {
    constructor() {
        this.currentUser = null;
        this.token = null;
    }

    async checkAdmin(employeeId) {
        if (!/^\d+$/.test(employeeId)) {
            return { 
                success: false, 
                error: 'Employee ID должен содержать только цифры' 
            };
        }

        try {
            const response = await fetch(`${API_BASE}/auth/check-admin`, {
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
            console.error('Check admin error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    async verifyAdmin(employeeId, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/verify-admin`, {
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
                return { success: false, error: data.detail || 'Ошибка проверки пароля' };
            }
        } catch (error) {
            console.error('Verify admin error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    async login(employeeId) {
        if (!/^\d+$/.test(employeeId)) {
            return { 
                success: false, 
                error: 'Employee ID должен содержать только цифры' 
            };
        }

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