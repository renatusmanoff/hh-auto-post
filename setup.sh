#!/bin/bash

# HH Finder - Setup and Run Script

echo "🚀 HH Finder - Автоматический поиск работы"
echo "=========================================="

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Пожалуйста, установите Node.js 16+ с https://nodejs.org"
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Требуется Node.js версии 16 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) найден"

# Проверяем наличие MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB не найден. Установите MongoDB для работы с базой данных"
    echo "   Ubuntu/Debian: sudo apt install mongodb"
    echo "   macOS: brew install mongodb-community"
    echo "   Windows: https://www.mongodb.com/try/download/community"
fi

# Устанавливаем зависимости для сервера
echo "📦 Установка зависимостей сервера..."
npm install

# Устанавливаем зависимости для клиента
echo "📦 Установка зависимостей клиента..."
cd client
npm install
cd ..

# Создаем .env файл если его нет
if [ ! -f .env ]; then
    echo "📝 Создание файла конфигурации..."
    cp env.example .env
    echo "⚠️  Пожалуйста, отредактируйте файл .env с вашими настройками"
fi

# Проверяем наличие MongoDB
if command -v mongod &> /dev/null; then
    echo "🗄️  Запуск MongoDB..."
    # Запускаем MongoDB в фоне если он не запущен
    if ! pgrep -x "mongod" > /dev/null; then
        mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log
        echo "✅ MongoDB запущен"
    else
        echo "✅ MongoDB уже запущен"
    fi
else
    echo "⚠️  MongoDB не запущен. Запустите MongoDB вручную перед началом работы"
fi

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "Для запуска сервера выполните:"
echo "  npm run dev"
echo ""
echo "Или запустите сервер и клиент отдельно:"
echo "  # Терминал 1 (сервер):"
echo "  npm start"
echo ""
echo "  # Терминал 2 (клиент):"
echo "  cd client && npm start"
echo ""
echo "🌐 Сервис будет доступен по адресу: http://localhost:3000"
echo ""
echo "📚 Документация: README.md"
echo "🔧 Конфигурация: .env"
echo ""
echo "Удачного поиска работы! 🎯"
