const cron = require('node-cron');
const HHService = require('./hhService');
const Search = require('../models/Search');
const Response = require('../models/Response');
const Resume = require('../models/Resume');
const User = require('../models/User');
const NotificationService = require('./notificationService');

class AutoResponseService {
  constructor() {
    this.isRunning = false;
    this.activeJobs = new Map();
  }

  // Запуск сервиса автоматических откликов
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Запускаем задачу каждую минуту
    cron.schedule('* * * * *', async () => {
      await this.processSearches();
    });
  }

  // Остановка сервиса
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Останавливаем все активные задачи
    this.activeJobs.forEach((job, searchId) => {
      job.destroy();
      this.activeJobs.delete(searchId);
    });
  }

  // Основной процесс обработки поисков
  async processSearches() {
    try {
      const activeSearches = await Search.find({
        status: 'active',
        $or: [
          { nextRun: { $lte: new Date() } },
          { nextRun: { $exists: false } }
        ]
      }).populate('userId');

      for (const search of activeSearches) {
        await this.processSearch(search);
      }
    } catch (error) {
      // Ошибка обработки поисков
    }
  }

  // Обработка одного поиска
  async processSearch(search) {
    try {

      const user = search.userId;
      if (!user || !user.accessToken) {
        await this.updateSearchError(search, 'Пользователь не найден или нет токена доступа');
        return;
      }

      // Проверяем лимиты пользователя
      const limits = await this.checkUserLimits(user, search);
      if (!limits.canSend) {
        await this.updateSearchNextRun(search, 60); // Повторить через час
        return;
      }

      // Получаем резюме пользователя
      const resume = await this.getUserResume(user, search);
      if (!resume) {
        await this.updateSearchError(search, 'Не найдено активное резюме');
        return;
      }

      // Ищем новые вакансии
      const vacancies = await this.findNewVacancies(search, user.accessToken);

      // Отправляем отклики
      let sentCount = 0;
      for (const vacancy of vacancies.slice(0, limits.remaining)) {
        try {
          await this.sendResponse(search, vacancy, resume, user);
          sentCount++;
          
          // Небольшая задержка между откликами
          await this.delay(3000);
        } catch (error) {
          console.error(`❌ Ошибка отправки отклика на вакансию ${vacancy.id}:`, error.message);
        }
      }

      // Обновляем статистику поиска
      await this.updateSearchStats(search, sentCount);

      // Планируем следующий запуск
      await this.updateSearchNextRun(search, search.runInterval);


    } catch (error) {
      console.error(`❌ Ошибка обработки поиска ${search._id}:`, error);
      await this.updateSearchError(search, error.message);
    }
  }

  // Проверка лимитов пользователя
  async checkUserLimits(user, search) {
    try {
      const limits = await HHService.checkResponseLimits(user.accessToken);
      
      // Проверяем дневной лимит HH.RU
      if (limits.dailyUsed >= limits.dailyLimit) {
        return { canSend: false, reason: 'Достигнут дневной лимит HH.RU' };
      }

      // Проверяем лимит поиска
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayResponses = await Response.countDocuments({
        userId: user._id,
        searchId: search._id,
        sentAt: { $gte: today }
      });

      if (todayResponses >= search.dailyLimit) {
        return { canSend: false, reason: 'Достигнут дневной лимит поиска' };
      }

      const remaining = Math.min(
        limits.dailyLimit - limits.dailyUsed,
        search.dailyLimit - todayResponses
      );

      return { 
        canSend: true, 
        remaining: Math.max(0, remaining),
        dailyUsed: limits.dailyUsed,
        dailyLimit: limits.dailyLimit
      };
    } catch (error) {
      console.error('Ошибка проверки лимитов:', error);
      return { canSend: false, reason: 'Ошибка проверки лимитов' };
    }
  }

  // Получение резюме пользователя
  async getUserResume(user, search) {
    try {
      let resume;
      
      if (search.resumeId) {
        resume = await Resume.findById(search.resumeId);
      } else {
        resume = await Resume.findOne({ 
          userId: user._id, 
          isActive: true, 
          isPrimary: true 
        });
      }

      return resume;
    } catch (error) {
      console.error('Ошибка получения резюме:', error);
      return null;
    }
  }

  // Поиск новых вакансий
  async findNewVacancies(search, accessToken) {
    try {
      const filters = this.buildSearchFilters(search);
      const result = await HHService.searchVacancies(filters, accessToken);
      
      // Получаем уже отправленные отклики
      const existingResponses = await Response.find({
        userId: search.userId,
        searchId: search._id,
        'vacancy.hhId': { $in: result.items.map(v => v.id) }
      }).select('vacancy.hhId');

      const existingIds = new Set(existingResponses.map(r => r.vacancy.hhId));
      
      // Фильтруем новые вакансии
      const newVacancies = result.items.filter(v => !existingIds.has(v.id));
      
      return newVacancies;
    } catch (error) {
      console.error('Ошибка поиска вакансий:', error);
      return [];
    }
  }

  // Построение фильтров поиска
  buildSearchFilters(search) {
    return {
      keywords: search.keywords,
      excludeKeywords: search.excludeKeywords,
      areaIds: search.areaIds,
      salary: search.salary,
      experience: search.experience,
      schedule: search.schedule,
      employment: search.employment,
      specialization: search.specialization,
      industry: search.industry,
      companySize: search.companySize,
      companyType: search.companyType,
      perPage: 50,
      orderBy: 'publication_time'
    };
  }

  // Отправка отклика
  async sendResponse(search, vacancy, resume, user) {
    try {
      // Получаем детальную информацию о вакансии
      const vacancyDetails = await HHService.getVacancyDetails(vacancy.id, user.accessToken);
      
      // Генерируем сопроводительное письмо
      const coverLetter = await this.generateCoverLetter(search, vacancyDetails, resume);
      
      // Отправляем отклик через HH.RU API
      const hhResponse = await HHService.sendResponse(
        vacancy.id, 
        resume.hhResumeId, 
        coverLetter, 
        user.accessToken
      );

      // Сохраняем отклик в базу данных
      const response = new Response({
        userId: user._id,
        searchId: search._id,
        resumeId: resume._id,
        vacancy: {
          hhId: vacancy.id,
          title: vacancyDetails.name,
          company: {
            name: vacancyDetails.employer?.name,
            hhId: vacancyDetails.employer?.id,
            url: vacancyDetails.employer?.url,
            logo: vacancyDetails.employer?.logo_urls?.original
          },
          area: {
            name: vacancyDetails.area?.name,
            id: vacancyDetails.area?.id
          },
          salary: vacancyDetails.salary,
          experience: vacancyDetails.experience?.name,
          schedule: vacancyDetails.schedule?.name,
          employment: vacancyDetails.employment?.name,
          description: vacancyDetails.description,
          requirements: vacancyDetails.requirement,
          responsibilities: vacancyDetails.responsibility,
          url: vacancyDetails.alternate_url,
          publishedAt: vacancyDetails.published_at
        },
        coverLetter: {
          text: coverLetter,
          template: search.coverLetterTemplate,
          aiGenerated: search.coverLetterTemplate === 'ai_generated'
        },
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          userAgent: 'HH-Finder/1.0',
          retryCount: 0
        }
      });

      await response.save();

      // Отправляем уведомление
      await NotificationService.sendResponseNotification(user, response);


    } catch (error) {
      console.error(`❌ Ошибка отправки отклика:`, error);
      
      // Сохраняем ошибку
      const response = new Response({
        userId: user._id,
        searchId: search._id,
        vacancy: {
          hhId: vacancy.id,
          title: vacancy.name
        },
        status: 'error',
        error: {
          message: error.message,
          timestamp: new Date()
        }
      });

      await response.save();
      throw error;
    }
  }

  // Генерация сопроводительного письма
  async generateCoverLetter(search, vacancy, resume) {
    if (search.coverLetterTemplate === 'custom' && search.coverLetter) {
      return search.coverLetter;
    }

    if (search.coverLetterTemplate === 'ai_generated') {
      // Здесь будет интеграция с OpenAI для генерации письма
      return await this.generateAICoverLetter(search, vacancy, resume);
    }

    // Стандартное письмо
    return this.generateDefaultCoverLetter(search, vacancy, resume);
  }

  // Генерация стандартного письма
  generateDefaultCoverLetter(search, vacancy, resume) {
    return `Здравствуйте!

Меня заинтересовала вакансия "${vacancy.name}" в компании "${vacancy.employer?.name}".

${resume.summary || 'Готов обсудить детали сотрудничества.'}

Буду рад возможности обсудить мой опыт и то, как я могу внести вклад в развитие вашей команды.

С уважением,
${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}`;
  }

  // Генерация письма с помощью ИИ
  async generateAICoverLetter(search, vacancy, resume) {
    // TODO: Интеграция с OpenAI
    return this.generateDefaultCoverLetter(search, vacancy, resume);
  }

  // Обновление статистики поиска
  async updateSearchStats(search, sentCount) {
    search.responsesCount += sentCount;
    search.lastRun = new Date();
    search.errorCount = 0;
    search.lastError = null;
    await search.save();
  }

  // Обновление времени следующего запуска
  async updateSearchNextRun(search, intervalMinutes) {
    search.nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);
    await search.save();
  }

  // Обновление ошибки поиска
  async updateSearchError(search, errorMessage) {
    search.errorCount += 1;
    search.lastError = {
      message: errorMessage,
      timestamp: new Date()
    };
    
    if (search.errorCount >= 5) {
      search.status = 'error';
    }
    
    await search.save();
  }

  // Задержка
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Ручной запуск поиска
  async runSearch(searchId) {
    try {
      const search = await Search.findById(searchId).populate('userId');
      if (!search) {
        throw new Error('Поиск не найден');
      }

      await this.processSearch(search);
      return { success: true, message: 'Поиск выполнен успешно' };
    } catch (error) {
      console.error('Ошибка ручного запуска поиска:', error);
      return { success: false, message: error.message };
    }
  }

  // Остановка поиска
  async stopSearch(searchId) {
    try {
      const search = await Search.findById(searchId);
      if (!search) {
        throw new Error('Поиск не найден');
      }

      search.status = 'paused';
      await search.save();

      return { success: true, message: 'Поиск остановлен' };
    } catch (error) {
      console.error('Ошибка остановки поиска:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new AutoResponseService();
