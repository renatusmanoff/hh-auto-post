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
  filters: {
    text: String,
    area: [String], // city IDs
    specialization: [String], // specialization IDs
    experience: String,
    employment: [String],
    schedule: [String],
    salary: {
      from: Number,
      to: Number,
      currency: String
    },
    orderBy: {
      type: String,
      default: 'relevance'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: Date,
  totalFound: {
    type: Number,
    default: 0
  },
  responsesSent: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
searchSchema.index({ userId: 1 });
searchSchema.index({ isActive: 1 });

module.exports = mongoose.model('Search', searchSchema);
