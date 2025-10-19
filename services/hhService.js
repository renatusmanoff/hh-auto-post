const axios = require('axios');

class HHService {
  constructor() {
    this.baseURL = 'https://api.hh.ru';
    this.userAgent = 'HH-Finder/1.0';
  }

  // Получение вакансий по поисковому запросу
  async searchVacancies(filters, accessToken) {
    try {
      const params = this.buildSearchParams(filters);
      
      const response = await axios.get(`${this.baseURL}/vacancies`, {
        params,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return {
        items: response.data.items,
        found: response.data.found,
        pages: response.data.pages,
        page: response.data.page,
        per_page: response.data.per_page
      };
    } catch (error) {
      console.error('HH API search error:', error.response?.data || error.message);
      throw new Error(`Ошибка поиска вакансий: ${error.response?.data?.description || error.message}`);
    }
  }

  // Получение детальной информации о вакансии
  async getVacancyDetails(vacancyId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/vacancies/${vacancyId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data;
    } catch (error) {
      console.error('HH API vacancy details error:', error.response?.data || error.message);
      throw new Error(`Ошибка получения вакансии: ${error.response?.data?.description || error.message}`);
    }
  }

  // Отправка отклика на вакансию
  async sendResponse(vacancyId, resumeId, coverLetter, accessToken) {
    try {
      const response = await axios.post(`${this.baseURL}/negotiations`, {
        vacancy_id: vacancyId,
        resume_id: resumeId,
        message: coverLetter
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('HH API send response error:', error.response?.data || error.message);
      throw new Error(`Ошибка отправки отклика: ${error.response?.data?.description || error.message}`);
    }
  }

  // Получение резюме пользователя
  async getUserResumes(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/resumes/mine`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data.items;
    } catch (error) {
      console.error('HH API get resumes error:', error.response?.data || error.message);
      throw new Error(`Ошибка получения резюме: ${error.response?.data?.description || error.message}`);
    }
  }

  // Получение детальной информации о резюме
  async getResumeDetails(resumeId, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/resumes/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data;
    } catch (error) {
      console.error('HH API resume details error:', error.response?.data || error.message);
      throw new Error(`Ошибка получения резюме: ${error.response?.data?.description || error.message}`);
    }
  }

  // Получение откликов пользователя
  async getUserResponses(accessToken, page = 0, perPage = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/negotiations`, {
        params: {
          page,
          per_page: perPage
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data;
    } catch (error) {
      console.error('HH API get responses error:', error.response?.data || error.message);
      throw new Error(`Ошибка получения откликов: ${error.response?.data?.description || error.message}`);
    }
  }

  // Получение информации о пользователе
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent
        }
      });

      return response.data;
    } catch (error) {
      console.error('HH API get user info error:', error.response?.data || error.message);
      throw new Error(`Ошибка получения информации о пользователе: ${error.response?.data?.description || error.message}`);
    }
  }

  // Получение справочников HH.RU
  async getDictionaries() {
    try {
      const response = await axios.get(`${this.baseURL}/dictionaries`, {
        headers: {
          'User-Agent': this.userAgent
        }
      });

      return response.data;
    } catch (error) {
      console.error('HH API get dictionaries error:', error.response?.data || error.message);
      throw new Error(`Ошибка получения справочников: ${error.response?.data?.description || error.message}`);
    }
  }

  // Построение параметров поиска
  buildSearchParams(filters) {
    const params = {};

    // Текстовый поиск
    if (filters.keywords) {
      params.text = filters.keywords;
    }

    // Исключающие слова
    if (filters.excludeKeywords) {
      params.exclude_keywords = filters.excludeKeywords;
    }

    // Локация
    if (filters.areaIds && filters.areaIds.length > 0) {
      params.area = filters.areaIds.join(',');
    }

    // Зарплата
    if (filters.salary) {
      if (filters.salary.min) {
        params.salary = filters.salary.min;
      }
      if (filters.salary.currency) {
        params.currency = filters.salary.currency;
      }
    }

    // Опыт работы
    if (filters.experience) {
      params.experience = filters.experience;
    }

    // График работы
    if (filters.schedule) {
      params.schedule = filters.schedule;
    }

    // Тип занятости
    if (filters.employment) {
      params.employment = filters.employment;
    }

    // Специализации
    if (filters.specialization && filters.specialization.length > 0) {
      params.specialization = filters.specialization.join(',');
    }

    // Отрасли
    if (filters.industry && filters.industry.length > 0) {
      params.industry = filters.industry.join(',');
    }

    // Размер компании
    if (filters.companySize) {
      params.company_size = filters.companySize;
    }

    // Тип компании
    if (filters.companyType) {
      params.company_type = filters.companyType;
    }

    // Пагинация
    params.page = filters.page || 0;
    params.per_page = filters.perPage || 20;

    // Сортировка
    params.order_by = filters.orderBy || 'relevance';

    return params;
  }

  // Проверка лимитов откликов
  async checkResponseLimits(accessToken) {
    try {
      const userInfo = await this.getUserInfo(accessToken);
      const responses = await this.getUserResponses(accessToken, 0, 1);
      
      return {
        dailyLimit: userInfo.daily_responses_limit || 200,
        dailyUsed: userInfo.daily_responses_count || 0,
        totalResponses: responses.found || 0
      };
    } catch (error) {
      console.error('HH API check limits error:', error);
      return {
        dailyLimit: 200,
        dailyUsed: 0,
        totalResponses: 0
      };
    }
  }
}

module.exports = new HHService();
