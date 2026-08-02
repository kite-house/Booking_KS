<div align="center">
  <h1>🏢 KS Booking System</h1>
  <p><strong>Сервис для бронирования мест сортировки (КС) на Wildberries с современным веб-интерфейсом и админ-панелью</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Python-3.12.10-blue?style=flat-square&logo=python" alt="Python 3.12">
    <img src="https://img.shields.io/badge/FastAPI-0.115.6-009688?style=flat-square&logo=fastapi" alt="FastAPI">
    <img src="https://img.shields.io/badge/SQLAlchemy-2.0.37-red?style=flat-square&logo=sqlalchemy" alt="SQLAlchemy">
    <img src="https://img.shields.io/badge/Alembic-1.14.1-FFB300?style=flat-square&logo=python" alt="Alembic">
    <img src="https://img.shields.io/badge/PostgreSQL-17.4-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Redis-7.4-DC382D?style=flat-square&logo=redis" alt="Redis">
    <img src="https://img.shields.io/badge/Docker-✓-2496ED?style=flat-square&logo=docker" alt="Docker">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License MIT">
    <img src="https://img.shields.io/badge/HTML5-CSS3-orange?style=flat-square&logo=html5" alt="HTML5/CSS3">
    <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript" alt="JavaScript">
    <img src="https://img.shields.io/badge/Nginx-1.27-009639?style=flat-square&logo=nginx" alt="Nginx">
  </p>
</div>

## ✨ О проекте

**KS Booking System** — это полностью контейнеризированный сервис для бронирования мест сортировки (КС) на складах Wildberries. Система позволяет сотрудникам бронировать рабочие места на неделю вперед, а администраторам — управлять доступом и контролировать загрузку мест в реальном времени.

### Основные возможности:
- 🔐 **Авторизация по Employee ID** — вход по ID сотрудника Wildberries с автоматическим созданием пользователя
- 👑 **Админ-панель** — выдача доступа новым пользователям, просмотр бронирований в реальном времени
- 📅 **Бронирование на неделю** — выбор даты через удобную скролл-ленту, бронирование только на 7 дней вперед
- 🎯 **60 мест** — разделены на 3 блока (A, B, C) по 20 мест каждый
- 🎨 **Темный дизайн** — современный минималистичный интерфейс с интуитивной визуализацией
- 📊 **Статистика** — администратор видит загруженность мест и может управлять бронированиями
- 🗄️ **Управление схемой БД** через Alembic миграции (отдельный сервис)
- 🐳 **Docker-first подход** — весь стек поднимается одной командой
- 🔄 **Асинхронность** — все операции с БД выполняются асинхронно через SQLAlchemy

## 🛠 Стек технологий

| Компонент | Технология |
|-----------|------------|
| **Язык (Backend)** | [Python 3.12.10](https://www.python.org/) |
| **Веб-фреймворк (Backend)** | [FastAPI 0.115.6](https://fastapi.tiangolo.com/) |
| **ORM** | [SQLAlchemy 2.0.37](https://www.sqlalchemy.org/) |
| **Миграции БД** | [Alembic 1.14.1](https://alembic.sqlalchemy.org/) |
| **База данных** | [PostgreSQL 17.4](https://www.postgresql.org/) |
| **Кэш** | [Redis 7.4](https://redis.io/) |
| **Веб-сервер (Frontend)** | [Nginx](https://nginx.org/) |
| **Фронтенд** | HTML5, CSS3, JavaScript (Vanilla) |
| **Контейнеризация** | [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) |

## 🚀 Быстрый старт

### Предварительные требования
- Установленные [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/)

### Установка и запуск

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/your-username/Booking_KS.git
   cd Booking_KS
   ```

2. **Настройте переменные окружения**
   
   Скопируйте файл с примером конфигурации и отредактируйте его под себя:
   ```bash
   cp .env.example .env
   ```
   
   Минимально необходимые настройки:
   ```ini
   # ==================================================
   # ⚙️ REQUIRED ENVIRONMENT VARIABLES
   # ==================================================
   
   # 🚀 Application Mode
   MODE=DEV  # DEV, TEST, or PROD
   BACKEND_PORT=8000
   BACKEND_HOST=0.0.0.0
   FRONTEND_PORT=80
   
   # ==================================================
   # 🗄️ Database (PostgreSQL)
   # ==================================================
   DB_USER=postgres
   DB_PASS=postgres
   DB_HOST=postgres_db
   DB_PORT=5432
   DB_NAME=postgres_db
   
   # ==================================================
   # ⚡ Redis (Cache)
   # ==================================================
   REDIS_HOST=cache
   REDIS_PORT=6379
   REDIS_PASSWORD=1234
   ```

3. **Запустите все сервисы**
   ```bash
   docker compose up -d --build
   ```
   
   > **Примечание:** Сервис `migrations` автоматически применяет миграции перед запуском backend. Backend запускается только после успешного завершения миграций.

4. **Создайте администратора**
   ```bash
   docker exec -it postgres_db psql -U postgres -d postgres_db -c "INSERT INTO users (employee_id, has_access, role) VALUES ('admin', true, 'admin') ON CONFLICT (employee_id) DO UPDATE SET has_access = true, role = 'admin';"
   ```

5. **Проверьте работу**
   - Веб-интерфейс: http://localhost
   - Документация API (Swagger): http://localhost:8000/docs
   - Для входа как администратор используйте Employee ID: `admin`

## 👥 Роли пользователей

### Обычный пользователь
1. Вводит свой Employee ID на странице входа
2. Если пользователь новый — запрос отправляется администратору
3. После получения доступа может бронировать места
4. Бронирование доступно на неделю вперед
5. Можно забронировать только одно место в день

### Администратор
1. Входит с Employee ID: `admin` (или созданный вами)
2. Видит админ-панель с тремя вкладками:
   - **Выдача доступа** — список новых пользователей, ожидающих подтверждения
   - **Бронирования** — визуализация всех мест с возможностью отмены
   - **История** — полная история всех бронирований
3. Может удалять пользователей и отменять бронирования

## 📊 Структура базы данных

```sql
-- Пользователи
users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100),
    has_access BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
)

-- Места (КС)
ks_places (
    id SERIAL PRIMARY KEY,
    place_number INTEGER UNIQUE NOT NULL,  -- 1-60
    block VARCHAR(1) NOT NULL,             -- A, B, C
    is_active INTEGER DEFAULT 1
)

-- Бронирования
bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    place_id INTEGER REFERENCES ks_places(id),
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, booking_date)
)
```

## 🗄️ Управление миграциями (Alembic)

Проект использует **Alembic** для управления схемой базы данных. Миграции запускаются в отдельном сервисе `migrations`.

### Команды для работы с миграциями

```bash
# Создать новую миграцию
docker compose exec backend alembic revision --autogenerate -m "Описание изменений"

# Применить все ожидающие миграции
docker compose exec backend alembic upgrade head

# Откатить последнюю миграцию
docker compose exec backend alembic downgrade -1

# Показать текущую версию БД
docker compose exec backend alembic current

# Перезапустить миграции (после сброса БД)
docker compose up -d --force-recreate migrations
```

## 📖 Использование

### 🌐 Веб-интерфейс

#### Вход в систему
1. Откройте http://localhost
2. Введите ваш Employee ID (например: `admin` для администратора)
3. Нажмите "Войти"

#### Бронирование места (для пользователей)
1. Выберите дату в скролл-ленте (доступны только 7 дней вперед)
2. Нажмите на зеленый квадрат (свободное место)
3. Подтвердите бронирование в модальном окне
4. Место станет фиолетовым (если забронировано вами) или красным (если другим пользователем)

#### Администрирование
1. **Выдача доступа** — в списке ожидающих нажмите "Выдать доступ"
2. **Удаление пользователя** — нажмите "Удалить" рядом с пользователем
3. **Отмена бронирования** — кликните на занятое место или нажмите "Отменить" в списке

### 🔗 API Эндпоинты

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/auth/login` | Авторизация по Employee ID |
| GET | `/api/places/status` | Получить статус всех мест (с фильтром по дате) |
| POST | `/api/bookings/` | Создать бронирование |
| GET | `/api/bookings/user/{user_id}` | Получить бронирования пользователя |
| DELETE | `/api/bookings/{booking_id}` | Отменить бронирование |
| GET | `/api/admin/pending-users` | Список пользователей, ожидающих доступа |
| GET | `/api/admin/all-bookings` | Все бронирования (для админа) |
| POST | `/api/admin/grant-access/{user_id}` | Выдать доступ пользователю |
| DELETE | `/api/admin/delete-user/{user_id}` | Удалить пользователя |
| DELETE | `/api/admin/cancel-booking/{booking_id}` | Отменить бронирование (админ) |

### 📝 Примеры запросов (cURL)

**Авторизация:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "admin"}'
```

**Получить статус мест на сегодня:**
```bash
curl http://localhost:8000/api/places/status?user_id=1
```

**Получить статус мест на конкретную дату:**
```bash
curl http://localhost:8000/api/places/status?user_id=1&date=2026-08-02
```

**Создать бронирование:**
```bash
curl -X POST "http://localhost:8000/api/bookings/?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{"place_id": 5, "booking_date": "2026-08-03T00:00:00.000Z"}'
```

**Отменить бронирование (админ):**
```bash
curl -X DELETE http://localhost:8000/api/admin/cancel-booking/1
```

**Выдать доступ пользователю:**
```bash
curl -X POST http://localhost:8000/api/admin/grant-access/1
```

**Удалить пользователя:**
```bash
curl -X DELETE http://localhost:8000/api/admin/delete-user/1
```

## 📁 Структура проекта

```
Booking_KS/
├── backend/                        # FastAPI приложение
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini                 # Конфигурация Alembic
│   ├── alembic/                    # Миграции БД
│   │   ├── versions/               # Файлы миграций
│   │   ├── env.py                  # Конфигурация окружения
│   │   └── script.py.mako          # Шаблон миграций
│   └── app/                        # Исходный код бэкенда
│       ├── api/                    # Эндпоинты API
│       │   ├── auth.py             # Авторизация
│       │   ├── bookings.py         # Бронирования
│       │   ├── places.py           # Места
│       │   └── admin.py            # Админ-панель
│       ├── core/                   # Ядро приложения
│       │   ├── config.py
│       │   ├── database.py
│       │   └── dependencies.py
│       ├── models/                 # SQLAlchemy модели
│       │   ├── user.py
│       │   ├── booking.py
│       │   └── ks_place.py
│       ├── schemas/                # Pydantic схемы
│       │   ├── user.py
│       │   └── booking.py
│       ├── services/               # Бизнес-логика
│       │   ├── auth_service.py
│       │   ├── booking_service.py
│       │   └── admin_service.py
│       └── main.py                 # Точка входа
├── frontend/                       # Статические файлы веб-интерфейса
│   ├── assets/                     # Ресурсы
│   ├── css/
│   │   └── style.css               # Стили с темной темой
│   ├── js/
│   │   ├── auth.js                 # Авторизация
│   │   ├── app.js                  # Основная логика
│   │   └── admin.js                # Админ-панель
│   ├── index.html                  # Главная страница
│   ├── Dockerfile
│   └── nginx.conf                  # Конфигурация Nginx
├── .env.example                    # Пример конфигурации
├── docker-compose.yml              # Оркестрация всех сервисов
└── README.md                       # Документация
```

## 🎨 Особенности интерфейса

- **Темная тема** — современный дизайн с приятной цветовой гаммой
- **Адаптивность** — корректно отображается на всех устройствах
- **Визуализация мест** — зеленые (свободно), красные (занято), фиолетовые (ваше бронирование)
- **Скролл-лента дат** — удобный выбор даты с выделением текущего дня
- **Модальные окна** — подтверждение бронирования с информацией о месте и дате
- **Уведомления** — информативные сообщения об успехе или ошибке
- **Защита от двойного клика** — кнопка бронирования блокируется во время запроса

## 🤝 Вклад в проект

Будем рады вашим идеям и улучшениям! Чтобы внести вклад:

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m '✨ Add some amazing feature'`)
4. Запушьте ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Проект распространяется под лицензией MIT. Подробности в файле LICENSE.
