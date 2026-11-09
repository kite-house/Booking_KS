// frontend/js/admin.js
// API_BASE объявлен в auth.js

let adminSelectedDate = null;
let adminDatesList = [];
let loadAdminPlacesTimeout = null;
let pendingUsersTimeout = null;
let adminBookingsTimeout = null;
let historyTimeout = null;

// Функции работы с датами для админа
function adminFormatDateKey(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function adminSelectDate(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    adminSelectedDate = date;
    adminRenderDateScroll();
    adminLoadPlaces();
}

function adminGenerateDates() {
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

function adminFormatDateDisplay(date) {
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

function adminRenderDateScroll() {
    const container = document.getElementById('adminDateScrollContainer');
    if (!container) return;
    
    adminDatesList = adminGenerateDates();
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const todayStr = adminFormatDateKey(utcToday);
    
    container.innerHTML = adminDatesList.map(date => {
        const dateInfo = adminFormatDateDisplay(date);
        const dateStr = adminFormatDateKey(date);
        const isPast = date.getTime() < utcToday.getTime();
        const isFuture = date.getTime() > new Date(utcToday.getTime() + 7 * 24 * 60 * 60 * 1000).getTime();
        const isActive = adminSelectedDate && adminFormatDateKey(adminSelectedDate) === dateStr;
        const isDisabled = isPast || isFuture;
        
        let classes = 'date-item';
        if (isActive) classes += ' active';
        if (isDisabled) classes += ' disabled';
        
        return `
            <div class="${classes}" data-date="${dateStr}" ${isDisabled ? '' : `onclick="adminSelectDate('${dateStr}')"`}>
                <span class="day-name">${dateInfo.dayName}</span>
                <span class="day-number">${dateInfo.dayNumber}</span>
                <span class="day-month">${dateInfo.month}</span>
            </div>
        `;
    }).join('');
    
    if (!adminSelectedDate) {
        adminSelectedDate = new Date(utcToday);
        adminLoadPlaces();
    }
}

function adminLoadPlaces() {
    if (loadAdminPlacesTimeout) {
        clearTimeout(loadAdminPlacesTimeout);
    }
    
    loadAdminPlacesTimeout = setTimeout(async () => {
        try {
            const dateStr = adminSelectedDate ? adminFormatDateKey(adminSelectedDate) : '';
            let url = `${API_BASE}/places/status`;
            if (dateStr) {
                url += `?date=${dateStr}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data && data.places) {
                adminRenderPlaces(data.places);
                adminUpdateStats(data.places);
            }
        } catch (error) {
            console.error('Error loading admin places:', error);
        }
        loadAdminPlacesTimeout = null;
    }, 300);
}

function adminRenderPlaces(places) {
    const grid = document.getElementById('adminPlacesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    places.forEach(place => {
        const div = document.createElement('div');
        div.className = 'place-item admin-view';
        
        let statusClass = place.is_booked ? 'booked' : 'free';
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
        
        if (place.is_booked) {
            const info = document.createElement('div');
            info.style.cssText = `
                position: absolute;
                bottom: 2px;
                font-size: 8px;
                background: rgba(255,255,255,0.2);
                padding: 2px 6px;
                border-radius: 4px;
                white-space: nowrap;
                cursor: pointer;
                right: 2px;
            `;
            const employeeId = place.booked_employee_id || place.booked_by || '?';
            info.textContent = `👤 ${employeeId}`;
            info.title = 'Нажмите для отмены брони';
            
            if (place.booking_id) {
                info.onclick = (e) => {
                    e.stopPropagation();
                    adminCancelBooking(place.booking_id, place.place_number);
                };
                div.style.cursor = 'pointer';
                div.title = 'Нажмите для отмены брони';
                div.onclick = () => {
                    adminCancelBooking(place.booking_id, place.place_number);
                };
            }
            div.appendChild(info);
        }
        
        grid.appendChild(div);
    });
}

function adminUpdateStats(places) {
    const stats = document.getElementById('adminStats');
    if (!stats) return;
    
    const total = places.length;
    const booked = places.filter(p => p.is_booked).length;
    const free = total - booked;
    const percent = Math.round((booked / total) * 100);
    
    stats.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <span>📊 Всего: <strong>${total}</strong></span>
            <span style="color: #ff1744;">🔴 Занято: <strong>${booked}</strong> (${percent}%)</span>
            <span style="color: #00c853;">🟢 Свободно: <strong>${free}</strong></span>
        </div>
    `;
}

function adminCancelBooking(bookingId, placeNumber) {
    if (!bookingId) {
        Swal.fire({
            title: '❌ Ошибка',
            text: 'ID бронирования не найден',
            icon: 'error',
            confirmButtonColor: '#7b2ffc',
            background: '#1a1a1a',
            color: '#e0e0e0'
        });
        return;
    }
    
    const adminId = auth.getUserId();
    if (!adminId) {
        Swal.fire({
            title: '❌ Ошибка',
            text: 'Не удалось определить администратора',
            icon: 'error',
            confirmButtonColor: '#7b2ffc',
            background: '#1a1a1a',
            color: '#e0e0e0'
        });
        return;
    }
    
    Swal.fire({
        title: '🔐 Отмена бронирования',
        html: `
            <p style="font-size: 16px; color: #e0e0e0;">Вы уверены, что хотите отменить бронирование?</p>
            <p style="font-size: 18px; font-weight: 600; color: #ff6d00; margin-top: 8px;">
                СЦ КРСС КС${placeNumber}
            </p>
            <p style="font-size: 14px; color: #909090; margin-top: 4px;">
                ⚠️ Действие выполняется от имени администратора
            </p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff6d00',
        cancelButtonColor: '#2a2a2a',
        confirmButtonText: '✅ Да, отменить',
        cancelButtonText: '❌ Нет, оставить',
        background: '#1a1a1a',
        color: '#e0e0e0',
        iconColor: '#ff6d00',
        reverseButtons: true,
        customClass: {
            popup: 'swal-dark',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/cancel-booking/${bookingId}?admin_id=${adminId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await Swal.fire({
                    title: '✅ Отменено!',
                    text: `Бронирование СЦ КРСС КС${placeNumber} успешно отменено администратором.`,
                    icon: 'success',
                    confirmButtonColor: '#7b2ffc',
                    background: '#1a1a1a',
                    color: '#e0e0e0',
                    confirmButtonText: 'Отлично',
                    timer: 2000,
                    timerProgressBar: true
                });
                
                adminLoadPlaces();
                loadAdminBookings();
                loadHistory();
            } else {
                const data = await response.json();
                await Swal.fire({
                    title: '❌ Ошибка',
                    text: data.detail || 'Не удалось отменить бронирование',
                    icon: 'error',
                    confirmButtonColor: '#7b2ffc',
                    background: '#1a1a1a',
                    color: '#e0e0e0'
                });
            }
        } catch (error) {
            console.error('Error canceling booking:', error);
            await Swal.fire({
                title: '❌ Ошибка',
                text: 'Ошибка соединения с сервером',
                icon: 'error',
                confirmButtonColor: '#7b2ffc',
                background: '#1a1a1a',
                color: '#e0e0e0'
            });
        }
    });
}

function loadPendingUsers() {
    if (pendingUsersTimeout) {
        clearTimeout(pendingUsersTimeout);
    }
    
    pendingUsersTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/pending-users`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const users = await response.json();
            
            const container = document.getElementById('pendingUsers');
            if (!container) return;
            
            if (users.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #909090;">
                        <p style="font-size: 18px;">✅ Нет ожидающих запросов</p>
                        <p style="font-size: 14px; margin-top: 8px;">Все пользователи имеют доступ</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = users.map(user => `
                <div class="user-item" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #2a2a2a;
                    background: #1a1a1a;
                    border-radius: 8px;
                    margin-bottom: 8px;
                ">
                    <div>
                        <strong style="font-size: 16px;">👤 ID: ${user.employee_id}</strong>
                        <span style="margin-left: 16px; color: #909090; font-size: 14px;">
                            🕐 ${new Date(user.created_at).toLocaleString()}
                        </span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-small grant" onclick="grantAccess(${user.id})" style="
                            padding: 8px 20px;
                            background: #00c853;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.3s;
                        ">✅ Выдать доступ</button>
                        <button class="btn-small delete" onclick="deleteUser(${user.id}, '${user.employee_id}')" style="
                            padding: 8px 20px;
                            background: #ff1744;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.3s;
                        ">🗑️ Удалить</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading pending users:', error);
        }
        pendingUsersTimeout = null;
    }, 500);
}

function grantAccess(userId) {
    fetch(`${API_BASE}/admin/pending-users`)
        .then(response => response.json())
        .then(users => {
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            Swal.fire({
                title: '👤 Выдача доступа',
                html: `
                    <p style="font-size: 16px; color: #e0e0e0;">Выдать доступ пользователю?</p>
                    <p style="font-size: 18px; font-weight: 600; color: #00c853; margin-top: 8px;">
                        ID: ${user.employee_id}
                    </p>
                    <p style="font-size: 14px; color: #909090; margin-top: 4px;">
                        🕐 Зарегистрирован: ${new Date(user.created_at).toLocaleString()}
                    </p>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#00c853',
                cancelButtonColor: '#2a2a2a',
                confirmButtonText: '✅ Да, выдать',
                cancelButtonText: '❌ Отмена',
                background: '#1a1a1a',
                color: '#e0e0e0',
                iconColor: '#00c853',
                reverseButtons: true
            }).then(async (result) => {
                if (!result.isConfirmed) return;
                
                try {
                    const response = await fetch(`${API_BASE}/admin/grant-access/${userId}`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        await Swal.fire({
                            title: '✅ Доступ выдан!',
                            text: `Пользователь ${user.employee_id} получил доступ.`,
                            icon: 'success',
                            confirmButtonColor: '#7b2ffc',
                            background: '#1a1a1a',
                            color: '#e0e0e0',
                            timer: 1500,
                            timerProgressBar: true
                        });
                        loadPendingUsers();
                    } else {
                        await Swal.fire({
                            title: '❌ Ошибка',
                            text: 'Не удалось выдать доступ',
                            icon: 'error',
                            confirmButtonColor: '#7b2ffc',
                            background: '#1a1a1a',
                            color: '#e0e0e0'
                        });
                    }
                } catch (error) {
                    console.error('Error granting access:', error);
                    await Swal.fire({
                        title: '❌ Ошибка',
                        text: 'Ошибка соединения с сервером',
                        icon: 'error',
                        confirmButtonColor: '#7b2ffc',
                        background: '#1a1a1a',
                        color: '#e0e0e0'
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            Swal.fire({
                title: '❌ Ошибка',
                text: 'Не удалось загрузить данные пользователя',
                icon: 'error',
                confirmButtonColor: '#7b2ffc',
                background: '#1a1a1a',
                color: '#e0e0e0'
            });
        });
}

function deleteUser(userId, employeeId) {
    Swal.fire({
        title: '⚠️ Удаление пользователя',
        html: `
            <p style="font-size: 16px; color: #e0e0e0;">Вы уверены, что хотите удалить пользователя?</p>
            <p style="font-size: 18px; font-weight: 600; color: #ff1744; margin-top: 8px;">
                ID: ${employeeId}
            </p>
            <p style="font-size: 14px; color: #ff1744; margin-top: 4px;">
                ⚠️ Все данные пользователя будут безвозвратно удалены!
            </p>
        `,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ff1744',
        cancelButtonColor: '#2a2a2a',
        confirmButtonText: '🗑️ Да, удалить',
        cancelButtonText: '❌ Отмена',
        background: '#1a1a1a',
        color: '#e0e0e0',
        iconColor: '#ff1744',
        reverseButtons: true
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/delete-user/${userId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await Swal.fire({
                    title: '✅ Удалено!',
                    text: `Пользователь ${employeeId} удален.`,
                    icon: 'success',
                    confirmButtonColor: '#7b2ffc',
                    background: '#1a1a1a',
                    color: '#e0e0e0',
                    timer: 1500,
                    timerProgressBar: true
                });
                loadPendingUsers();
            } else {
                await Swal.fire({
                    title: '❌ Ошибка',
                    text: 'Не удалось удалить пользователя',
                    icon: 'error',
                    confirmButtonColor: '#7b2ffc',
                    background: '#1a1a1a',
                    color: '#e0e0e0'
                });
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            await Swal.fire({
                title: '❌ Ошибка',
                text: 'Ошибка соединения с сервером',
                icon: 'error',
                confirmButtonColor: '#7b2ffc',
                background: '#1a1a1a',
                color: '#e0e0e0'
            });
        }
    });
}

function loadAdminBookings() {
    if (adminBookingsTimeout) {
        clearTimeout(adminBookingsTimeout);
    }
    
    adminBookingsTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/all-bookings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bookings = await response.json();
            
            const container = document.getElementById('adminBookings');
            if (!container) return;
            
            if (bookings.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #909090;">
                        <p style="font-size: 18px;">📭 Нет активных бронирований</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = bookings.map(booking => {
                const fullText = `СЦ КРСС КС${booking.place_number}`;
                
                return `
                    <div style="
                        padding: 10px 16px;
                        background: #1a1a1a;
                        border-radius: 8px;
                        margin-bottom: 6px;
                        border-left: 4px solid #7b2ffc;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: nowrap;
                    ">
                        <span style="color: #e0e0e0; font-size: 14px; white-space: nowrap; font-weight: 500;">${fullText}</span>
                        <span style="color: #909090; font-size: 13px; white-space: nowrap;">👤 ${booking.employee_id || booking.user_id}</span>
                        <span style="color: #909090; font-size: 13px; white-space: nowrap;">📅 ${new Date(booking.booking_date).toLocaleDateString()}</span>
                        <button onclick="adminCancelBooking(${booking.id}, ${booking.place_number})" style="
                            padding: 4px 14px;
                            background: #ff1744;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 500;
                            white-space: nowrap;
                        ">Отменить</button>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
        adminBookingsTimeout = null;
    }, 500);
}

function loadHistory() {
    if (historyTimeout) {
        clearTimeout(historyTimeout);
    }
    
    historyTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/all-bookings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bookings = await response.json();
            
            const container = document.getElementById('historyBookings');
            if (!container) return;
            
            if (bookings.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #909090;">
                        <p style="font-size: 18px;">История пуста</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = bookings.map(booking => {
                const fullText = `СЦ КРСС КС${booking.place_number}`;
                
                let statusText = 'Создано';
                let statusColor = '#78909c';
                let statusBg = 'rgba(120, 144, 156, 0.15)';
                
                if (booking.status === 'cancelled_by_user') {
                    statusText = 'Отменено пользователем';
                    statusColor = '#ff1744';
                    statusBg = 'rgba(255, 23, 68, 0.15)';
                } else if (booking.status === 'cancelled_by_admin') {
                    const canceller = booking.canceller_employee_id || booking.cancelled_by;
                    statusText = `Отменено админом (${canceller})`;
                    statusColor = '#ff6d00';
                    statusBg = 'rgba(255, 109, 0, 0.15)';
                } else if (booking.status === 'archived') {
                    statusText = 'Выполнено';
                    statusColor = '#00c853';
                    statusBg = 'rgba(0, 200, 83, 0.15)';
                }
                
                const dateStr = new Date(booking.booking_date).toLocaleDateString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });
                const timeStr = new Date(booking.booking_date).toLocaleTimeString('ru-RU', {
                    hour: '2-digit', minute: '2-digit'
                });
                
                return `
                    <div style="
                        padding: 10px 16px;
                        background: #1a1a1a;
                        border-radius: 8px;
                        margin-bottom: 6px;
                        border-left: 4px solid ${statusColor};
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: nowrap;
                    ">
                        <span style="color: #e0e0e0; font-size: 14px; white-space: nowrap; font-weight: 500;">${fullText}</span>
                        <span style="color: #909090; font-size: 13px; white-space: nowrap;">👤 ${booking.employee_id}</span>
                        <span style="color: #909090; font-size: 13px; white-space: nowrap;">📅 ${dateStr} ${timeStr}</span>
                        <span style="
                            color: ${statusColor};
                            background: ${statusBg};
                            padding: 2px 12px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 500;
                            white-space: nowrap;
                            margin-left: auto;
                        ">${statusText}</span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading history:', error);
        }
        historyTimeout = null;
    }, 500);
}

function setupAdminTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            const target = document.getElementById(`${tabId}-tab`);
            if (target) target.classList.add('active');
            
            if (tabId === 'pending') loadPendingUsers();
            if (tabId === 'bookings') {
                adminRenderDateScroll();
                adminLoadPlaces();
            }
            if (tabId === 'history') loadHistory();
        });
    });
}

function initAdmin() {
    adminRenderDateScroll();
    adminLoadPlaces();
    
    document.getElementById('adminScrollLeft')?.addEventListener('click', () => {
        const container = document.getElementById('adminDateScrollContainer');
        if (container) {
            container.scrollBy({ left: -300, behavior: 'smooth' });
        }
    });
    
    document.getElementById('adminScrollRight')?.addEventListener('click', () => {
        const container = document.getElementById('adminDateScrollContainer');
        if (container) {
            container.scrollBy({ left: 300, behavior: 'smooth' });
        }
    });
}