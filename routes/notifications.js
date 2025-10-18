const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
const User = require('../models/User');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Настройка SMTP для отправки email
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Отправка email уведомления
const sendEmailNotification = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: html
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Отправка Telegram уведомления
const sendTelegramNotification = async (chatId, message) => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) {
      return false;
    }
    
    const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Telegram sending error:', error);
    return false;
  }
};

// Отправка Push уведомления через OneSignal
const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    if (!process.env.ONESIGNAL_APP_ID) {
      return false;
    }
    
    const notification = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: [userId.toString()],
      headings: { en: title },
      contents: { en: message },
      data: data
    };
    
    const response = await axios.post('https://onesignal.com/api/v1/notifications', notification, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY || ''}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
};

// Отправка уведомления о новом отклике
router.post('/response-sent', requireAuth, async (req, res) => {
  try {
    const { vacancyTitle, companyName, responseId } = req.body;
    
    const user = req.user;
    const notificationData = {
      type: 'response_sent',
      responseId,
      vacancyTitle,
      companyName
    };
    
    const results = {
      email: false,
      telegram: false,
      push: false
    };
    
    // Email уведомление
    if (user.settings.notifications.email) {
      const emailHtml = `
        <h2>Отклик отправлен успешно!</h2>
        <p>Ваш отклик на вакансию <strong>"${vacancyTitle}"</strong> в компании <strong>"${companyName}"</strong> был успешно отправлен.</p>
        <p>Вы можете отслеживать статус отклика в личном кабинете.</p>
        <hr>
        <p><small>HH Finder - автоматический поиск работы</small></p>
      `;
      
      results.email = await sendEmailNotification(
        user.email,
        'Отклик отправлен успешно',
        emailHtml
      );
    }
    
    // Telegram уведомление
    if (user.settings.notifications.telegram && user.settings.telegramChatId) {
      const telegramMessage = `
🎯 <b>Отклик отправлен!</b>

📋 Вакансия: ${vacancyTitle}
🏢 Компания: ${companyName}
✅ Статус: Отправлен

Отслеживайте статус в личном кабинете.
      `;
      
      results.telegram = await sendTelegramNotification(
        user.settings.telegramChatId,
        telegramMessage
      );
    }
    
    // Push уведомление
    if (user.settings.notifications.push) {
      results.push = await sendPushNotification(
        user._id,
        'Отклик отправлен!',
        `Ваш отклик на "${vacancyTitle}" в "${companyName}" отправлен`,
        notificationData
      );
    }
    
    res.json({
      success: true,
      message: 'Notifications sent',
      results
    });
    
  } catch (error) {
    console.error('Notification sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
});

// Отправка уведомления о лимите откликов
router.post('/limit-warning', requireAuth, async (req, res) => {
  try {
    const { remainingResponses } = req.body;
    
    const user = req.user;
    const results = {
      email: false,
      telegram: false,
      push: false
    };
    
    // Email уведомление
    if (user.settings.notifications.email) {
      const emailHtml = `
        <h2>Внимание! Лимит откликов почти исчерпан</h2>
        <p>У вас осталось <strong>${remainingResponses}</strong> откликов в текущем периоде.</p>
        <p>Рассмотрите возможность продления подписки для продолжения использования сервиса.</p>
        <hr>
        <p><small>HH Finder - автоматический поиск работы</small></p>
      `;
      
      results.email = await sendEmailNotification(
        user.email,
        'Лимит откликов почти исчерпан',
        emailHtml
      );
    }
    
    // Telegram уведомление
    if (user.settings.notifications.telegram && user.settings.telegramChatId) {
      const telegramMessage = `
⚠️ <b>Лимит откликов почти исчерпан!</b>

📊 Осталось откликов: ${remainingResponses}
💳 Рассмотрите продление подписки

Продолжайте поиск работы с HH Finder!
      `;
      
      results.telegram = await sendTelegramNotification(
        user.settings.telegramChatId,
        telegramMessage
      );
    }
    
    // Push уведомление
    if (user.settings.notifications.push) {
      results.push = await sendPushNotification(
        user._id,
        'Лимит откликов почти исчерпан',
        `Осталось ${remainingResponses} откликов. Рассмотрите продление подписки.`,
        { type: 'limit_warning', remainingResponses }
      );
    }
    
    res.json({
      success: true,
      message: 'Limit warning notifications sent',
      results
    });
    
  } catch (error) {
    console.error('Limit warning notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send limit warning notifications',
      error: error.message
    });
  }
});

// Отправка уведомления о новых вакансиях
router.post('/new-vacancies', requireAuth, async (req, res) => {
  try {
    const { searchName, vacanciesCount, vacancies } = req.body;
    
    const user = req.user;
    const results = {
      email: false,
      telegram: false,
      push: false
    };
    
    // Email уведомление
    if (user.settings.notifications.email) {
      const vacanciesList = vacancies.slice(0, 5).map(v => 
        `<li><strong>${v.title}</strong> - ${v.company.name}</li>`
      ).join('');
      
      const emailHtml = `
        <h2>Найдены новые вакансии!</h2>
        <p>По поиску <strong>"${searchName}"</strong> найдено <strong>${vacanciesCount}</strong> новых вакансий.</p>
        <h3>Последние вакансии:</h3>
        <ul>${vacanciesList}</ul>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">Перейти к поиску</a></p>
        <hr>
        <p><small>HH Finder - автоматический поиск работы</small></p>
      `;
      
      results.email = await sendEmailNotification(
        user.email,
        `Найдено ${vacanciesCount} новых вакансий`,
        emailHtml
      );
    }
    
    // Telegram уведомление
    if (user.settings.notifications.telegram && user.settings.telegramChatId) {
      const telegramMessage = `
🔍 <b>Найдены новые вакансии!</b>

📋 Поиск: ${searchName}
📊 Найдено: ${vacanciesCount} вакансий

${vacancies.slice(0, 3).map(v => `• ${v.title} - ${v.company.name}`).join('\n')}

Переходите в личный кабинет для просмотра!
      `;
      
      results.telegram = await sendTelegramNotification(
        user.settings.telegramChatId,
        telegramMessage
      );
    }
    
    // Push уведомление
    if (user.settings.notifications.push) {
      results.push = await sendPushNotification(
        user._id,
        'Найдены новые вакансии!',
        `Поиск "${searchName}": найдено ${vacanciesCount} вакансий`,
        { type: 'new_vacancies', searchName, vacanciesCount }
      );
    }
    
    res.json({
      success: true,
      message: 'New vacancies notifications sent',
      results
    });
    
  } catch (error) {
    console.error('New vacancies notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send new vacancies notifications',
      error: error.message
    });
  }
});

// Тестовая отправка уведомлений
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { type } = req.body;
    
    const user = req.user;
    const results = {
      email: false,
      telegram: false,
      push: false
    };
    
    const testMessage = 'Это тестовое уведомление от HH Finder';
    
    // Email тест
    if (type === 'email' || type === 'all') {
      const emailHtml = `
        <h2>Тестовое уведомление</h2>
        <p>${testMessage}</p>
        <p>Если вы получили это письмо, значит настройки email уведомлений работают корректно.</p>
        <hr>
        <p><small>HH Finder - автоматический поиск работы</small></p>
      `;
      
      results.email = await sendEmailNotification(
        user.email,
        'Тестовое уведомление HH Finder',
        emailHtml
      );
    }
    
    // Telegram тест
    if ((type === 'telegram' || type === 'all') && user.settings.telegramChatId) {
      const telegramMessage = `
🧪 <b>Тестовое уведомление</b>

${testMessage}

Если вы получили это сообщение, значит настройки Telegram уведомлений работают корректно.
      `;
      
      results.telegram = await sendTelegramNotification(
        user.settings.telegramChatId,
        telegramMessage
      );
    }
    
    // Push тест
    if (type === 'push' || type === 'all') {
      results.push = await sendPushNotification(
        user._id,
        'Тестовое уведомление',
        testMessage,
        { type: 'test' }
      );
    }
    
    res.json({
      success: true,
      message: 'Test notifications sent',
      results
    });
    
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notifications',
      error: error.message
    });
  }
});

// Получение статуса уведомлений пользователя
router.get('/status', requireAuth, (req, res) => {
  res.json({
    success: true,
    notifications: req.user.settings.notifications,
    telegramChatId: req.user.settings.telegramChatId
  });
});

module.exports = router;
