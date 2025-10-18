const express = require('express');
const router = express.Router();
const axios = require('axios');
const Response = require('../models/Response');
const Vacancy = require('../models/Vacancy');
const User = require('../models/User');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Создание отклика на вакансию
router.post('/', requireAuth, async (req, res) => {
  try {
    const { vacancyId, coverLetter, coverLetterType = 'ai_generated' } = req.body;
    
    if (!vacancyId || !coverLetter) {
      return res.status(400).json({
        success: false,
        message: 'Vacancy ID and cover letter are required'
      });
    }
    
    // Проверяем лимиты пользователя
    if (!req.user.canMakeResponse()) {
      return res.status(403).json({
        success: false,
        message: 'Response limit exceeded. Please upgrade your plan.'
      });
    }
    
    // Получаем вакансию
    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vacancy not found'
      });
    }
    
    // Проверяем, не отправлял ли уже пользователь отклик на эту вакансию
    const existingResponse = await Response.findOne({
      userId: req.user._id,
      hhVacancyId: vacancy.hhId
    });
    
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'Response already sent for this vacancy'
      });
    }
    
    // Создаем отклик
    const response = new Response({
      userId: req.user._id,
      vacancyId: vacancy._id,
      hhVacancyId: vacancy.hhId,
      coverLetter,
      coverLetterType,
      status: 'pending'
    });
    
    await response.save();
    
    // Отправляем отклик в HH.RU
    try {
      if (!req.user.accessToken) {
        throw new Error('HH.RU access token not available');
      }
      
      const hhResponse = await axios.post(`https://api.hh.ru/negotiations`, {
        resume_id: req.user.resume.hhResumeId,
        vacancy_id: vacancy.hhId,
        message: coverLetter
      }, {
        headers: {
          'Authorization': `Bearer ${req.user.accessToken}`,
          'User-Agent': 'HH-Finder/1.0',
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем статус отклика
      response.status = 'sent';
      response.hhResponseId = hhResponse.data.id;
      response.sentAt = new Date();
      
      // Увеличиваем счетчик использованных откликов
      await req.user.incrementResponses();
      
      await response.save();
      
      res.json({
        success: true,
        message: 'Response sent successfully',
        response: response,
        hhResponseId: hhResponse.data.id
      });
      
    } catch (hhError) {
      console.error('HH.RU response error:', hhError);
      
      // Обновляем статус отклика как неудачный
      response.status = 'failed';
      response.errorMessage = hhError.response?.data?.description || hhError.message;
      await response.save();
      
      res.status(500).json({
        success: false,
        message: 'Failed to send response to HH.RU',
        error: hhError.response?.data?.description || hhError.message
      });
    }
    
  } catch (error) {
    console.error('Response creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create response',
      error: error.message
    });
  }
});

// Получение списка откликов пользователя
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, perPage = 20, status } = req.query;
    
    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }
    
    const responses = await Response.find(filter)
      .populate('vacancyId')
      .sort({ createdAt: -1 })
      .skip(page * perPage)
      .limit(parseInt(perPage));
    
    const total = await Response.countDocuments(filter);
    
    res.json({
      success: true,
      responses,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      pages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get responses',
      error: error.message
    });
  }
});

// Получение детальной информации об отклике
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const response = await Response.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('vacancyId');
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
    
    res.json({
      success: true,
      response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get response',
      error: error.message
    });
  }
});

// Обновление отклика
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { coverLetter } = req.body;
    
    const response = await Response.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
    
    if (response.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sent response'
      });
    }
    
    response.coverLetter = coverLetter || response.coverLetter;
    await response.save();
    
    res.json({
      success: true,
      message: 'Response updated successfully',
      response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update response',
      error: error.message
    });
  }
});

// Удаление отклика
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const response = await Response.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
    
    if (response.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sent response'
      });
    }
    
    await Response.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Response deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete response',
      error: error.message
    });
  }
});

// Массовая отправка откликов по сохраненному поиску
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { searchId, coverLetter, maxResponses = 10 } = req.body;
    
    if (!searchId || !coverLetter) {
      return res.status(400).json({
        success: false,
        message: 'Search ID and cover letter are required'
      });
    }
    
    const Search = require('../models/Search');
    const search = await Search.findOne({ _id: searchId, userId: req.user._id });
    
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }
    
    // Проверяем лимиты пользователя
    const remainingResponses = req.user.subscription.responsesLimit - req.user.subscription.responsesUsed;
    if (remainingResponses <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Response limit exceeded. Please upgrade your plan.'
      });
    }
    
    const actualMaxResponses = Math.min(maxResponses, remainingResponses);
    
    // Выполняем поиск вакансий
    const vacanciesResponse = await axios.post('/api/vacancies/search', search.filters);
    const vacancies = vacanciesResponse.data.vacancies || [];
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < Math.min(actualMaxResponses, vacancies.length); i++) {
      const vacancy = vacancies[i];
      
      try {
        // Проверяем, не отправлял ли уже пользователь отклик на эту вакансию
        const existingResponse = await Response.findOne({
          userId: req.user._id,
          hhVacancyId: vacancy.hhId
        });
        
        if (existingResponse) {
          results.push({
            vacancyId: vacancy._id,
            vacancyTitle: vacancy.title,
            status: 'skipped',
            message: 'Response already sent'
          });
          continue;
        }
        
        // Создаем отклик
        const response = new Response({
          userId: req.user._id,
          vacancyId: vacancy._id,
          hhVacancyId: vacancy.hhId,
          searchId: search._id,
          coverLetter,
          coverLetterType: 'ai_generated',
          status: 'pending'
        });
        
        await response.save();
        
        // Отправляем отклик в HH.RU
        if (req.user.accessToken) {
          try {
            const hhResponse = await axios.post(`https://api.hh.ru/negotiations`, {
              resume_id: req.user.resume.hhResumeId,
              vacancy_id: vacancy.hhId,
              message: coverLetter
            }, {
              headers: {
                'Authorization': `Bearer ${req.user.accessToken}`,
                'User-Agent': 'HH-Finder/1.0',
                'Content-Type': 'application/json'
              }
            });
            
            response.status = 'sent';
            response.hhResponseId = hhResponse.data.id;
            response.sentAt = new Date();
            await response.save();
            
            await req.user.incrementResponses();
            successCount++;
            
            results.push({
              vacancyId: vacancy._id,
              vacancyTitle: vacancy.title,
              status: 'sent',
              hhResponseId: hhResponse.data.id
            });
            
          } catch (hhError) {
            response.status = 'failed';
            response.errorMessage = hhError.response?.data?.description || hhError.message;
            await response.save();
            
            errorCount++;
            results.push({
              vacancyId: vacancy._id,
              vacancyTitle: vacancy.title,
              status: 'failed',
              error: hhError.response?.data?.description || hhError.message
            });
          }
        } else {
          errorCount++;
          results.push({
            vacancyId: vacancy._id,
            vacancyTitle: vacancy.title,
            status: 'failed',
            error: 'HH.RU access token not available'
          });
        }
        
        // Небольшая задержка между откликами
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errorCount++;
        results.push({
          vacancyId: vacancy._id,
          vacancyTitle: vacancy.title,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Обновляем статистику поиска
    search.responsesSent += successCount;
    search.lastRun = new Date();
    await search.save();
    
    res.json({
      success: true,
      message: `Bulk response completed. Sent: ${successCount}, Failed: ${errorCount}`,
      results,
      summary: {
        total: results.length,
        sent: successCount,
        failed: errorCount,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    });
    
  } catch (error) {
    console.error('Bulk response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk responses',
      error: error.message
    });
  }
});

module.exports = router;
