const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.emailTransporter = this.createEmailTransporter();
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.onesignalAppId = process.env.ONESIGNAL_APP_ID;
  }

  // Создание транспорта для email
  createEmailTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mail.ru',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Отправка уведомления об отклике
  async sendResponseNotification(user, response) {
    const notifications = [];

    // Email уведомление
    if (user.notifications?.email) {
      try {
        await this.sendEmailNotification(user, 'response_sent', {
          vacancyTitle: response.vacancy.title,
          companyName: response.vacancy.company.name,
          sentAt: response.sentAt
        });
        notifications.push('email');
      } catch (error) {
        console.error('Ошибка отправки email:', error);
      }
    }

    // Telegram уведомление
    if (user.notifications?.telegram && user.telegramChatId) {
      try {
        await this.sendTelegramNotification(user.telegramChatId, 'response_sent', {
          vacancyTitle: response.vacancy.title,
          companyName: response.vacancy.company.name,
          sentAt: response.sentAt
        });
        notifications.push('telegram');
      } catch (error) {
        console.error('Ошибка отправки Telegram:', error);
      }
    }

    // Push уведомление
    if (user.notifications?.push && user.onesignalPlayerId) {
      try {
        await this.sendPushNotification(user.onesignalPlayerId, 'response_sent', {
          vacancyTitle: response.vacancy.title,
          companyName: response.vacancy.company.name
        });
        notifications.push('push');
      } catch (error) {
        console.error('Ошибка отправки push:', error);
      }
    }

    return notifications;
  }

  // Отправка уведомления о приглашении
  async sendInvitationNotification(user, response) {
    const notifications = [];

    // Email уведомление
    if (user.notifications?.email) {
      try {
        await this.sendEmailNotification(user, 'invitation_received', {
          vacancyTitle: response.vacancy.title,
          companyName: response.vacancy.company.name,
          respondedAt: response.respondedAt
        });
        notifications.push('email');
      } catch (error) {
        console.error('Ошибка отправки email:', error);
      }
    }

    // Telegram уведомление
    if (user.notifications?.telegram && user.telegramChatId) {
      try {
        await this.sendTelegramNotification(user.telegramChatId, 'invitation_received', {
          vacancyTitle: response.vacancy.title,
          companyName: response.vacancy.company.name,
          respondedAt: response.respondedAt
        });
        notifications.push('telegram');
      } catch (error) {
        console.error('Ошибка отправки Telegram:', error);
      }
    }

    // Push уведомление
    if (user.notifications?.push && user.onesignalPlayerId) {
      try {
        await this.sendPushNotification(user.onesignalPlayerId, 'invitation_received', {
          vacancyTitle: response.vacancy.title,
          companyName: response.vacancy.company.name
        });
        notifications.push('push');
      } catch (error) {
        console.error('Ошибка отправки push:', error);
      }
    }

    return notifications;
  }

  // Отправка email уведомления
  async sendEmailNotification(user, type, data) {
    const templates = {
      response_sent: {
        subject: 'Отклик отправлен',
        html: `
          <h2>Отклик успешно отправлен!</h2>
          <p>Ваш отклик на вакансию <strong>${data.vacancyTitle}</strong> в компании <strong>${data.companyName}</strong> был отправлен.</p>
          <p>Время отправки: ${new Date(data.sentAt).toLocaleString('ru-RU')}</p>
          <p>Мы уведомим вас о любых изменениях статуса.</p>
        `
      },
      invitation_received: {
        subject: 'Получено приглашение!',
        html: `
          <h2>Поздравляем! Получено приглашение!</h2>
          <p>Компания <strong>${data.companyName}</strong> пригласила вас на собеседование по вакансии <strong>${data.vacancyTitle}</strong>.</p>
          <p>Время получения: ${new Date(data.respondedAt).toLocaleString('ru-RU')}</p>
          <p>Не забудьте подготовиться к собеседованию!</p>
        `
      },
      search_completed: {
        subject: 'Поиск завершен',
        html: `
          <h2>Поиск "${data.searchName}" завершен</h2>
          <p>Ваш автоматический поиск завершил работу.</p>
          <p>Всего отправлено откликов: ${data.responsesSent}</p>
          <p>Получено приглашений: ${data.invitations}</p>
        `
      },
      search_error: {
        subject: 'Ошибка в поиске',
        html: `
          <h2>Ошибка в поиске "${data.searchName}"</h2>
          <p>Произошла ошибка при выполнении автоматического поиска.</p>
          <p>Ошибка: ${data.errorMessage}</p>
          <p>Пожалуйста, проверьте настройки поиска.</p>
        `
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Шаблон уведомления ${type} не найден`);
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: template.subject,
      html: template.html
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  // Отправка Telegram уведомления
  async sendTelegramNotification(chatId, type, data) {
    const templates = {
      response_sent: `✅ Отклик отправлен!\n\n📋 Вакансия: ${data.vacancyTitle}\n🏢 Компания: ${data.companyName}\n⏰ Время: ${new Date(data.sentAt).toLocaleString('ru-RU')}`,
      invitation_received: `🎉 Получено приглашение!\n\n📋 Вакансия: ${data.vacancyTitle}\n🏢 Компания: ${data.companyName}\n⏰ Время: ${new Date(data.respondedAt).toLocaleString('ru-RU')}`,
      search_completed: `✅ Поиск завершен\n\n🔍 Поиск: ${data.searchName}\n📤 Откликов: ${data.responsesSent}\n🎯 Приглашений: ${data.invitations}`,
      search_error: `❌ Ошибка в поиске\n\n🔍 Поиск: ${data.searchName}\n⚠️ Ошибка: ${data.errorMessage}`
    };

    const message = templates[type];
    if (!message) {
      throw new Error(`Шаблон Telegram уведомления ${type} не найден`);
    }

    const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
    
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
  }

  // Отправка push уведомления
  async sendPushNotification(playerId, type, data) {
    const templates = {
      response_sent: {
        title: 'Отклик отправлен',
        message: `Отклик на ${data.vacancyTitle} в ${data.companyName} отправлен`
      },
      invitation_received: {
        title: 'Получено приглашение!',
        message: `${data.companyName} пригласила вас на собеседование`
      },
      search_completed: {
        title: 'Поиск завершен',
        message: `Поиск завершен. Отправлено ${data.responsesSent} откликов`
      },
      search_error: {
        title: 'Ошибка в поиске',
        message: `Ошибка в поиске: ${data.errorMessage}`
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Шаблон push уведомления ${type} не найден`);
    }

    const url = 'https://onesignal.com/api/v1/notifications';
    
    await axios.post(url, {
      app_id: this.onesignalAppId,
      include_player_ids: [playerId],
      headings: { en: template.title },
      contents: { en: template.message },
      data: { type, ...data }
    }, {
      headers: {
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Отправка тестового уведомления
  async sendTestNotification(user, type = 'all') {
    const results = {};

    if (type === 'all' || type === 'email') {
      try {
        await this.sendEmailNotification(user, 'response_sent', {
          vacancyTitle: 'Тестовая вакансия',
          companyName: 'Тестовая компания',
          sentAt: new Date()
        });
        results.email = true;
      } catch (error) {
        results.email = false;
        results.emailError = error.message;
      }
    }

    if (type === 'all' || type === 'telegram') {
      try {
        await this.sendTelegramNotification(user.telegramChatId, 'response_sent', {
          vacancyTitle: 'Тестовая вакансия',
          companyName: 'Тестовая компания',
          sentAt: new Date()
        });
        results.telegram = true;
      } catch (error) {
        results.telegram = false;
        results.telegramError = error.message;
      }
    }

    if (type === 'all' || type === 'push') {
      try {
        await this.sendPushNotification(user.onesignalPlayerId, 'response_sent', {
          vacancyTitle: 'Тестовая вакансия',
          companyName: 'Тестовая компания'
        });
        results.push = true;
      } catch (error) {
        results.push = false;
        results.pushError = error.message;
      }
    }

    return results;
  }

  // Настройка Telegram webhook
  async setupTelegramWebhook() {
    if (!this.telegramBotToken) {
      throw new Error('Telegram bot token не настроен');
    }

    const webhookUrl = `${process.env.BASE_URL}/api/notifications/telegram/webhook`;
    
    const url = `https://api.telegram.org/bot${this.telegramBotToken}/setWebhook`;
    
    await axios.post(url, {
      url: webhookUrl
    });
  }

  // Обработка входящих сообщений Telegram
  async handleTelegramMessage(update) {
    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
      await this.sendTelegramNotification(chatId, 'welcome', {});
    } else if (text === '/help') {
      await this.sendTelegramNotification(chatId, 'help', {});
    } else if (text.startsWith('/subscribe')) {
      // Логика подписки на уведомления
      await this.sendTelegramNotification(chatId, 'subscribed', {});
    }
  }

  // Массовая отправка уведомлений
  async sendBulkNotification(users, type, data) {
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        await this.sendNotification(user, type, data);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user._id,
          error: error.message
        });
      }
    }

    return results;
  }

  // Универсальная отправка уведомления
  async sendNotification(user, type, data) {
    const notifications = [];

    if (user.notifications?.email) {
      try {
        await this.sendEmailNotification(user, type, data);
        notifications.push('email');
      } catch (error) {
        console.error('Ошибка email:', error);
      }
    }

    if (user.notifications?.telegram && user.telegramChatId) {
      try {
        await this.sendTelegramNotification(user.telegramChatId, type, data);
        notifications.push('telegram');
      } catch (error) {
        console.error('Ошибка telegram:', error);
      }
    }

    if (user.notifications?.push && user.onesignalPlayerId) {
      try {
        await this.sendPushNotification(user.onesignalPlayerId, type, data);
        notifications.push('push');
      } catch (error) {
        console.error('Ошибка push:', error);
      }
    }

    return notifications;
  }
}

module.exports = new NotificationService();
