const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  
  // Основные фильтры
  keywords: {
    type: String,
    required: true
  },
  excludeKeywords: {
    type: String
  },
  
  // Локация
  area: {
    type: String
  },
  areaIds: [{
    type: String
  }],
  
  // Зарплата
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      enum: ['RUR', 'USD', 'EUR'],
      default: 'RUR'
    }
  },
  
  // Опыт работы
  experience: {
    type: String,
    enum: ['noExperience', 'between1And3', 'between3And6', 'moreThan6']
  },
  
  // График работы
  schedule: {
    type: String,
    enum: ['fullDay', 'shift', 'flexible', 'remote', 'flyInFlyOut']
  },
  
  // Тип занятости
  employment: {
    type: String,
    enum: ['full', 'part', 'project', 'volunteer', 'probation']
  },
  
  // Дополнительные фильтры
  specialization: [{
    type: String
  }],
  industry: [{
    type: String
  }],
  companySize: {
    type: String,
    enum: ['small', 'medium', 'large', 'very_large']
  },
  companyType: {
    type: String,
    enum: ['company', 'startup', 'ngo', 'government']
  },
  
  // Настройки откликов
  coverLetter: {
    type: String,
    default: ''
  },
  coverLetterTemplate: {
    type: String,
    enum: ['default', 'custom', 'ai_generated'],
    default: 'default'
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  // Лимиты и ограничения
  dailyLimit: {
    type: Number,
    default: 50
  },
  totalLimit: {
    type: Number,
    default: 200
  },
  
  // Статус и статистика
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'error'],
    default: 'active'
  },
  responsesCount: {
    type: Number,
    default: 0
  },
  invitationsCount: {
    type: Number,
    default: 0
  },
  rejectionsCount: {
    type: Number,
    default: 0
  },
  
  // Время работы
  lastRun: {
    type: Date
  },
  nextRun: {
    type: Date
  },
  runInterval: {
    type: Number, // в минутах
    default: 60
  },
  
  // Ошибки
  lastError: {
    message: String,
    timestamp: Date
  },
  errorCount: {
    type: Number,
    default: 0
  },
  
  // Настройки уведомлений
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    telegram: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Индексы для оптимизации
searchSchema.index({ userId: 1, status: 1 });
searchSchema.index({ nextRun: 1 });
searchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Search', searchSchema);