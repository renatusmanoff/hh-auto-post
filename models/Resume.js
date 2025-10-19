const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Основная информация
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  
  // Персональная информация
  personalInfo: {
    firstName: String,
    lastName: String,
    middleName: String,
    birthDate: Date,
    gender: {
      type: String,
      enum: ['male', 'female']
    },
    citizenship: String,
    workPermit: String,
    phone: String,
    email: String,
    site: String,
    skype: String,
    telegram: String
  },
  
  // Опыт работы
  experience: [{
    position: String,
    company: String,
    description: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    achievements: [String],
    skills: [String]
  }],
  
  // Образование
  education: [{
    institution: String,
    faculty: String,
    specialization: String,
    yearOfGraduation: Number,
    degree: String,
    gpa: Number
  }],
  
  // Навыки
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    category: String
  }],
  
  // Дополнительная информация
  languages: [{
    name: String,
    level: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']
    }
  }],
  
  certificates: [{
    name: String,
    issuer: String,
    date: Date,
    url: String
  }],
  
  portfolio: [{
    title: String,
    description: String,
    url: String,
    technologies: [String]
  }],
  
  // Настройки
  isActive: {
    type: Boolean,
    default: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  
  // Статистика
  viewsCount: {
    type: Number,
    default: 0
  },
  responsesCount: {
    type: Number,
    default: 0
  },
  invitationsCount: {
    type: Number,
    default: 0
  },
  
  // ИИ анализ
  aiAnalysis: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendations: [String],
    keywords: [String],
    lastAnalyzed: Date
  },
  
  // Файлы
  files: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Источник
  source: {
    type: String,
    enum: ['uploaded', 'hh_import', 'created'],
    default: 'created'
  },
  hhResumeId: String, // ID резюме на HH.RU
  
  // Метаданные
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы
resumeSchema.index({ userId: 1, isActive: 1 });
resumeSchema.index({ userId: 1, isPrimary: 1 });
resumeSchema.index({ hhResumeId: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
