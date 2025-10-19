const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const PaymentService = require('../services/paymentService');

// Получение тарифных планов
router.get('/plans', async (req, res) => {
  try {
    const plans = PaymentService.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Ошибка получения планов:', error);
    res.status(500).json({ message: 'Ошибка получения планов', error: error.message });
  }
});

// Расчет стоимости
router.post('/calculate', async (req, res) => {
  try {
    const { plan, period, promoCode } = req.body;
    
    const calculation = PaymentService.calculatePrice(plan, period, promoCode);
    res.json(calculation);
  } catch (error) {
    console.error('Ошибка расчета стоимости:', error);
    res.status(500).json({ message: 'Ошибка расчета стоимости', error: error.message });
  }
});

// Создание платежа
router.post('/create', async (req, res) => {
  try {
    const { plan, period, promoCode } = req.body;
    
    // Проверяем, что пользователь не имеет активной подписки
    if (PaymentService.isSubscriptionActive(req.user)) {
      return res.status(400).json({ 
        message: 'У вас уже есть активная подписка' 
      });
    }

    // Рассчитываем стоимость
    const calculation = PaymentService.calculatePrice(plan, period, promoCode);
    
    if (calculation.finalPrice === 0) {
      // Бесплатная подписка
      await PaymentService.updateUserSubscription(req.user, plan, period);
      
      const payment = new Payment({
        userId: req.user._id,
        amount: 0,
        plan,
        planName: PaymentService.getSubscriptionPlans()[plan].name,
        period,
        status: 'completed',
        paymentMethod: 'free',
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа для бесплатного
        metadata: {
          promoCode,
          discount: calculation.discount
        }
      });

      await payment.save();

      return res.json({
        success: true,
        message: 'Бесплатная подписка активирована',
        payment: payment
      });
    }

    // Создаем платеж в ЮKassa
    const paymentResult = await PaymentService.createPayment({
      amount: calculation.finalPrice,
      currency: calculation.currency,
      plan,
      period,
      userId: req.user._id,
      metadata: {
        promoCode,
        discount: calculation.discount,
        originalPrice: calculation.originalPrice
      }
    });

    if (!paymentResult.success) {
      return res.status(400).json({ 
        message: 'Ошибка создания платежа', 
        error: paymentResult.error 
      });
    }

    // Сохраняем платеж в базу данных
    const payment = new Payment({
      userId: req.user._id,
      amount: calculation.finalPrice,
      plan,
      planName: PaymentService.getSubscriptionPlans()[plan].name,
      period,
      status: 'pending',
      paymentMethod: 'yookassa',
      paymentId: paymentResult.paymentId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 минут на оплату
      metadata: {
        promoCode,
        discount: calculation.discount,
        originalPrice: calculation.originalPrice,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await payment.save();

    res.json({
      success: true,
      paymentId: payment._id,
      yookassaPaymentId: paymentResult.paymentId,
      confirmationUrl: paymentResult.confirmationUrl,
      amount: calculation.finalPrice,
      currency: calculation.currency
    });
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({ message: 'Ошибка создания платежа', error: error.message });
  }
});

// Подтверждение платежа (webhook от ЮKassa)
router.post('/webhook', async (req, res) => {
  try {
    const { event, object } = req.body;
    
    if (event === 'payment.succeeded') {
      const payment = await Payment.findOne({ 
        paymentId: object.id 
      });

      if (!payment) {
        return res.status(404).json({ message: 'Платеж не найден' });
      }

      if (payment.status === 'completed') {
        return res.json({ message: 'Платеж уже обработан' });
      }

      // Обновляем статус платежа
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.paymentData = object;
      await payment.save();

      // Обновляем подписку пользователя
      await PaymentService.updateUserSubscription(
        payment.userId, 
        payment.plan, 
        payment.period
      );

      res.json({ message: 'Платеж успешно обработан' });
    } else if (event === 'payment.canceled') {
      const payment = await Payment.findOne({ 
        paymentId: object.id 
      });

      if (payment) {
        payment.status = 'cancelled';
        payment.errorMessage = 'Платеж отменен пользователем';
        await payment.save();
      }

      res.json({ message: 'Платеж отменен' });
    } else {
      res.json({ message: 'Событие не обработано' });
    }
  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ message: 'Ошибка обработки webhook', error: error.message });
  }
});

// Получение статуса платежа
router.get('/:paymentId/status', async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      _id: req.params.paymentId,
      userId: req.user._id 
    });

    if (!payment) {
      return res.status(404).json({ message: 'Платеж не найден' });
    }

    // Если платеж еще в процессе, проверяем статус в ЮKassa
    if (payment.status === 'pending' && payment.paymentId) {
      const statusResult = await PaymentService.getPaymentStatus(payment.paymentId);
      
      if (statusResult.success && statusResult.paid) {
        payment.status = 'completed';
        payment.paidAt = new Date();
        await payment.save();

        // Обновляем подписку
        await PaymentService.updateUserSubscription(
          payment.userId, 
          payment.plan, 
          payment.period
        );
      }
    }

    res.json({
      status: payment.status,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      amount: payment.amount,
      plan: payment.plan
    });
  } catch (error) {
    console.error('Ошибка получения статуса платежа:', error);
    res.status(500).json({ message: 'Ошибка получения статуса платежа', error: error.message });
  }
});

// Получение истории платежей
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ userId: req.user._id });

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения истории платежей:', error);
    res.status(500).json({ message: 'Ошибка получения истории платежей', error: error.message });
  }
});

// Проверка лимитов пользователя
router.get('/limits', async (req, res) => {
  try {
    const limits = {};
    const actions = ['daily_responses', 'active_searches', 'resumes', 'ai_generations'];

    for (const action of actions) {
      limits[action] = await PaymentService.checkUserLimits(req.user, action);
    }

    res.json(limits);
  } catch (error) {
    console.error('Ошибка проверки лимитов:', error);
    res.status(500).json({ message: 'Ошибка проверки лимитов', error: error.message });
  }
});

// Получение информации о подписке
router.get('/subscription', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const plans = PaymentService.getSubscriptionPlans();
    const currentPlan = plans[user.subscription?.plan || 'free'];
    
    const subscriptionInfo = {
      plan: user.subscription?.plan || 'free',
      planName: currentPlan.name,
      isActive: PaymentService.isSubscriptionActive(user),
      startDate: user.subscription?.startDate,
      endDate: user.subscription?.endDate,
      daysUntilExpiry: PaymentService.getDaysUntilExpiry(user),
      limits: currentPlan.limits,
      features: currentPlan.features
    };

    res.json(subscriptionInfo);
  } catch (error) {
    console.error('Ошибка получения информации о подписке:', error);
    res.status(500).json({ message: 'Ошибка получения информации о подписке', error: error.message });
  }
});

// Возврат платежа
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const payment = await Payment.findOne({ 
      _id: req.params.paymentId,
      userId: req.user._id,
      status: 'completed'
    });

    if (!payment) {
      return res.status(404).json({ message: 'Платеж не найден или не завершен' });
    }

    // Проверяем, что прошло не более 30 дней
    const daysSincePayment = Math.floor((Date.now() - payment.paidAt) / (1000 * 60 * 60 * 24));
    if (daysSincePayment > 30) {
      return res.status(400).json({ 
        message: 'Возврат возможен только в течение 30 дней после оплаты' 
      });
    }

    // Создаем возврат в ЮKassa
    const refundResult = await PaymentService.refundPayment(
      payment.paymentId,
      payment.amount,
      reason
    );

    if (!refundResult.success) {
      return res.status(400).json({ 
        message: 'Ошибка создания возврата', 
        error: refundResult.error 
      });
    }

    // Обновляем статус платежа
    payment.status = 'refunded';
    payment.refundAmount = payment.amount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    // Отменяем подписку пользователя
    const user = await User.findById(req.user._id);
    user.subscription.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Возврат создан',
      refundId: refundResult.refundId
    });
  } catch (error) {
    console.error('Ошибка создания возврата:', error);
    res.status(500).json({ message: 'Ошибка создания возврата', error: error.message });
  }
});

module.exports = router;