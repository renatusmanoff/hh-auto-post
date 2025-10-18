# HH Finder - Инструкции по запуску

## 🚀 Быстрый запуск

### 1. Автоматическая установка
```bash
# Запустите скрипт установки
./setup.sh
```

### 2. Ручная установка

#### Установка зависимостей
```bash
# Сервер
npm install

# Клиент
cd client && npm install && cd ..
```

#### Настройка базы данных
```bash
# Установите MongoDB
# Ubuntu/Debian: sudo apt install mongodb
# macOS: brew install mongodb-community
# Windows: https://www.mongodb.com/try/download/community

# Запустите MongoDB
mongod --dbpath ./data/db
```

#### Настройка конфигурации
```bash
# Скопируйте пример конфигурации
cp env.example .env

# Или используйте готовые настройки для разработки
cp env.local .env

# Отредактируйте .env файл при необходимости
```

#### Запуск приложения
```bash
# Режим разработки (сервер + клиент)
npm run dev

# Или отдельно:
# Терминал 1 (сервер)
npm start

# Терминал 2 (клиент)
cd client && npm start
```

## 🌐 Доступ к приложению

- **Фронтенд**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Админ панель**: http://localhost:3000/admin

## 🔑 Настройка интеграций

### Вариант 1: Использовать готовые настройки для разработки
```bash
# Скопируйте файл с готовыми настройками
cp env.local .env
```

### Вариант 2: Настроить самостоятельно
```bash
# Скопируйте пример конфигурации
cp env.example .env

# Отредактируйте .env файл и замените placeholder'ы на реальные значения
```

## 📋 Что нужно настроить

### 1. HH.RU OAuth (обязательно)
1. Зайдите на https://hh.ru/oauth/applications
2. Создайте новое приложение
3. Укажите Redirect URI: `https://hh-finder.ru/api/auth/hh/callback`
4. Скопируйте Client ID и Client Secret в .env файл

### 2. OpenAI API (обязательно)
1. Зайдите на https://platform.openai.com/api-keys
2. Создайте новый API ключ
3. Скопируйте ключ в .env файл

### 3. Email SMTP (обязательно)
1. Настройте SMTP сервер (Gmail, Mail.ru, Yandex и т.д.)
2. Скопируйте настройки в .env файл

### 4. OneSignal Push (опционально)
1. Зайдите на https://onesignal.com
2. Создайте новое приложение
3. Скопируйте App ID в .env файл

### 5. Telegram Bot (опционально)
1. Создайте бота через @BotFather
2. Получите токен бота
3. Скопируйте токен в .env файл

### 6. ЮКасса (опционально)
1. Зайдите на https://yookassa.ru
2. Создайте магазин
3. Получите Shop ID и Secret Key
4. Скопируйте в .env файл

## 🎯 Первые шаги

1. **Запустите приложение** по инструкции выше
2. **Откройте браузер** и перейдите на http://localhost:3000
3. **Нажмите "Войти через HH.RU"** для авторизации
4. **Заполните профиль** и импортируйте резюме
5. **Создайте поиск** вакансий с нужными критериями
6. **Настройте автоматические отклики** с ИИ письмами

## 🔧 Структура проекта

```
hh-auto-post/
├── server.js              # Главный сервер
├── package.json           # Зависимости сервера
├── env.example            # Пример конфигурации
├── env.local              # Готовые настройки для разработки
├── setup.sh              # Скрипт установки
├── models/               # Модели MongoDB
├── routes/               # API маршруты
├── config/               # Конфигурация
└── client/               # React приложение
    ├── package.json
    ├── src/
    └── public/
```

## 🚨 Возможные проблемы

### MongoDB не запускается
```bash
# Создайте директорию для данных
mkdir -p data/db

# Запустите MongoDB
mongod --dbpath ./data/db
```

### Порт 3000 занят
```bash
# Измените порт в .env файле
PORT=3001
```

### Ошибки зависимостей
```bash
# Очистите кэш и переустановите
rm -rf node_modules package-lock.json
npm install

# Для клиента
cd client
rm -rf node_modules package-lock.json
npm install
```

### GitHub блокирует push из-за секретов
```bash
# Убедитесь, что файлы с секретами в .gitignore
# Используйте только env.example для коммитов
# Реальные ключи храните в .env или env.local
```

## 📞 Поддержка

- **Email**: support@hh-finder.ru
- **Telegram**: @hh_finder_support
- **Документация**: README.md

---

**Удачного поиска работы! 🎯✨**