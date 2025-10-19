const express = require('express');
const passport = require('passport');
const router = express.Router();

// Инициализация Passport
require('../config/passport');

// Маршрут для начала авторизации через HH.RU
router.get('/hh', passport.authenticate('hh', {
  scope: ['read:user', 'read:resumes', 'write:applications']
}));

// Callback для HH.RU OAuth
router.get('/hh/callback', 
  passport.authenticate('hh', { 
    failureRedirect: process.env.NODE_ENV === 'production' ? 'https://myunion.pro/login?error=auth_failed' : 'http://localhost:3002/login?error=auth_failed',
    successRedirect: process.env.NODE_ENV === 'production' ? 'https://myunion.pro/dashboard' : 'http://localhost:3002/dashboard'
  })
);

// Получение информации о текущем пользователе
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatar: req.user.avatar,
        subscription: req.user.subscription,
        settings: req.user.settings,
        isAdmin: req.user.isAdmin
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Выход из системы
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Session destruction failed'
        });
      }
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// Проверка статуса авторизации
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      subscription: req.user.subscription
    } : null
  });
});

// Тестовая авторизация для разработки
router.post('/test-login', async (req, res) => {
  try {
    const User = require('../models/User');
    const axios = require('axios');
    
    // Получаем токен HH.RU для тестового пользователя
    let hhToken = null;
    try {
      // Используем ваши учетные данные для получения токена
      const tokenResponse = await axios.post('https://hh.ru/oauth/token', {
        grant_type: 'password',
        username: 'i@usmanoff.com',
        password: '123321ZxQ@',
        client_id: process.env.HH_CLIENT_ID,
        client_secret: process.env.HH_CLIENT_SECRET
      });
      
      hhToken = tokenResponse.data.access_token;
    } catch (tokenError) {
      console.log('Не удалось получить токен HH.RU, используем моковый');
    }
    
    // Создаем или находим тестового пользователя
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      user = new User({
        email: 'test@example.com',
        firstName: 'Тест',
        lastName: 'Пользователь',
        accessToken: hhToken,
        subscription: {
          plan: 'basic',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
          responsesLimit: 1000,
          responsesUsed: 0,
          isActive: true
        }
      });
      await user.save();
    } else if (hhToken) {
      // Обновляем токен если получили новый
      user.accessToken = hhToken;
      await user.save();
    }

    // Авторизуем пользователя
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Login failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Test login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscription: user.subscription
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test login failed',
      error: error.message
    });
  }
});

module.exports = router;
