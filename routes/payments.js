const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Тарифные планы
const PLANS = {
  basic: {
    name: 'Базовый',
    price: 700,
    currency: 'RUB',
    period: 'month',
    features: [
      'Неограниченные отклики',
      'Автоматический поиск вакансий',
      'Генерация сопроводительных писем ИИ',
      'Уведомления в Telegram и Email',
      'Сохранение поисков'
    ],
    responsesLimit: 1000
  },
  premium: {
    name: 'Премиум',
    price: 1990,
    currency: 'RUB',
    period: 'month',
    features: [
      'Все возможности Базового плана',
      'Аналитика и рекомендации от ИИ HR',
      'Приоритетная поддержка',
      'Расширенная аналитика откликов',
      'Персональные рекомендации по карьере'
    ],
    responsesLimit: 10000
  }
};

// Получение доступных тарифных планов
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PLANS
  });
});

// Создание платежа
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }
    
    const planData = PLANS[plan];
    
    // Проверяем, нет ли активной подписки
    if (req.user.subscription.isActive && req.user.subscription.endDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }
    
    // Создаем платеж
    const payment = new Payment({
      userId: req.user._id,
      plan,
      amount: planData.price,
      currency: planData.currency,
      description: `Подписка ${planData.name} на месяц`,
      period: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
      }
    });
    
    await payment.save();
    
    // Здесь будет интеграция с ЮКасса
    // Пока возвращаем мок-данные
    const mockPaymentData = {
      id: payment._id,
      status: 'pending',
      amount: {
        value: planData.price.toFixed(2),
        currency: planData.currency
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`
      },
      description: payment.description,
      metadata: {
        userId: req.user._id.toString(),
        plan: plan
      }
    };
    
    res.json({
      success: true,
      payment: mockPaymentData,
      message: 'Payment created successfully'
    });
    
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
});

// Обработка уведомлений от ЮКасса
router.post('/webhook', async (req, res) => {
  try {
    const { event, object } = req.body;
    
    if (event === 'payment.succeeded') {
      const payment = await Payment.findOne({ yookassaPaymentId: object.id });
      
      if (payment) {
        // Обновляем статус платежа
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();
        
        // Обновляем подписку пользователя
        const user = await User.findById(payment.userId);
        if (user) {
          user.subscription.plan = payment.plan;
          user.subscription.startDate = payment.period.startDate;
          user.subscription.endDate = payment.period.endDate;
          user.subscription.isActive = true;
          user.subscription.responsesLimit = PLANS[payment.plan].responsesLimit;
          user.subscription.responsesUsed = 0; // Сбрасываем счетчик
          
          await user.save();
          
          // Отправляем уведомление пользователю
          // TODO: Implement notification sending
        }
      }
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

// Получение истории платежей пользователя
router.get('/history', requireAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
});

// Получение информации о текущей подписке
router.get('/subscription', requireAuth, (req, res) => {
  res.json({
    success: true,
    subscription: req.user.subscription,
    plan: PLANS[req.user.subscription.plan] || null
  });
});

// Отмена подписки
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    // Проверяем, есть ли активная подписка
    if (!req.user.subscription.isActive || req.user.subscription.endDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }
    
    // Отключаем автопродление (в реальной системе это делается через ЮКасса)
    req.user.subscription.isActive = false;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

// Продление подписки
router.post('/renew', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }
    
    const planData = PLANS[plan];
    
    // Создаем новый платеж
    const payment = new Payment({
      userId: req.user._id,
      plan,
      amount: planData.price,
      currency: planData.currency,
      description: `Продление подписки ${planData.name} на месяц`,
      period: {
        startDate: req.user.subscription.endDate || new Date(),
        endDate: new Date((req.user.subscription.endDate || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    await payment.save();
    
    // Мок-данные для платежа
    const mockPaymentData = {
      id: payment._id,
      status: 'pending',
      amount: {
        value: planData.price.toFixed(2),
        currency: planData.currency
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`
      },
      description: payment.description
    };
    
    res.json({
      success: true,
      payment: mockPaymentData,
      message: 'Renewal payment created successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create renewal payment',
      error: error.message
    });
  }
});

module.exports = router;
