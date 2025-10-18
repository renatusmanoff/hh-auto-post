const express = require('express');
const router = express.Router();
const axios = require('axios');
const Vacancy = require('../models/Vacancy');
const Search = require('../models/Search');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Поиск вакансий в HH.RU
router.post('/search', requireAuth, async (req, res) => {
  try {
    const { text, area, specialization, experience, employment, schedule, salary, orderBy = 'relevance', page = 0, perPage = 20 } = req.body;
    
    // Формируем параметры запроса к HH.RU API
    const params = new URLSearchParams();
    
    if (text) params.append('text', text);
    if (area && area.length > 0) params.append('area', area.join(','));
    if (specialization && specialization.length > 0) params.append('specialization', specialization.join(','));
    if (experience) params.append('experience', experience);
    if (employment && employment.length > 0) params.append('employment', employment.join(','));
    if (schedule && schedule.length > 0) params.append('schedule', schedule.join(','));
    if (salary) {
      if (salary.from) params.append('salary', salary.from);
      if (salary.currency) params.append('currency', salary.currency);
    }
    if (orderBy) params.append('order_by', orderBy);
    
    params.append('page', page);
    params.append('per_page', perPage);
    
    // Выполняем запрос к HH.RU API
    const response = await axios.get(`https://api.hh.ru/vacancies?${params.toString()}`, {
      headers: {
        'User-Agent': 'HH-Finder/1.0'
      }
    });
    
    const vacancies = response.data.items || [];
    const totalFound = response.data.found || 0;
    
    // Сохраняем найденные вакансии в базу данных
    const savedVacancies = [];
    for (const vacancy of vacancies) {
      try {
        let savedVacancy = await Vacancy.findOne({ hhId: vacancy.id });
        
        if (!savedVacancy) {
          savedVacancy = new Vacancy({
            hhId: vacancy.id,
            title: vacancy.name,
            company: {
              name: vacancy.employer?.name,
              id: vacancy.employer?.id,
              logo: vacancy.employer?.logo_urls?.original,
              url: vacancy.employer?.url
            },
            salary: vacancy.salary ? {
              from: vacancy.salary.from,
              to: vacancy.salary.to,
              currency: vacancy.salary.currency,
              gross: vacancy.salary.gross
            } : null,
            experience: vacancy.experience?.name,
            schedule: vacancy.schedule?.name,
            employment: vacancy.employment?.name,
            description: vacancy.description,
            requirements: vacancy.requirement,
            responsibilities: vacancy.responsibility,
            conditions: vacancy.conditions,
            skills: vacancy.key_skills?.map(skill => skill.name) || [],
            location: {
              city: vacancy.area?.name,
              address: vacancy.address?.raw,
              metro: vacancy.metro?.map(station => station.station_name) || []
            },
            publishedAt: vacancy.published_at ? new Date(vacancy.published_at) : null,
            url: vacancy.alternate_url
          });
          
          await savedVacancy.save();
        }
        
        savedVacancies.push(savedVacancy);
      } catch (error) {
        console.error(`Error saving vacancy ${vacancy.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      vacancies: savedVacancies,
      totalFound,
      page: parseInt(page),
      perPage: parseInt(perPage),
      pages: Math.ceil(totalFound / perPage)
    });
  } catch (error) {
    console.error('Vacancy search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search vacancies',
      error: error.message
    });
  }
});

// Получение детальной информации о вакансии
router.get('/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findOne({ hhId: req.params.id });
    
    if (!vacancy) {
      // Если вакансии нет в базе, получаем её из HH.RU API
      try {
        const response = await axios.get(`https://api.hh.ru/vacancies/${req.params.id}`, {
          headers: {
            'User-Agent': 'HH-Finder/1.0'
          }
        });
        
        const vacancyData = response.data;
        
        const newVacancy = new Vacancy({
          hhId: vacancyData.id,
          title: vacancyData.name,
          company: {
            name: vacancyData.employer?.name,
            id: vacancyData.employer?.id,
            logo: vacancyData.employer?.logo_urls?.original,
            url: vacancyData.employer?.url
          },
          salary: vacancyData.salary ? {
            from: vacancyData.salary.from,
            to: vacancyData.salary.to,
            currency: vacancyData.salary.currency,
            gross: vacancyData.salary.gross
          } : null,
          experience: vacancyData.experience?.name,
          schedule: vacancyData.schedule?.name,
          employment: vacancyData.employment?.name,
          description: vacancyData.description,
          requirements: vacancyData.requirement,
          responsibilities: vacancyData.responsibility,
          conditions: vacancyData.conditions,
          skills: vacancyData.key_skills?.map(skill => skill.name) || [],
          location: {
            city: vacancyData.area?.name,
            address: vacancyData.address?.raw,
            metro: vacancyData.metro?.map(station => station.station_name) || []
          },
          publishedAt: vacancyData.published_at ? new Date(vacancyData.published_at) : null,
          url: vacancyData.alternate_url
        });
        
        await newVacancy.save();
        
        res.json({
          success: true,
          vacancy: newVacancy
        });
      } catch (apiError) {
        res.status(404).json({
          success: false,
          message: 'Vacancy not found'
        });
      }
    } else {
      res.json({
        success: true,
        vacancy
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get vacancy',
      error: error.message
    });
  }
});

// Получение списка сохраненных поисков пользователя
router.get('/searches/list', requireAuth, async (req, res) => {
  try {
    const searches = await Search.find({ userId: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      searches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get searches',
      error: error.message
    });
  }
});

// Создание нового поиска
router.post('/searches', requireAuth, async (req, res) => {
  try {
    const { name, filters } = req.body;
    
    if (!name || !filters) {
      return res.status(400).json({
        success: false,
        message: 'Name and filters are required'
      });
    }
    
    const search = new Search({
      userId: req.user._id,
      name,
      filters
    });
    
    await search.save();
    
    res.json({
      success: true,
      message: 'Search created successfully',
      search
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create search',
      error: error.message
    });
  }
});

// Обновление поиска
router.put('/searches/:id', requireAuth, async (req, res) => {
  try {
    const { name, filters, isActive } = req.body;
    
    const search = await Search.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }
    
    if (name) search.name = name;
    if (filters) search.filters = filters;
    if (isActive !== undefined) search.isActive = isActive;
    
    await search.save();
    
    res.json({
      success: true,
      message: 'Search updated successfully',
      search
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update search',
      error: error.message
    });
  }
});

// Удаление поиска
router.delete('/searches/:id', requireAuth, async (req, res) => {
  try {
    const search = await Search.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search not found'
      });
    }
    
    await Search.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Search deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete search',
      error: error.message
    });
  }
});

// Получение справочников HH.RU
router.get('/dictionaries/areas', async (req, res) => {
  try {
    const response = await axios.get('https://api.hh.ru/areas', {
      headers: {
        'User-Agent': 'HH-Finder/1.0'
      }
    });
    
    res.json({
      success: true,
      areas: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get areas',
      error: error.message
    });
  }
});

router.get('/dictionaries/specializations', async (req, res) => {
  try {
    const response = await axios.get('https://api.hh.ru/specializations', {
      headers: {
        'User-Agent': 'HH-Finder/1.0'
      }
    });
    
    res.json({
      success: true,
      specializations: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get specializations',
      error: error.message
    });
  }
});

module.exports = router;
