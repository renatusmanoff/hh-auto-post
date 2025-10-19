const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Информация о платеже
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'RUB'
  },
  
  // Тарифный план
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  
  // Период подписки
  period: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  
  // Статус платежа
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Информация о платежной системе
  paymentMethod: {
    type: String,
    enum: ['yookassa', 'stripe', 'paypal'],
    required: true
  },
  paymentId: String, // ID платежа в платежной системе
  transactionId: String, // ID транзакции
  
  // Данные от платежной системы
  paymentData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Даты
  paidAt: Date,
  expiresAt: Date,
  
  // Ошибки
  errorMessage: String,
  errorCode: String,
  
  // Возврат
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  
  // Метаданные
  metadata: {
    userAgent: String,
    ipAddress: String,
    promoCode: String,
    discount: Number
  }
}, {
  timestamps: true
});

// Индексы
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);