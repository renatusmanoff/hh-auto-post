const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
  hhId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    name: String,
    id: String,
    logo: String,
    url: String
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
  conditions: String,
  skills: [String],
  location: {
    city: String,
    address: String,
    metro: [String]
  },
  publishedAt: Date,
  url: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
vacancySchema.index({ hhId: 1 });
vacancySchema.index({ title: 'text', description: 'text' });
vacancySchema.index({ 'company.name': 1 });
vacancySchema.index({ publishedAt: -1 });
vacancySchema.index({ isActive: 1 });

module.exports = mongoose.model('Vacancy', vacancySchema);
