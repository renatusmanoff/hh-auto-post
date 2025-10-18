const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vacancyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vacancy',
    required: true
  },
  hhVacancyId: {
    type: String,
    required: true
  },
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Search'
  },
  coverLetter: {
    type: String,
    required: true
  },
  coverLetterType: {
    type: String,
    enum: ['ai_generated', 'custom', 'template'],
    default: 'ai_generated'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'rejected'],
    default: 'pending'
  },
  hhResponseId: String, // ID ответа в HH.RU
  errorMessage: String,
  sentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
responseSchema.index({ userId: 1 });
responseSchema.index({ vacancyId: 1 });
responseSchema.index({ hhVacancyId: 1 });
responseSchema.index({ status: 1 });
responseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Response', responseSchema);
