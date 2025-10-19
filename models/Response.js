const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Search',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  // Информация о вакансии
  vacancy: {
    hhId: {
      type: String,
      required: true
    },
    title: String,
    company: {
      name: String,
      hhId: String,
      url: String,
      logo: String
    },
    area: {
      name: String,
      id: String
    },
    salary: {
      from: Number,
      to: Number,
      currency: String,
      gross: Boolean
    },
    experience: String,
    schedule: String,
    employment: String,
    description: String,
    requirements: String,
    responsibilities: String,
    url: String,
    publishedAt: Date
  },
  
  // Содержимое отклика
  coverLetter: {
    text: String,
    template: String,
    aiGenerated: {
      type: Boolean,
      default: false
    }
  },
  
  // Статус отклика
  status: {
    type: String,
    enum: ['pending', 'sent', 'viewed', 'invited', 'rejected', 'expired', 'error'],
    default: 'pending'
  },
  
  // Временные метки
  sentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
  
  // Результат
  result: {
    type: String,
    enum: ['invitation', 'rejection', 'no_response', 'expired']
  },
  
  // Ошибки
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  
  // Метаданные
  metadata: {
    userAgent: String,
    ipAddress: String,
    retryCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Индексы
responseSchema.index({ userId: 1, createdAt: -1 });
responseSchema.index({ searchId: 1 });
responseSchema.index({ 'vacancy.hhId': 1 });
responseSchema.index({ status: 1 });
responseSchema.index({ sentAt: -1 });

module.exports = mongoose.model('Response', responseSchema);