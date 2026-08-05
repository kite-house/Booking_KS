// frontend/js/app.js
// API_BASE объявлен в auth.js

let selectedDate = null;
let currentDate = new Date();
let datesList = [];
let placesCache = {};
let loadPlacesTimeout = null;
let isBookingInProgress = false;

// Функции для работы с датами
function formatDateKey(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateDates() {
    const dates = [];
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    for (let i = -6; i < 8; i++) {
        const date = new Date(utcToday);
        date.setUTCDate(utcToday.getUTCDate() + i);
        dates.push(date);
    }
    return dates;
}

function formatDateDisplay(date) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const isToday = date.getTime() === utcToday.getTime();
    
    let dayName = days[date.getUTCDay()];
    if (isToday) dayName = 'Сегодня';
    
    return {
        dayName: dayName,
        dayNumber: date.getUTCDate(),
        month: months[date.getUTCMonth()],
        isToday: isToday,
        date: date
    };
}

function selectDate(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    selectedDate = date;
    updateSelectedDateDisplay();
    renderDateScroll();
    loadPlaces();
}

function renderDateScroll() {
    const container = document.getElementById('dateScrollContainer');
    if (!container) return;
    
    datesList = generateDates();
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const todayStr = formatDateKey(utcToday);
    
    container.innerHTML = datesList.map(date => {
        const dateInfo = formatDateDisplay(date);
        const dateStr = formatDateKey(date);
        const isToday = dateStr === todayStr;
        const isPast = date.getTime() < utcToday.getTime();
        const isFuture = date.getTime() > new Date(utcToday.getTime() + 7 * 24 * 60 * 60 * 1000).getTime();
        const isActive = selectedDate && formatDateKey(selectedDate) === dateStr;
        const isDisabled = isPast || isFuture;
        
        let classes = 'date-item';
        if (isActive) classes += ' active';
        if (isDisabled) classes += ' disabled';
        
        return `
            <div class="${classes}" data-date="${dateStr}" ${isDisabled ? '' : `onclick="selectDate('${dateStr}')"`}>
                <span class="day-name">${dateInfo.dayName}</span>
                <span class="day-number">${dateInfo.dayNumber}</span>
                <span class="day-month">${dateInfo.month}</span>
            </div>
        `;
    }).join('');
    
    if (!selectedDate) {
        selectedDate = new Date(utcToday);
        updateSelectedDateDisplay();
        loadPlaces();
    }
}

function updateSelectedDateDisplay() {
    const display = document.getElementById('selectedDateDisplay');
    if (display && selectedDate) {
        const dateInfo = formatDateDisplay(selectedDate);
        display.textContent = `📅 ${dateInfo.dayName}, ${dateInfo.dayNumber} ${dateInfo.month}`;
    }
}

function showMainSection() {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const adminSection = document.getElementById('admin-section');
    
    if (authSection) authSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
    if (adminSection) adminSection.style.display = 'none';
    
    const userName = document.getElementById('userName');
    if (userName && auth.currentUser) {
        userName.textContent = `ID: ${auth.currentUser.employee_id}`;
    }
    
    renderDateScroll();
    updateSelectedDateDisplay();
}

function showAdminSection() {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const adminSection = document.getElementById('admin-section');
    
    if (authSection) authSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'none';
    if (adminSection) adminSection.style.display = 'block';
    
    if (typeof loadPendingUsers === 'function') loadPendingUsers();
    if (typeof initAdmin === 'function') initAdmin();
    if (typeof loadHistory === 'function') loadHistory();
    if (typeof setupAdminTabs === 'function') setupAdminTabs();
}

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            auth.currentUser = JSON.parse(savedUser);
            auth.token = localStorage.getItem('token');
            
            if (auth.isAdmin()) {
                showAdminSection();
                return;
            } else if (auth.hasAccess()) {
                showMainSection();
                return;
            } else {
                showAuthSection('⏳ Ваш запрос на доступ отправлен администратору. Ожидайте подтверждения!');
                return;
            }
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }

    showAuthSection(null);
});

function showAuthSection(message = null) {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const adminSection = document.getElementById('admin-section');
    
    if (authSection) authSection.style.display = 'block';
    if (mainSection) mainSection.style.display = 'none';
    if (adminSection) adminSection.style.display = 'none';
    
    if (message) {
        showAuthMessage(message);
    }
}

function showAuthMessage(message) {
    const messageDiv = document.getElementById('authMessage');
    if (!messageDiv) return;
    
    messageDiv.className = 'message info';
    messageDiv.style.display = 'block';
    messageDiv.style.padding = '20px';
    messageDiv.style.margin = '20px 0';
    messageDiv.style.borderRadius = '12px';
    messageDiv.style.background = 'rgba(123, 47, 252, 0.15)';
    messageDiv.style.border = '2px solid rgba(123, 47, 252, 0.3)';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.fontSize = '18px';
    messageDiv.style.fontWeight = '500';
    messageDiv.textContent = message;
}

// frontend/js/app.js
// ... в начале файла

// Login handler
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const employeeId = document.getElementById('employeeId').value.trim();
    
    // Валидация
    if (!employeeId) {
        showAuthMessage('❌ Пожалуйста, введите Employee ID');
        return;
    }
    
    if (!/^\d+$/.test(employeeId)) {
        showAuthMessage('❌ Employee ID должен содержать только цифры');
        return;
    }

    // Проверяем, является ли пользователь администратором
    const checkResult = await auth.checkAdmin(employeeId);
    
    if (!checkResult.success) {
        showAuthMessage('❌ ' + checkResult.error);
        return;
    }

    const data = checkResult.data;

    if (data.requires_password) {
        // Администратор - запрашиваем пароль
        showAdminPasswordPrompt(employeeId);
        return;
    }

    if (data.has_access) {
        // Обычный пользователь с доступом
        auth.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(auth.currentUser));
        localStorage.setItem('token', auth.token);
        showMainSection();
    } else {
        // Пользователь без доступа
        auth.currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(auth.currentUser));
        showAuthSection('⏳ ' + data.message);
    }
});

// Функция для запроса пароля администратора
function showAdminPasswordPrompt(employeeId) {
    const modal = document.createElement('div');
    modal.id = 'adminPasswordModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.background = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '2000';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2 style="margin-bottom: 16px;">🔐 Вход для администратора</h2>
            <p style="color: #909090; margin-bottom: 16px;">Введите пароль для ID: <strong>${employeeId}</strong></p>
            <div class="auth-form">
                <input type="password" id="adminPasswordInput" placeholder="Введите пароль" class="input-field">
                <div style="display: flex; gap: 12px; margin-top: 12px;">
                    <button id="confirmAdminPasswordBtn" class="btn-primary" style="flex: 1;">Войти</button>
                    <button id="cancelAdminPasswordBtn" class="btn-secondary" style="flex: 1;">Отмена</button>
                </div>
                <div id="adminPasswordMessage" style="margin-top: 12px; color: #ff1744; text-align: center;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const passwordInput = document.getElementById('adminPasswordInput');
    const confirmBtn = document.getElementById('confirmAdminPasswordBtn');
    const cancelBtn = document.getElementById('cancelAdminPasswordBtn');
    const messageDiv = document.getElementById('adminPasswordMessage');
    
    passwordInput?.focus();
    
    const handleConfirm = async () => {
        const password = passwordInput.value.trim();
        if (!password) {
            messageDiv.textContent = '❌ Пожалуйста, введите пароль';
            return;
        }
        
        confirmBtn.disabled = true;
        confirmBtn.textContent = '⏳ Проверка...';
        
        const result = await auth.verifyAdmin(employeeId, password);
        
        if (result.success) {
            localStorage.setItem('user', JSON.stringify(auth.currentUser));
            localStorage.setItem('token', auth.token);
            document.body.removeChild(modal);
            showAdminSection();
        } else {
            messageDiv.textContent = '❌ ' + result.error;
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Войти';
            passwordInput.value = '';
            passwordInput.focus();
        }
    };
    
    confirmBtn?.addEventListener('click', handleConfirm);
    passwordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    });
    cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        showAuthSection('Вход отменен');
    });
}

// Enter key для обычного логина
document.getElementById('employeeId')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn')?.click();
    }
});

// Добавляем валидацию в реальном времени
document.getElementById('employeeId')?.addEventListener('input', (e) => {
    const input = e.target;
    const value = input.value;
    
    // Удаляем все не-цифровые символы
    input.value = value.replace(/[^\d]/g, '');
    
    // Проверяем, изменилось ли значение
    if (value !== input.value) {
        showAuthMessage('⚠️ Employee ID должен содержать только цифры');
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    placesCache = {};
    auth.logout();
    showAuthSection('Вы вышли из системы');
    const input = document.getElementById('employeeId');
    if (input) input.value = '';
});

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    placesCache = {};
    auth.logout();
    showAuthSection('Вы вышли из системы');
    const input = document.getElementById('employeeId');
    if (input) input.value = '';
});

// Scroll buttons
document.getElementById('scrollLeft')?.addEventListener('click', () => {
    const container = document.getElementById('dateScrollContainer');
    if (container) {
        container.scrollBy({ left: -300, behavior: 'smooth' });
    }
});

document.getElementById('scrollRight')?.addEventListener('click', () => {
    const container = document.getElementById('dateScrollContainer');
    if (container) {
        container.scrollBy({ left: 300, behavior: 'smooth' });
    }
});

// Booking modal
const modal = document.getElementById('bookingModal');
const closeBtn = modal?.querySelector('.close');
const cancelBtn = document.getElementById('cancelBookingBtn');

closeBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
});
cancelBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
});
window.addEventListener('click', (event) => {
    if (modal && event.target === modal) modal.style.display = 'none';
});

document.getElementById('confirmBookingBtn')?.addEventListener('click', handleBookingConfirmation);

function loadPlaces() {
    if (loadPlacesTimeout) {
        clearTimeout(loadPlacesTimeout);
    }
    
    loadPlacesTimeout = setTimeout(async () => {
        try {
            const userId = auth.getUserId();
            if (!userId) return;
            
            const dateStr = selectedDate ? formatDateKey(selectedDate) : '';
            const cacheKey = `${userId}_${dateStr}`;
            
            // Проверяем кеш
            if (placesCache[cacheKey]) {
                renderPlaces(placesCache[cacheKey]);
                loadPlacesTimeout = null;
                return;
            }
            
            let url = `${API_BASE}/places/status?user_id=${userId}`;
            if (dateStr) {
                url += `&date=${dateStr}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data && data.places) {
                placesCache[cacheKey] = data.places;
                renderPlaces(data.places);
            }
        } catch (error) {
            console.error('Error loading places:', error);
        }
        loadPlacesTimeout = null;
    }, 300);
}

function renderPlaces(places) {
    const grid = document.getElementById('placesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    places.forEach(place => {
        const div = document.createElement('div');
        div.className = 'place-item';
        
        let statusClass = '';
        let canBook = false;
        
        if (place.is_booked) {
            if (place.booked_by === auth.getUserId()) {
                statusClass = 'your-booking';
            } else {
                statusClass = 'booked';
            }
        } else {
            statusClass = 'free';
            if (!place.user_has_booking) {
                canBook = true;
            }
        }
        div.classList.add(statusClass);
        
        div.innerHTML = `
            <span>${place.place_number}</span>
            <span class="block-label">${place.block}</span>
        `;
        
        if (canBook) {
            div.addEventListener('click', () => openBookingModal(place));
        }
        
        grid.appendChild(div);
    });
}

function openBookingModal(place) {
    const modal = document.getElementById('bookingModal');
    const placeInfo = document.getElementById('placeInfo');
    const dateInfo = document.getElementById('dateInfo');
    const confirmBtn = document.getElementById('confirmBookingBtn');
    
    if (placeInfo) {
        placeInfo.textContent = `Место ${place.place_number} (Блок ${place.block})`;
    }
    if (dateInfo && selectedDate) {
        const dateInfoObj = formatDateDisplay(selectedDate);
        dateInfo.textContent = `📅 ${dateInfoObj.dayName}, ${dateInfoObj.dayNumber} ${dateInfoObj.month}`;
    }
    if (confirmBtn) {
        confirmBtn.dataset.placeId = place.place_id;
        const dateStr = selectedDate ? formatDateKey(selectedDate) : '';
        confirmBtn.dataset.date = dateStr;
    }
    
    const oldNotification = document.getElementById('bookingNotification');
    if (oldNotification) {
        oldNotification.style.display = 'none';
    }
    
    if (modal) modal.style.display = 'flex';
}

function showBookingNotification(message, type = 'info') {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;
    
    let notificationDiv = document.getElementById('bookingNotification');
    
    if (!notificationDiv) {
        notificationDiv = document.createElement('div');
        notificationDiv.id = 'bookingNotification';
        notificationDiv.style.padding = '12px';
        notificationDiv.style.margin = '12px 0';
        notificationDiv.style.borderRadius = '8px';
        notificationDiv.style.textAlign = 'center';
        notificationDiv.style.fontWeight = '500';
        const form = modal.querySelector('.booking-form');
        if (form) {
            form.insertBefore(notificationDiv, form.firstChild);
        }
    }
    
    const colors = {
        success: 'rgba(0, 200, 83, 0.15)',
        error: 'rgba(255, 61, 61, 0.15)',
        info: 'rgba(123, 47, 252, 0.15)'
    };
    
    const textColors = {
        success: '#00c853',
        error: '#ff3d3d',
        info: '#7b2ffc'
    };
    
    notificationDiv.style.background = colors[type] || colors.info;
    notificationDiv.style.color = textColors[type] || textColors.info;
    notificationDiv.style.border = `1px solid ${textColors[type] || textColors.info}44`;
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block';
    
    setTimeout(() => {
        if (notificationDiv) {
            notificationDiv.style.display = 'none';
        }
    }, 5000);
}

async function handleBookingConfirmation() {
    if (isBookingInProgress) {
        showBookingNotification('⏳ Бронирование уже выполняется...', 'info');
        return;
    }
    
    isBookingInProgress = true;
    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '⏳ Бронирование...';
    }
    
    try {
        const placeId = parseInt(document.getElementById('confirmBookingBtn')?.dataset.placeId);
        const dateStr = document.getElementById('confirmBookingBtn')?.dataset.date;
        const userId = auth.getUserId();
        
        if (!dateStr) {
            showBookingNotification('❌ Ошибка: дата не выбрана', 'error');
            return;
        }
        
        const selectedDateObj = new Date(dateStr + 'T00:00:00Z');
        
        const today = new Date();
        const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        
        if (selectedDateObj < utcToday) {
            showBookingNotification('❌ Нельзя бронировать на прошедшую дату', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE}/bookings/?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                place_id: placeId,
                booking_date: selectedDateObj.toISOString(),
                user_id: userId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showBookingNotification('✅ Место успешно забронировано!', 'success');
            // Очищаем кеш для этой даты
            const cacheKey = `${userId}_${dateStr}`;
            delete placesCache[cacheKey];
            const modal = document.getElementById('bookingModal');
            if (modal) modal.style.display = 'none';
            loadPlaces();
        } else {
            showBookingNotification('❌ ' + (data.detail || 'Ошибка бронирования'), 'error');
        }
    } catch (error) {
        console.error('Error booking place:', error);
        showBookingNotification('❌ Ошибка соединения с сервером', 'error');
    } finally {
        isBookingInProgress = false;
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Забронировать';
        }
    }
}