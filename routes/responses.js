const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const Search = require('../models/Search');
const HHService = require('../services/hhService');
const CoverLetterService = require('../services/coverLetterService');

// Получение всех откликов пользователя
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, searchId } = req.query;
    const skip = (page - 1) * limit;

    // Для тестового пользователя возвращаем моковые отклики
    if (req.user.email === 'test@example.com') {
      const mockResponses = [
        {
          _id: 'mock1',
          vacancy: {
            title: 'Frontend разработчик (React)',
            company: { name: 'ТехКомпания' },
            url: '#'
          },
          status: 'invited',
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          coverLetter: 'Здравствуйте! Меня заинтересовала вакансия Frontend разработчика...'
        },
        {
          _id: 'mock2',
          vacancy: {
            title: 'JavaScript разработчик',
            company: { name: 'Инновации' },
            url: '#'
          },
          status: 'viewed',
          sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          coverLetter: 'Добрый день! Я заинтересован в позиции JavaScript разработчика...'
        },
        {
          _id: 'mock3',
          vacancy: {
            title: 'React Developer',
            company: { name: 'Стартап' },
            url: '#'
          },
          status: 'sent',
          sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          coverLetter: 'Привет! Видел вашу вакансию React Developer...'
        },
        {
          _id: 'mock4',
          vacancy: {
            title: 'Frontend Engineer',
            company: { name: 'Корпорация' },
            url: '#'
          },
          status: 'rejected',
          sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          coverLetter: 'Здравствуйте! Подаю заявку на позицию Frontend Engineer...'
        },
        {
          _id: 'mock5',
          vacancy: {
            title: 'Vue.js разработчик',
            company: { name: 'Агентство' },
            url: '#'
          },
          status: 'pending',
          sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          coverLetter: 'Добрый день! Интересует вакансия Vue.js разработчика...'
        }
      ];
      
      return res.json({
        responses: mockResponses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockResponses.length,
          pages: 1
        }
      });
    }

    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (searchId) filter.searchId = searchId;

    const responses = await Response.find(filter)
      .populate('searchId', 'name')
      .populate('resumeId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments(filter);

    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения откликов:', error);
    res.status(500).json({ message: 'Ошибка получения откликов', error: error.message });
  }
});

// Получение отклика по ID
router.get('/:id', async (req, res) => {
  try {
    const response = await Response.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
      .populate('searchId', 'name')
      .populate('resumeId', 'title');

    if (!response) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    res.json(response);
  } catch (error) {
    console.error('Ошибка получения отклика:', error);
    res.status(500).json({ message: 'Ошибка получения отклика', error: error.message });
  }
});

// Создание нового отклика
router.post('/', async (req, res) => {
  try {
    const {
      searchId,
      vacancyId,
      resumeId,
      coverLetter,
      coverLetterTemplate
    } = req.body;

    // Валидация
    if (!searchId || !vacancyId || !resumeId) {
      return res.status(400).json({ 
        message: 'ID поиска, вакансии и резюме обязательны' 
      });
    }

    // Проверяем, что поиск принадлежит пользователю
    const search = await Search.findOne({ 
      _id: searchId, 
      userId: req.user._id 
    });

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    // Получаем информацию о вакансии
    const vacancy = await HHService.getVacancyDetails(vacancyId, req.user.accessToken);

    // Получаем резюме
    const Resume = require('../models/Resume');
    const resume = await Resume.findOne({ 
      _id: resumeId, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    // Генерируем сопроводительное письмо
    let finalCoverLetter = coverLetter;
    if (!finalCoverLetter || coverLetterTemplate === 'ai_generated') {
      const letterResult = await CoverLetterService.generateCoverLetter(
        vacancy, 
        resume, 
        { tone: 'professional' }
      );
      finalCoverLetter = letterResult.success ? letterResult.coverLetter : letterResult.fallback;
    }

    // Отправляем отклик через HH.RU API
    const hhResponse = await HHService.sendResponse(
      vacancyId, 
      resume.hhResumeId, 
      finalCoverLetter, 
      req.user.accessToken
    );

    // Сохраняем отклик в базу данных
    const response = new Response({
      userId: req.user._id,
      searchId,
      resumeId,
      vacancy: {
        hhId: vacancy.id,
        title: vacancy.name,
        company: {
          name: vacancy.employer?.name,
          hhId: vacancy.employer?.id,
          url: vacancy.employer?.url,
          logo: vacancy.employer?.logo_urls?.original
        },
        area: {
          name: vacancy.area?.name,
          id: vacancy.area?.id
        },
        salary: vacancy.salary,
        experience: vacancy.experience?.name,
        schedule: vacancy.schedule?.name,
        employment: vacancy.employment?.name,
        description: vacancy.description,
        requirements: vacancy.requirement,
        responsibilities: vacancy.responsibility,
        url: vacancy.alternate_url,
        publishedAt: vacancy.published_at
      },
      coverLetter: {
        text: finalCoverLetter,
        template: coverLetterTemplate || 'custom',
        aiGenerated: coverLetterTemplate === 'ai_generated'
      },
      status: 'sent',
      sentAt: new Date(),
      metadata: {
        userAgent: 'HH-Finder/1.0',
        retryCount: 0
      }
    });

    await response.save();

    // Обновляем статистику поиска
    search.responsesCount += 1;
    search.lastRun = new Date();
    await search.save();

    res.status(201).json(response);
  } catch (error) {
    console.error('Ошибка создания отклика:', error);
    res.status(500).json({ message: 'Ошибка создания отклика', error: error.message });
  }
});

// Обновление статуса отклика
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const response = await Response.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!response) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    response.status = status;
    
    if (status === 'viewed') {
      response.viewedAt = new Date();
    } else if (status === 'invited' || status === 'rejected') {
      response.respondedAt = new Date();
      response.result = status === 'invited' ? 'invitation' : 'rejection';
    }

    await response.save();

    res.json({ message: 'Статус обновлен', response });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ message: 'Ошибка обновления статуса', error: error.message });
  }
});

// Удаление отклика
router.delete('/:id', async (req, res) => {
  try {
    const response = await Response.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!response) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    await Response.findByIdAndDelete(req.params.id);

    res.json({ message: 'Отклик удален' });
  } catch (error) {
    console.error('Ошибка удаления отклика:', error);
    res.status(500).json({ message: 'Ошибка удаления отклика', error: error.message });
  }
});

// Получение статистики откликов
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.user._id;

    // Для тестового пользователя возвращаем моковые данные
    if (req.user.email === 'test@example.com') {
      const mockStats = {
        total: 15,
        sent: 12,
        viewed: 8,
        invited: 3,
        rejected: 5,
        conversionRate: 20.0,
        dailyStats: [
          { _id: '2025-10-19', count: 3, invitations: 1 },
          { _id: '2025-10-18', count: 2, invitations: 0 },
          { _id: '2025-10-17', count: 4, invitations: 1 },
          { _id: '2025-10-16', count: 1, invitations: 0 },
          { _id: '2025-10-15', count: 2, invitations: 1 }
        ],
        companyStats: [
          { _id: 'ТехКомпания', count: 3, invitations: 1 },
          { _id: 'Инновации', count: 2, invitations: 1 },
          { _id: 'Стартап', count: 2, invitations: 0 },
          { _id: 'Корпорация', count: 1, invitations: 1 }
        ]
      };
      
      return res.json({
        success: true,
        stats: mockStats
      });
    }

    // Общая статистика
    const totalResponses = await Response.countDocuments({ userId });
    const sentResponses = await Response.countDocuments({ userId, status: 'sent' });
    const viewedResponses = await Response.countDocuments({ userId, status: 'viewed' });
    const invitedResponses = await Response.countDocuments({ userId, status: 'invited' });
    const rejectedResponses = await Response.countDocuments({ userId, status: 'rejected' });

    // Статистика по дням (последние 30 дней)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyStats = await Response.aggregate([
      { 
        $match: { 
          userId, 
          sentAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$sentAt'
            }
          },
          count: { $sum: 1 },
          invitations: {
            $sum: { $cond: [{ $eq: ['$status', 'invited'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Статистика по компаниям
    const companyStats = await Response.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$vacancy.company.name',
          count: { $sum: 1 },
          invitations: {
            $sum: { $cond: [{ $eq: ['$status', 'invited'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Статистика по поискам
    const searchStats = await Response.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'searches',
          localField: 'searchId',
          foreignField: '_id',
          as: 'search'
        }
      },
      { $unwind: '$search' },
      {
        $group: {
          _id: '$search.name',
          count: { $sum: 1 },
          invitations: {
            $sum: { $cond: [{ $eq: ['$status', 'invited'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      overview: {
        totalResponses,
        sentResponses,
        viewedResponses,
        invitedResponses,
        rejectedResponses,
        conversionRate: totalResponses > 0 ? Math.round((invitedResponses / totalResponses) * 100) : 0
      },
      dailyStats,
      companyStats,
      searchStats
    };

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики откликов:', error);
    res.status(500).json({ message: 'Ошибка получения статистики откликов', error: error.message });
  }
});

// Синхронизация статусов откликов с HH.RU
router.post('/sync-statuses', async (req, res) => {
  try {
    const pendingResponses = await Response.find({
      userId: req.user._id,
      status: { $in: ['sent', 'viewed'] }
    });

    let syncedCount = 0;
    const errors = [];

    for (const response of pendingResponses) {
      try {
        // Получаем статус отклика с HH.RU
        const hhResponses = await HHService.getUserResponses(req.user.accessToken, 0, 100);
        const hhResponse = hhResponses.items.find(r => r.vacancy.id === response.vacancy.hhId);

        if (hhResponse) {
          let newStatus = response.status;
          
          if (hhResponse.state?.id === 'viewed') {
            newStatus = 'viewed';
          } else if (hhResponse.state?.id === 'invitation') {
            newStatus = 'invited';
          } else if (hhResponse.state?.id === 'rejection') {
            newStatus = 'rejected';
          }

          if (newStatus !== response.status) {
            response.status = newStatus;
            
            if (newStatus === 'viewed') {
              response.viewedAt = new Date();
            } else if (newStatus === 'invited' || newStatus === 'rejected') {
              response.respondedAt = new Date();
              response.result = newStatus === 'invited' ? 'invitation' : 'rejection';
            }

            await response.save();
            syncedCount++;
          }
        }
      } catch (error) {
        errors.push({
          responseId: response._id,
          error: error.message
        });
      }
    }

    res.json({
      message: `Синхронизировано ${syncedCount} откликов`,
      syncedCount,
      errors
    });
  } catch (error) {
    console.error('Ошибка синхронизации статусов:', error);
    res.status(500).json({ message: 'Ошибка синхронизации статусов', error: error.message });
  }
});

// Генерация сопроводительного письма для отклика
router.post('/:id/generate-cover-letter', async (req, res) => {
  try {
    const response = await Response.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('resumeId');

    if (!response) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    const result = await CoverLetterService.generateCoverLetter(
      response.vacancy, 
      response.resumeId, 
      { tone: 'professional' }
    );

    if (result.success) {
      res.json({
        coverLetter: result.coverLetter,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({ 
        message: 'Ошибка генерации письма', 
        error: result.error,
        fallback: result.fallback 
      });
    }
  } catch (error) {
    console.error('Ошибка генерации письма:', error);
    res.status(500).json({ message: 'Ошибка генерации письма', error: error.message });
  }
});

// Улучшение существующего сопроводительного письма
router.post('/:id/improve-cover-letter', async (req, res) => {
  try {
    const response = await Response.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('resumeId');

    if (!response) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    const result = await CoverLetterService.improveCoverLetter(
      response.coverLetter.text,
      response.vacancy,
      response.resumeId
    );

    if (result.success) {
      res.json({
        improvedCoverLetter: result.improvedCoverLetter,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({ 
        message: 'Ошибка улучшения письма', 
        error: result.error,
        originalCoverLetter: result.originalCoverLetter 
      });
    }
  } catch (error) {
    console.error('Ошибка улучшения письма:', error);
    res.status(500).json({ message: 'Ошибка улучшения письма', error: error.message });
  }
});

module.exports = router;