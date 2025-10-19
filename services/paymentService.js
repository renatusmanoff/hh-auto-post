const axios = require('axios');

class PaymentService {
  constructor() {
    this.yookassaShopId = process.env.YOOKASSA_SHOP_ID;
    this.yookassaSecretKey = process.env.YOOKASSA_SECRET_KEY;
    this.baseUrl = 'https://api.yookassa.ru/v3';
  }

  // Создание платежа в ЮKassa
  async createPayment(paymentData) {
    try {
      const { amount, currency, plan, period, userId, metadata } = paymentData;
      
      const paymentRequest = {
        amount: {
          value: amount.toFixed(2),
          currency: currency || 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.FRONTEND_URL}/billing/success`
        },
        description: `Подписка ${plan} на ${period === 'monthly' ? 'месяц' : 'год'}`,
        metadata: {
          userId: userId.toString(),
          plan,
          period,
          ...metadata
        }
      };

      const response = await axios.post(`${this.baseUrl}/payments`, paymentRequest, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.yookassaShopId}:${this.yookassaSecretKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Idempotence-Key': `${userId}-${Date.now()}`
        }
      });

      return {
        success: true,
        paymentId: response.data.id,
        confirmationUrl: response.data.confirmation?.confirmation_url,
        status: response.data.status
      };
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      return {
        success: false,
        error: error.response?.data?.description || error.message
      };
    }
  }

  // Получение статуса платежа
  async getPaymentStatus(paymentId) {
    try {
      const response = await axios.get(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.yookassaShopId}:${this.yookassaSecretKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        status: response.data.status,
        paid: response.data.paid,
        amount: response.data.amount,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Ошибка получения статуса платежа:', error);
      return {
        success: false,
        error: error.response?.data?.description || error.message
      };
    }
  }

  // Возврат платежа
  async refundPayment(paymentId, amount, reason = '') {
    try {
      const refundRequest = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        payment_id: paymentId,
        description: reason || 'Возврат платежа'
      };

      const response = await axios.post(`${this.baseUrl}/refunds`, refundRequest, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.yookassaShopId}:${this.yookassaSecretKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Idempotence-Key': `refund-${paymentId}-${Date.now()}`
        }
      });

      return {
        success: true,
        refundId: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      console.error('Ошибка возврата платежа:', error);
      return {
        success: false,
        error: error.response?.data?.description || error.message
      };
    }
  }

  // Получение тарифных планов
  getSubscriptionPlans() {
    return {
      free: {
        name: 'Бесплатный',
        price: 0,
        currency: 'RUB',
        period: 'forever',
        features: [
          '50 откликов в день',
          '1 активный поиск',
          'Базовые фильтры',
          'Email уведомления',
          'Поддержка 24/7'
        ],
        limits: {
          dailyResponses: 50,
          activeSearches: 1,
          resumes: 1,
          aiGenerations: 5
        }
      },
      basic: {
        name: 'Базовый',
        price: 700,
        currency: 'RUB',
        period: 'monthly',
        yearlyPrice: 7000,
        features: [
          '200 откликов в день',
          '5 активных поисков',
          'Все фильтры поиска',
          'ИИ-генерация писем',
          'Улучшение резюме с ИИ',
          'Push уведомления',
          'Telegram уведомления',
          'Приоритетная поддержка'
        ],
        limits: {
          dailyResponses: 200,
          activeSearches: 5,
          resumes: 5,
          aiGenerations: 100
        }
      },
      premium: {
        name: 'Премиум',
        price: 1990,
        currency: 'RUB',
        period: 'monthly',
        yearlyPrice: 19900,
        features: [
          'Безлимитные отклики',
          'Безлимитные поиски',
          'Все фильтры поиска',
          'ИИ-генерация писем',
          'Улучшение резюме с ИИ',
          'ATS-оптимизация',
          'Аналитика эффективности',
          'Персональный менеджер',
          'Все виды уведомлений',
          'API доступ'
        ],
        limits: {
          dailyResponses: -1, // безлимит
          activeSearches: -1, // безлимит
          resumes: -1, // безлимит
          aiGenerations: -1 // безлимит
        }
      }
    };
  }

  // Расчет стоимости с учетом скидок
  calculatePrice(plan, period, promoCode = null) {
    const plans = this.getSubscriptionPlans();
    const planData = plans[plan];
    
    if (!planData) {
      throw new Error('Неизвестный тарифный план');
    }

    let price = period === 'yearly' ? planData.yearlyPrice : planData.price;
    let discount = 0;
    let discountReason = '';

    // Применяем промокод
    if (promoCode) {
      const promoDiscount = this.validatePromoCode(promoCode);
      if (promoDiscount) {
        discount = Math.round(price * promoDiscount.percent / 100);
        discountReason = promoDiscount.reason;
      }
    }

    // Скидка за годовую подписку
    if (period === 'yearly' && plan !== 'free') {
      const monthlyPrice = planData.price * 12;
      const yearlyDiscount = monthlyPrice - planData.yearlyPrice;
      if (yearlyDiscount > discount) {
        discount = yearlyDiscount;
        discountReason = 'Скидка за годовую подписку';
      }
    }

    return {
      originalPrice: price,
      discount,
      finalPrice: Math.max(0, price - discount),
      discountReason,
      currency: planData.currency
    };
  }

  // Валидация промокода
  validatePromoCode(code) {
    const promoCodes = {
      'WELCOME10': { percent: 10, reason: 'Скидка для новых пользователей' },
      'YEARLY20': { percent: 20, reason: 'Скидка за годовую подписку' },
      'STUDENT15': { percent: 15, reason: 'Скидка для студентов' },
      'FIRST50': { percent: 50, reason: 'Первая подписка' }
    };

    return promoCodes[code.toUpperCase()] || null;
  }

  // Проверка лимитов пользователя
  async checkUserLimits(user, action) {
    const subscription = user.subscription;
    const plan = this.getSubscriptionPlans()[subscription.plan];
    
    if (!plan) {
      return { allowed: false, reason: 'Неизвестный тарифный план' };
    }

    const limits = plan.limits;

    switch (action) {
      case 'daily_responses':
        if (limits.dailyResponses === -1) return { allowed: true };
        const todayResponses = await this.getTodayResponsesCount(user._id);
        return {
          allowed: todayResponses < limits.dailyResponses,
          used: todayResponses,
          limit: limits.dailyResponses
        };

      case 'active_searches':
        if (limits.activeSearches === -1) return { allowed: true };
        const activeSearches = await this.getActiveSearchesCount(user._id);
        return {
          allowed: activeSearches < limits.activeSearches,
          used: activeSearches,
          limit: limits.activeSearches
        };

      case 'resumes':
        if (limits.resumes === -1) return { allowed: true };
        const resumesCount = await this.getResumesCount(user._id);
        return {
          allowed: resumesCount < limits.resumes,
          used: resumesCount,
          limit: limits.resumes
        };

      case 'ai_generations':
        if (limits.aiGenerations === -1) return { allowed: true };
        const aiGenerations = await this.getAIGenerationsCount(user._id);
        return {
          allowed: aiGenerations < limits.aiGenerations,
          used: aiGenerations,
          limit: limits.aiGenerations
        };

      default:
        return { allowed: false, reason: 'Неизвестное действие' };
    }
  }

  // Получение количества откликов за сегодня
  async getTodayResponsesCount(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const Response = require('../models/Response');
    return await Response.countDocuments({
      userId,
      sentAt: { $gte: today }
    });
  }

  // Получение количества активных поисков
  async getActiveSearchesCount(userId) {
    const Search = require('../models/Search');
    return await Search.countDocuments({
      userId,
      status: 'active'
    });
  }

  // Получение количества резюме
  async getResumesCount(userId) {
    const Resume = require('../models/Resume');
    return await Resume.countDocuments({
      userId,
      isActive: true
    });
  }

  // Получение количества ИИ-генераций
  async getAIGenerationsCount(userId) {
    // Здесь можно добавить логику подсчета ИИ-генераций
    // Пока возвращаем 0
    return 0;
  }

  // Обновление подписки пользователя
  async updateUserSubscription(user, plan, period) {
    const plans = this.getSubscriptionPlans();
    const planData = plans[plan];
    
    if (!planData) {
      throw new Error('Неизвестный тарифный план');
    }

    const startDate = new Date();
    let endDate;

    if (plan === 'free') {
      endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    } else if (period === 'monthly') {
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
    } else {
      endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 дней
    }

    user.subscription = {
      plan,
      startDate,
      endDate,
      isActive: true,
      responsesLimit: planData.limits.dailyResponses,
      responsesUsed: 0
    };

    await user.save();
    return user;
  }

  // Проверка активности подписки
  isSubscriptionActive(user) {
    if (!user.subscription) return false;
    if (!user.subscription.isActive) return false;
    return new Date() < new Date(user.subscription.endDate);
  }

  // Получение дней до окончания подписки
  getDaysUntilExpiry(user) {
    if (!user.subscription || !user.subscription.isActive) return 0;
    
    const now = new Date();
    const endDate = new Date(user.subscription.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
}

module.exports = new PaymentService();
