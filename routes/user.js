const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Получение профиля пользователя
router.get('/profile', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Обновление профиля пользователя
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, phone, portfolioUrl, aboutMe, skills } = req.body;
    
    req.user.firstName = firstName || req.user.firstName;
    req.user.lastName = lastName || req.user.lastName;
    req.user.phone = phone || req.user.phone;
    req.user.resume.portfolioUrl = portfolioUrl || req.user.resume.portfolioUrl;
    req.user.resume.aboutMe = aboutMe || req.user.resume.aboutMe;
    req.user.resume.skills = skills || req.user.resume.skills;
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Импорт резюме из HH.RU
router.post('/import-resume', requireAuth, async (req, res) => {
  try {
    if (!req.user.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'HH.RU access token not available'
      });
    }

    // Получаем резюме пользователя из HH.RU
    const resumesResponse = await axios.get('https://api.hh.ru/resumes/mine', {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`,
        'User-Agent': 'HH-Finder/1.0'
      }
    });

    const resumes = resumesResponse.data.items || [];
    const primaryResume = resumes.find(r => r.status.id === 'published') || resumes[0];

    if (!primaryResume) {
      return res.status(404).json({
        success: false,
        message: 'No published resume found'
      });
    }

    // Получаем детальную информацию о резюме
    const resumeDetailResponse = await axios.get(`https://api.hh.ru/resumes/${primaryResume.id}`, {
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`,
        'User-Agent': 'HH-Finder/1.0'
      }
    });

    const resumeDetail = resumeDetailResponse.data;

    // Обновляем информацию о резюме
    req.user.resume.hhResumeId = primaryResume.id;
    req.user.resume.aboutMe = resumeDetail.description;
    req.user.resume.skills = resumeDetail.skills?.map(s => s.name) || [];
    
    // Опыт работы
    req.user.resume.experience = resumeDetail.experience?.map(exp => ({
      company: exp.company?.name,
      position: exp.position,
      startDate: exp.start_date ? new Date(exp.start_date) : null,
      endDate: exp.end_date ? new Date(exp.end_date) : null,
      description: exp.description
    })) || [];

    // Образование
    req.user.resume.education = resumeDetail.education?.map(edu => ({
      institution: edu.name,
      degree: edu.level?.name,
      startDate: edu.start_date ? new Date(edu.start_date) : null,
      endDate: edu.end_date ? new Date(edu.end_date) : null
    })) || [];

    await req.user.save();

    res.json({
      success: true,
      message: 'Resume imported successfully',
      resume: req.user.resume
    });
  } catch (error) {
    console.error('Resume import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import resume',
      error: error.message
    });
  }
});

// Загрузка собственного резюме
router.post('/upload-resume', requireAuth, async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }

    req.user.resume.customResume = resumeText;
    await req.user.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume',
      error: error.message
    });
  }
});

// Обновление настроек уведомлений
router.put('/settings/notifications', requireAuth, async (req, res) => {
  try {
    const { email, telegram, push, telegramChatId } = req.body;
    
    req.user.settings.notifications.email = email !== undefined ? email : req.user.settings.notifications.email;
    req.user.settings.notifications.telegram = telegram !== undefined ? telegram : req.user.settings.notifications.telegram;
    req.user.settings.notifications.push = push !== undefined ? push : req.user.settings.notifications.push;
    
    if (telegramChatId) {
      req.user.settings.telegramChatId = telegramChatId;
    }
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Notification settings updated',
      settings: req.user.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
});

// Обновление настроек автоматических откликов
router.put('/settings/auto-response', requireAuth, async (req, res) => {
  try {
    const { enabled, delay } = req.body;
    
    req.user.settings.autoResponseEnabled = enabled !== undefined ? enabled : req.user.settings.autoResponseEnabled;
    req.user.settings.responseDelay = delay !== undefined ? delay : req.user.settings.responseDelay;
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Auto-response settings updated',
      settings: req.user.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-response settings',
      error: error.message
    });
  }
});

// Получение статистики пользователя
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const Response = require('../models/Response');
    const Search = require('../models/Search');
    
    const [responsesCount, searchesCount, recentResponses] = await Promise.all([
      Response.countDocuments({ userId: req.user._id }),
      Search.countDocuments({ userId: req.user._id }),
      Response.find({ userId: req.user._id })
        .populate('vacancyId')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);
    
    res.json({
      success: true,
      stats: {
        totalResponses: responsesCount,
        totalSearches: searchesCount,
        responsesUsed: req.user.subscription.responsesUsed,
        responsesLimit: req.user.subscription.responsesLimit,
        recentResponses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message
    });
  }
});

// Сохранение настроек пользователя
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const { notifications, autoResponse, profile, privacy } = req.body;
    
    // Обновляем настройки пользователя
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          settings: {
            notifications: notifications || {},
            autoResponse: autoResponse || {},
            profile: profile || {},
            privacy: privacy || {}
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Настройки сохранены',
      settings: updatedUser.settings
    });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сохранения настроек',
      error: error.message
    });
  }
});

// Получение настроек пользователя
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('settings');
    
    res.json({
      success: true,
      settings: user.settings || {
        notifications: {
          email: true,
          telegram: true,
          push: true,
          newVacancies: true,
          responses: true,
          invitations: true,
          errors: true
        },
        autoResponse: {
          enabled: true,
          maxDailyResponses: 50,
          maxTotalResponses: 200,
          responseInterval: 60,
          skipDuplicates: true,
          skipCompanies: [],
          preferredSchedule: 'workdays'
        },
        profile: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: '',
          timezone: 'Europe/Moscow',
          language: 'ru'
        },
        privacy: {
          showProfile: true,
          allowMessages: true,
          shareAnalytics: false
        }
      }
    });
  } catch (error) {
    console.error('Settings get error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения настроек',
      error: error.message
    });
  }
});

module.exports = router;
