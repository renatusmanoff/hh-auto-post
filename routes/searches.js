const express = require('express');
const router = express.Router();
const Search = require('../models/Search');
const Resume = require('../models/Resume');
const Response = require('../models/Response');
const HHService = require('../services/hhService');
const AutoResponseService = require('../services/autoResponseService');
const CoverLetterService = require('../services/coverLetterService');

// Получение всех поисков пользователя
router.get('/', async (req, res) => {
  try {
    const searches = await Search.find({ userId: req.user._id })
      .populate('resumeId')
      .sort({ createdAt: -1 });

    res.json(searches);
  } catch (error) {
    console.error('Ошибка получения поисков:', error);
    res.status(500).json({ message: 'Ошибка получения поисков', error: error.message });
  }
});

// Получение поиска по ID
router.get('/:id', async (req, res) => {
  try {
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('resumeId');

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    res.json(search);
  } catch (error) {
    console.error('Ошибка получения поиска:', error);
    res.status(500).json({ message: 'Ошибка получения поиска', error: error.message });
  }
});

// Создание нового поиска
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      keywords,
      excludeKeywords,
      area,
      areaIds,
      salary,
      experience,
      schedule,
      employment,
      specialization,
      industry,
      companySize,
      companyType,
      coverLetter,
      coverLetterTemplate,
      resumeId,
      dailyLimit,
      totalLimit,
      runInterval,
      notifications
    } = req.body;

    // Валидация обязательных полей
    if (!name || !keywords) {
      return res.status(400).json({ 
        message: 'Название и ключевые слова обязательны' 
      });
    }

    // Проверяем лимиты пользователя (только для реальных пользователей HH.RU)
    if (req.user.email !== 'test@example.com') {
      const userLimits = await HHService.checkResponseLimits(req.user.accessToken);
      if (userLimits.dailyUsed >= userLimits.dailyLimit) {
        return res.status(400).json({ 
          message: 'Достигнут дневной лимит откликов на HH.RU' 
        });
      }
    }

    const search = new Search({
      userId: req.user._id,
      name,
      description,
      keywords,
      excludeKeywords,
      area,
      areaIds,
      salary,
      experience,
      schedule,
      employment,
      specialization,
      industry,
      companySize,
      companyType,
      coverLetter,
      coverLetterTemplate: coverLetterTemplate || 'default',
      resumeId,
      dailyLimit: dailyLimit || 50,
      totalLimit: totalLimit || 200,
      runInterval: runInterval || 60,
      notifications: notifications || {
        email: true,
        telegram: true,
        push: true
      },
      status: 'active',
      nextRun: new Date(Date.now() + (runInterval || 60) * 60 * 1000)
    });

    await search.save();

    res.status(201).json(search);
  } catch (error) {
    console.error('Ошибка создания поиска:', error);
    res.status(500).json({ message: 'Ошибка создания поиска', error: error.message });
  }
});

// Обновление поиска
router.put('/:id', async (req, res) => {
  try {
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    // Обновляем поля
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        search[key] = req.body[key];
      }
    });

    await search.save();

    res.json(search);
  } catch (error) {
    console.error('Ошибка обновления поиска:', error);
    res.status(500).json({ message: 'Ошибка обновления поиска', error: error.message });
  }
});

// Удаление поиска
router.delete('/:id', async (req, res) => {
  try {
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    await Search.findByIdAndDelete(req.params.id);

    res.json({ message: 'Поиск удален' });
  } catch (error) {
    console.error('Ошибка удаления поиска:', error);
    res.status(500).json({ message: 'Ошибка удаления поиска', error: error.message });
  }
});

// Запуск/остановка поиска
router.put('/:id/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    search.status = enabled ? 'active' : 'paused';
    
    if (enabled) {
      search.nextRun = new Date(Date.now() + search.runInterval * 60 * 1000);
    }

    await search.save();

    res.json({ 
      message: enabled ? 'Поиск запущен' : 'Поиск остановлен',
      status: search.status 
    });
  } catch (error) {
    console.error('Ошибка переключения поиска:', error);
    res.status(500).json({ message: 'Ошибка переключения поиска', error: error.message });
  }
});

// Ручной запуск поиска
router.post('/:id/run', async (req, res) => {
  try {
    const result = await AutoResponseService.runSearch(req.params.id);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Ошибка ручного запуска:', error);
    res.status(500).json({ message: 'Ошибка ручного запуска', error: error.message });
  }
});

// Получение статистики поиска
router.get('/:id/stats', async (req, res) => {
  try {
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    // Получаем статистику откликов
    const responsesStats = await Response.aggregate([
      { $match: { searchId: search._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Получаем статистику по дням
    const dailyStats = await Response.aggregate([
      { $match: { searchId: search._id, sentAt: { $exists: true } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$sentAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    const stats = {
      totalResponses: search.responsesCount,
      invitations: search.invitationsCount,
      rejections: search.rejectionsCount,
      statusBreakdown: responsesStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      dailyStats,
      lastRun: search.lastRun,
      nextRun: search.nextRun,
      errorCount: search.errorCount,
      lastError: search.lastError
    };

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ message: 'Ошибка получения статистики', error: error.message });
  }
});

// Тестирование поиска (поиск вакансий без отправки откликов)
router.post('/:id/test', async (req, res) => {
  try {
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    const filters = AutoResponseService.buildSearchFilters(search);
    const result = await HHService.searchVacancies(filters, req.user.accessToken);

    // Получаем уже отправленные отклики
    const existingResponses = await Response.find({
      userId: req.user._id,
      searchId: search._id,
      'vacancy.hhId': { $in: result.items.map(v => v.id) }
    }).select('vacancy.hhId');

    const existingIds = new Set(existingResponses.map(r => r.vacancy.hhId));
    const newVacancies = result.items.filter(v => !existingIds.has(v.id));

    res.json({
      totalFound: result.found,
      newVacancies: newVacancies.length,
      alreadyResponded: result.items.length - newVacancies.length,
      vacancies: newVacancies.slice(0, 10) // Показываем только первые 10
    });
  } catch (error) {
    console.error('Ошибка тестирования поиска:', error);
    res.status(500).json({ message: 'Ошибка тестирования поиска', error: error.message });
  }
});

// Генерация сопроводительного письма для поиска
router.post('/:id/generate-cover-letter', async (req, res) => {
  try {
    const { vacancyId } = req.body;
    
    const search = await Search.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('resumeId');

    if (!search) {
      return res.status(404).json({ message: 'Поиск не найден' });
    }

    if (!search.resumeId) {
      return res.status(400).json({ message: 'Не выбрано резюме для поиска' });
    }

    // Получаем информацию о вакансии
    const vacancy = await HHService.getVacancyDetails(vacancyId, req.user.accessToken);

    // Генерируем сопроводительное письмо
    const result = await CoverLetterService.generateCoverLetter(
      vacancy, 
      search.resumeId, 
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

module.exports = router;
