// frontend/js/app.js
// API_BASE объявлен в auth.js

let selectedDate = null;
let currentDate = new Date();
let datesList = [];
let placesCache = {};
let loadPlacesTimeout = null;
let isBookingInProgress = false;

// Отображение ID на одной строке при вводе
document.getElementById('employeeId')?.addEventListener('input', function() {
    const displaySpan = document.getElementById('displayEmployeeId');
    if (displaySpan) {
        const value = this.value.trim();
        displaySpan.textContent = value ? value : '';
        displaySpan.style.color = value ? '#7b2ffc' : '#e0e0e0';
    }
});

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
        userName.style.whiteSpace = 'nowrap';
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
    
    const adminName = document.getElementById('adminName');
    if (adminName && auth.currentUser) {
        adminName.textContent = `Администратор (ID: ${auth.currentUser.employee_id})`;
        adminName.style.whiteSpace = 'nowrap';
    }
    
    if (typeof loadPendingUsers === 'function') loadPendingUsers();
    if (typeof initAdmin === 'function') initAdmin();
    if (typeof loadHistory === 'function') loadHistory();
    if (typeof setupAdminTabs === 'function') setupAdminTabs();
}

// Шаг 1: Проверка ID
document.getElementById('checkIdBtn')?.addEventListener('click', async () => {
    const employeeId = document.getElementById('employeeId').value.trim();
    
    if (!employeeId) {
        showAuthMessage('❌ Пожалуйста, введите Employee ID');
        return;
    }
    
    if (!/^\d+$/.test(employeeId)) {
        showAuthMessage('❌ Employee ID должен содержать только цифры');
        return;
    }

    const result = await auth.checkUser(employeeId);
    
    if (!result.success) {
        showAuthMessage('❌ ' + result.error);
        return;
    }

    window.tempEmployeeId = employeeId;
    
    if (result.data.exists) {
        showStep2(false);
    } else {
        showStep2(true);
    }
});

// Шаг 2: Регистрация/Вход
function showStep2(isNewUser) {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    
    const title = document.getElementById('step2Title');
    const info = document.getElementById('step2Info');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const passwordConfirm = document.getElementById('passwordConfirm');
    
    if (isNewUser) {
        title.textContent = '📝 Регистрация';
        info.textContent = `Создайте пароль для ID: ${window.tempEmployeeId}`;
        registerBtn.style.display = 'block';
        loginBtn.style.display = 'none';
        passwordConfirm.style.display = 'block';
    } else {
        title.textContent = '🔐 Вход';
        info.textContent = `Введите пароль для ID: ${window.tempEmployeeId}`;
        registerBtn.style.display = 'none';
        loginBtn.style.display = 'block';
        passwordConfirm.style.display = 'none';
    }
    
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordConfirm').value = '';
    document.getElementById('step2Message').style.display = 'none';
}

// Регистрация
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    const messageDiv = document.getElementById('step2Message');
    
    if (!password || password.length < 4) {
        messageDiv.textContent = '❌ Пароль должен быть не менее 4 символов';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }
    
    if (password !== passwordConfirm) {
        messageDiv.textContent = '❌ Пароли не совпадают';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    const result = await auth.register(window.tempEmployeeId, password);
    
    if (result.success) {
        localStorage.setItem('user', JSON.stringify(auth.currentUser));
        localStorage.setItem('token', auth.token);
        
        messageDiv.textContent = '✅ Регистрация успешна!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('step1').style.display = 'block';
            document.getElementById('step2').style.display = 'none';
            document.getElementById('employeeId').value = '';
            window.tempEmployeeId = null;
            
            showAuthMessage('⏳ Ваш запрос на доступ отправлен администратору. Ожидайте подтверждения!');
        }, 1500);
    } else {
        messageDiv.textContent = '❌ ' + result.error;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
});

// Вход
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const messageDiv = document.getElementById('step2Message');
    
    if (!password) {
        messageDiv.textContent = '❌ Введите пароль';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    const result = await auth.login(window.tempEmployeeId, password);
    
    if (result.success) {
        localStorage.setItem('user', JSON.stringify(auth.currentUser));
        localStorage.setItem('token', auth.token);
        
        if (auth.isAdmin()) {
            showAdminSection();
        } else if (auth.hasAccess()) {
            showMainSection();
        } else {
            document.getElementById('step1').style.display = 'block';
            document.getElementById('step2').style.display = 'none';
            document.getElementById('employeeId').value = '';
            window.tempEmployeeId = null;
            showAuthMessage('⏳ Ваш доступ ожидает подтверждения от администратора');
        }
    } else {
        messageDiv.textContent = '❌ ' + result.error;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
});

// Назад к шагу 1
document.getElementById('backToStep1')?.addEventListener('click', () => {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('authMessage').style.display = 'none';
    window.tempEmployeeId = null;
});

// Enter key для шага 1
document.getElementById('employeeId')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('checkIdBtn')?.click();
    }
});

// Enter key для пароля
document.getElementById('passwordInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const registerBtn = document.getElementById('registerBtn');
        const loginBtn = document.getElementById('loginBtn');
        if (registerBtn.style.display !== 'none') {
            registerBtn.click();
        } else {
            loginBtn.click();
        }
    }
});

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
    
    // При показе сообщения скрываем отображение ID
    const displaySpan = document.getElementById('displayEmployeeId');
    if (displaySpan) {
        displaySpan.textContent = '';
    }
    
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

// Logout - мгновенный выход
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    placesCache = {};
    auth.logout();
    
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'none';
    
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('employeeId').value = '';
    window.tempEmployeeId = null;
    
    document.getElementById('authMessage').style.display = 'block';
    showAuthMessage('Вы вышли из системы');
});

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    placesCache = {};
    auth.logout();
    
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('admin-section').style.display = 'none';
    
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('employeeId').value = '';
    window.tempEmployeeId = null;
    
    document.getElementById('authMessage').style.display = 'block';
    showAuthMessage('Вы вышли из системы');
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
        let canCancel = false;
        
        if (place.is_booked) {
            if (place.booked_by === auth.getUserId()) {
                statusClass = 'your-booking';
                if (place.can_cancel) {
                    canCancel = true;
                }
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
        
        // Вычисляем блок и цифру
        const placeNumber = place.place_number;
        let blockNumber, digitNumber, isExtra = false;
        
        if (placeNumber >= 1 && placeNumber <= 18) {
            blockNumber = 1;
            digitNumber = Math.ceil(placeNumber / 2);
        } else if (placeNumber >= 19 && placeNumber <= 20) {
            blockNumber = 1;
            isExtra = true;
            digitNumber = null;
        } else if (placeNumber >= 21 && placeNumber <= 38) {
            blockNumber = 2;
            const localNum = placeNumber - 20;
            digitNumber = Math.ceil(localNum / 2);
        } else if (placeNumber >= 39 && placeNumber <= 40) {
            blockNumber = 2;
            isExtra = true;
            digitNumber = null;
        } else if (placeNumber >= 41 && placeNumber <= 58) {
            blockNumber = 3;
            const localNum = placeNumber - 40;
            digitNumber = Math.ceil(localNum / 2);
        } else if (placeNumber >= 59 && placeNumber <= 60) {
            blockNumber = 3;
            isExtra = true;
            digitNumber = null;
        }
        
        // Формируем текст
        const blockText = `Б${blockNumber}`;
        const ksText = `КС${placeNumber}`;
        
        let bottomText = '';
        if (isExtra) {
            bottomText = `${blockText} ДОП`;
        } else {
            bottomText = `${blockText} Ц${digitNumber}`;
        }
        
        div.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 4px;">
                <span style="font-size: 11px; font-weight: 600; opacity: 0.9; text-align: center; line-height: 1.2;">СЦ КРСС ${ksText}</span>
                <span style="font-size: 10px; font-weight: 400; opacity: 0.8; margin-top: 2px;">${bottomText}</span>
            </div>
        `;
        
        if (canCancel) {
            const cancelBtn = document.createElement('div');
            cancelBtn.style.cssText = `
                position: absolute;
                bottom: 2px;
                font-size: 8px;
                background: rgba(255,255,255,0.2);
                padding: 2px 6px;
                border-radius: 4px;
                cursor: pointer;
            `;
            cancelBtn.textContent = '✕ Отменить';
            cancelBtn.onclick = (e) => {
                e.stopPropagation();
                cancelUserBooking(place.booking_id, place.place_number);
            };
            div.appendChild(cancelBtn);
        }
        
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
    
    // Вычисляем блок и цифру для отображения
    const placeNumber = place.place_number;
    let blockNumber, digitNumber, isExtra = false;
    
    if (placeNumber >= 1 && placeNumber <= 18) {
        blockNumber = 1;
        digitNumber = Math.ceil(placeNumber / 2);
    } else if (placeNumber >= 19 && placeNumber <= 20) {
        blockNumber = 1;
        isExtra = true;
        digitNumber = null;
    } else if (placeNumber >= 21 && placeNumber <= 38) {
        blockNumber = 2;
        const localNum = placeNumber - 20;
        digitNumber = Math.ceil(localNum / 2);
    } else if (placeNumber >= 39 && placeNumber <= 40) {
        blockNumber = 2;
        isExtra = true;
        digitNumber = null;
    } else if (placeNumber >= 41 && placeNumber <= 58) {
        blockNumber = 3;
        const localNum = placeNumber - 40;
        digitNumber = Math.ceil(localNum / 2);
    } else if (placeNumber >= 59 && placeNumber <= 60) {
        blockNumber = 3;
        isExtra = true;
        digitNumber = null;
    }
    
    const blockText = `Б${blockNumber}`;
    let fullText = `СЦ КРСС КС${placeNumber}`;
    
    if (isExtra) {
        fullText += ` ${blockText} ДОП`;
    } else {
        fullText += ` ${blockText} Ц${digitNumber}`;
    }
    
    if (placeInfo) {
        placeInfo.textContent = fullText;
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

async function cancelUserBooking(bookingId, placeNumber) {
    if (!confirm(`Вы уверены, что хотите отменить бронирование места ${placeNumber}?`)) {
        return;
    }
    
    try {
        const userId = auth.getUserId();
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel?user_id=${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showBookingNotification('✅ Бронирование отменено!', 'success');
            loadPlaces();
        } else {
            showBookingNotification('❌ ' + (data.detail || 'Ошибка отмены'), 'error');
        }
    } catch (error) {
        console.error('Error canceling booking:', error);
        showBookingNotification('❌ Ошибка соединения с сервером', 'error');
    }
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