# HH Finder - Автоматический поиск работы

🚀 **HH Finder** - это полноценный сервис для автоматического поиска и отклика на вакансии в HH.RU с использованием искусственного интеллекта.

## ✨ Основные возможности

### 🔍 Автоматический поиск
- Поиск релевантных вакансий по заданным критериям
- Сохранение и управление поисковыми запросами
- Автоматическое обновление результатов

### 🤖 ИИ сопроводительные письма
- Генерация персонализированных писем с помощью OpenAI GPT
- Различные шаблоны для разных типов позиций
- Анализ резюме и рекомендации по улучшению

### 📊 Аналитика и рекомендации
- Статистика по откликам и их эффективности
- Рекомендации от ИИ HR-консультанта
- Персональные советы по карьерному развитию

### 📱 Многоканальные уведомления
- Email уведомления через SMTP
- Telegram уведомления через Bot API
- Push уведомления через OneSignal

### 💼 Интеграция с HH.RU
- Авторизация через официальное API HH.RU
- Импорт резюме и данных профиля
- Автоматическая отправка откликов

## 💰 Тарифные планы

| План | Цена | Возможности |
|------|------|-------------|
| **Бесплатно** | 0₽ | 24 часа, до 50 откликов |
| **Базовый** | 700₽/мес | Неограниченные отклики, ИИ письма |
| **Премиум** | 1990₽/мес | Все возможности + аналитика ИИ |

## 🛠 Технологический стек

### Backend
- **Node.js** + **Express** - серверная часть
- **MongoDB** + **Mongoose** - база данных
- **Passport.js** - аутентификация через HH.RU
- **OpenAI API** - генерация текстов
- **Nodemailer** - отправка email
- **OneSignal** - push уведомления

### Frontend
- **React** + **React Router** - пользовательский интерфейс
- **Tailwind CSS** - стилизация
- **React Query** - управление состоянием
- **Framer Motion** - анимации
- **Lucide React** - иконки

### Интеграции
- **HH.RU API** - поиск вакансий и отправка откликов
- **OpenAI GPT** - генерация сопроводительных писем
- **Telegram Bot API** - уведомления
- **OneSignal** - push уведомления
- **ЮКасса** - платежная система

## 🚀 Быстрый старт

### Автоматическая установка
```bash
# Клонируйте репозиторий
git clone <repository-url>
cd hh-auto-post

# Запустите скрипт установки
./setup.sh
```

### Ручная установка

1. **Установите зависимости**
```bash
# Сервер
npm install

# Клиент
cd client
npm install
cd ..
```

2. **Настройте базу данных**
```bash
# Установите MongoDB
# Ubuntu/Debian: sudo apt install mongodb
# macOS: brew install mongodb-community
# Windows: https://www.mongodb.com/try/download/community

# Запустите MongoDB
mongod --dbpath ./data/db
```

3. **Настройте переменные окружения**
```bash
# Скопируйте пример конфигурации
cp env.example .env

# Отредактируйте .env файл с вашими настройками
```

4. **Запустите приложение**
```bash
# Режим разработки (сервер + клиент)
npm run dev

# Или отдельно:
# Сервер
npm start

# Клиент (в другом терминале)
cd client && npm start
```

## ⚙️ Конфигурация

### Обязательные настройки в `.env`:

```env
# База данных
MONGODB_URI=mongodb://localhost:27017/hh-finder

# HH.RU OAuth (замените на ваши ключи)
HH_CLIENT_ID=your-hh-client-id
HH_CLIENT_SECRET=your-hh-client-secret

# OpenAI API (замените на ваш ключ)
OPENAI_API_KEY=your-openai-api-key

# Email SMTP (замените на ваши настройки)
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# OneSignal (замените на ваш App ID)
ONESIGNAL_APP_ID=your-onesignal-app-id

# Секретные ключи (сгенерируйте свои)
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here
```

### Дополнительные настройки:

```env
# Telegram Bot (для уведомлений)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# ЮКасса (для платежей)
YOOKASSA_SHOP_ID=your-yookassa-shop-id
YOOKASSA_SECRET_KEY=your-yookassa-secret-key
```

## 📁 Структура проекта

```
hh-auto-post/
├── server.js                 # Главный файл сервера
├── package.json              # Зависимости сервера
├── env.example               # Пример конфигурации
├── setup.sh                  # Скрипт установки
├── models/                    # Модели MongoDB
│   ├── User.js
│   ├── Vacancy.js
│   ├── Search.js
│   ├── Response.js
│   └── Payment.js
├── routes/                    # API маршруты
│   ├── auth.js               # Аутентификация
│   ├── user.js               # Пользователи
│   ├── vacancies.js          # Вакансии
│   ├── responses.js          # Отклики
│   ├── ai.js                 # ИИ функции
│   ├── payments.js           # Платежи
│   ├── notifications.js      # Уведомления
│   └── admin.js              # Админ панель
├── config/
│   └── passport.js           # Конфигурация Passport
└── client/                   # React приложение
    ├── package.json
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   ├── contexts/         # React контексты
    │   ├── components/       # React компоненты
    │   └── pages/            # Страницы
    └── public/
        └── index.html
```

## 🔧 API Endpoints

### Аутентификация
- `GET /api/auth/hh` - Вход через HH.RU
- `GET /api/auth/hh/callback` - Callback от HH.RU
- `GET /api/auth/me` - Информация о пользователе
- `POST /api/auth/logout` - Выход

### Пользователи
- `GET /api/user/profile` - Профиль пользователя
- `PUT /api/user/profile` - Обновление профиля
- `POST /api/user/import-resume` - Импорт резюме из HH.RU
- `GET /api/user/stats` - Статистика пользователя

### Вакансии
- `POST /api/vacancies/search` - Поиск вакансий
- `GET /api/vacancies/:id` - Детали вакансии
- `GET /api/vacancies/searches` - Сохраненные поиски
- `POST /api/vacancies/searches` - Создание поиска

### Отклики
- `POST /api/responses` - Создание отклика
- `GET /api/responses` - Список откликов
- `POST /api/responses/bulk` - Массовая отправка

### ИИ
- `POST /api/ai/cover-letter` - Генерация письма
- `POST /api/ai/assistant` - ИИ ассистент
- `POST /api/ai/resume-analysis` - Анализ резюме

### Платежи
- `GET /api/payments/plans` - Тарифные планы
- `POST /api/payments/create` - Создание платежа
- `POST /api/payments/webhook` - Webhook ЮКасса

### Уведомления
- `POST /api/notifications/test` - Тест уведомлений
- `GET /api/notifications/status` - Статус уведомлений

### Админ
- `GET /api/admin/stats` - Общая статистика
- `GET /api/admin/users` - Список пользователей
- `GET /api/admin/payments` - История платежей
- `GET /api/admin/responses` - Аналитика откликов

## 🎯 Использование

1. **Регистрация**: Пользователь входит через HH.RU
2. **Настройка профиля**: Импорт резюме и заполнение информации
3. **Создание поиска**: Настройка критериев поиска вакансий
4. **Автоматические отклики**: Сервис находит вакансии и отправляет отклики
5. **Уведомления**: Пользователь получает уведомления о новых вакансиях и статусе откликов

## 🔒 Безопасность

- Используется официальное API HH.RU
- Все данные передаются по HTTPS
- Пароли и токены хешируются
- Реализована защита от CSRF и XSS
- Rate limiting для API endpoints

## 📊 Мониторинг

- Логирование всех операций
- Отслеживание ошибок
- Статистика использования
- Мониторинг производительности

## 🚀 Развертывание

### Локальная разработка
```bash
npm run dev
```

### Продакшн
```bash
# Сборка клиента
cd client && npm run build && cd ..

# Запуск сервера
NODE_ENV=production npm start
```

### Docker (опционально)
```bash
# Создайте Dockerfile для контейнеризации
# Настройте docker-compose.yml для оркестрации
```

## 🤝 Поддержка

- **Email**: support@hh-finder.ru
- **Telegram**: @hh_finder_support
- **Документация**: README.md

## 📄 Лицензия

MIT License - см. файл LICENSE

---

**HH Finder** - ваш надежный помощник в поиске работы! 🎯✨