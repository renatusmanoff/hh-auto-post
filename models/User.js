const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  hhId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  avatar: String,
  resume: {
    hhResumeId: String,
    customResume: String,
    portfolioUrl: String,
    aboutMe: String,
    skills: [String],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String
    }],
    education: [{
      institution: String,
      degree: String,
      startDate: Date,
      endDate: Date
    }]
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    responsesUsed: {
      type: Number,
      default: 0
    },
    responsesLimit: {
      type: Number,
      default: 50 // HH.RU free limit
    }
  },
  settings: {
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
    },
    telegramChatId: String,
    autoResponseEnabled: {
      type: Boolean,
      default: false
    },
    responseDelay: {
      type: Number,
      default: 300 // 5 minutes in seconds
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
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
userSchema.index({ hhId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.plan': 1 });

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canMakeResponse = function() {
  if (!this.subscription.isActive) return false;
  return this.subscription.responsesUsed < this.subscription.responsesLimit;
};

userSchema.methods.incrementResponses = function() {
  this.subscription.responsesUsed += 1;
  return this.save();
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
