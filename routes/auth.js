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
  passport.authenticate('hh', { failureRedirect: '/login?error=auth_failed' }),
  (req, res) => {
    // Успешная авторизация
    res.redirect('/dashboard');
  }
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

module.exports = router;
