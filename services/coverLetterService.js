const OpenAI = require('openai');

class CoverLetterService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Генерация сопроводительного письма с помощью ИИ
  async generateCoverLetter(vacancy, resume, userPreferences = {}) {
    try {
      const prompt = this.buildPrompt(vacancy, resume, userPreferences);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Ты профессиональный HR-консультант, который помогает соискателям писать эффективные сопроводительные письма. Письма должны быть персонализированными, профессиональными и убедительными."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const coverLetter = response.choices[0].message.content;
      
      return {
        success: true,
        coverLetter: this.formatCoverLetter(coverLetter),
        metadata: {
          model: "gpt-4",
          tokens: response.usage?.total_tokens || 0,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Ошибка генерации сопроводительного письма:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackCoverLetter(vacancy, resume)
      };
    }
  }

  // Построение промпта для ИИ
  buildPrompt(vacancy, resume, userPreferences) {
    const prompt = `
Создай персонализированное сопроводительное письмо для следующей вакансии:

ВАКАНСИЯ:
- Название: ${vacancy.title || 'Не указано'}
- Компания: ${vacancy.company?.name || 'Не указано'}
- Описание: ${vacancy.description?.substring(0, 500) || 'Не указано'}
- Требования: ${vacancy.requirements?.substring(0, 300) || 'Не указано'}
- Зарплата: ${this.formatSalary(vacancy.salary)}
- Опыт: ${vacancy.experience || 'Не указано'}
- График: ${vacancy.schedule || 'Не указано'}

РЕЗЮМЕ КАНДИДАТА:
- Имя: ${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}
- О себе: ${resume.summary || 'Не указано'}
- Опыт работы: ${this.formatExperience(resume.experience)}
- Навыки: ${resume.skills?.map(s => s.name).join(', ') || 'Не указано'}
- Образование: ${this.formatEducation(resume.education)}

ДОПОЛНИТЕЛЬНЫЕ ПРЕДПОЧТЕНИЯ:
- Тон письма: ${userPreferences.tone || 'профессиональный'}
- Длина: ${userPreferences.length || 'средняя'}
- Особые моменты: ${userPreferences.highlights || 'не указаны'}

ТРЕБОВАНИЯ К ПИСЬМУ:
1. Письмо должно быть персонализированным под конкретную вакансию
2. Подчеркни релевантный опыт и навыки
3. Покажи понимание специфики компании и роли
4. Используй профессиональный, но живой тон
5. Длина: 150-300 слов
6. Начни с обращения "Здравствуйте!"
7. Заверши подписью с именем кандидата

Создай сопроводительное письмо:`;

    return prompt;
  }

  // Форматирование зарплаты
  formatSalary(salary) {
    if (!salary) return 'Не указано';
    
    let result = '';
    if (salary.from) result += `от ${salary.from.toLocaleString()}`;
    if (salary.to) result += ` до ${salary.to.toLocaleString()}`;
    if (salary.currency) result += ` ${salary.currency}`;
    
    return result || 'Не указано';
  }

  // Форматирование опыта работы
  formatExperience(experience) {
    if (!experience || experience.length === 0) return 'Не указано';
    
    return experience.slice(0, 3).map(exp => 
      `${exp.position} в ${exp.company} (${exp.startDate ? new Date(exp.startDate).getFullYear() : '?'} - ${exp.current ? 'настоящее время' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '?')})`
    ).join('; ');
  }

  // Форматирование образования
  formatEducation(education) {
    if (!education || education.length === 0) return 'Не указано';
    
    return education.slice(0, 2).map(edu => 
      `${edu.specialization} в ${edu.institution} (${edu.yearOfGraduation || 'год не указан'})`
    ).join('; ');
  }

  // Форматирование письма
  formatCoverLetter(coverLetter) {
    // Убираем лишние пробелы и переносы
    return coverLetter
      .replace(/\n\s*\n/g, '\n\n') // Убираем лишние пустые строки
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .trim();
  }

  // Резервное письмо при ошибке ИИ
  generateFallbackCoverLetter(vacancy, resume) {
    return `Здравствуйте!

Меня заинтересовала вакансия "${vacancy.title}" в компании "${vacancy.company?.name}".

${resume.summary || 'Имею релевантный опыт работы и готов внести вклад в развитие вашей команды.'}

${resume.experience && resume.experience.length > 0 ? 
  `Мой опыт включает работу в следующих компаниях: ${resume.experience.slice(0, 2).map(exp => exp.company).join(', ')}.` : 
  ''
}

Буду рад возможности обсудить детали сотрудничества и ответить на ваши вопросы.

С уважением,
${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}`;
  }

  // Анализ и улучшение существующего письма
  async improveCoverLetter(coverLetter, vacancy, resume) {
    try {
      const prompt = `
Проанализируй и улучши следующее сопроводительное письмо:

ТЕКУЩЕЕ ПИСЬМО:
${coverLetter}

ВАКАНСИЯ:
- Название: ${vacancy.title || 'Не указано'}
- Компания: ${vacancy.company?.name || 'Не указано'}
- Описание: ${vacancy.description?.substring(0, 500) || 'Не указано'}
- Требования: ${vacancy.requirements?.substring(0, 300) || 'Не указано'}

РЕЗЮМЕ КАНДИДАТА:
- О себе: ${resume.summary || 'Не указано'}
- Опыт: ${this.formatExperience(resume.experience)}
- Навыки: ${resume.skills?.map(s => s.name).join(', ') || 'Не указано'}

ЗАДАЧИ:
1. Проанализируй текущее письмо
2. Предложи улучшения для лучшего соответствия вакансии
3. Подчеркни релевантные навыки и опыт
4. Сделай письмо более убедительным
5. Сохрани профессиональный тон

Верни улучшенную версию письма:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Ты профессиональный HR-консультант, который помогает улучшать сопроводительные письма."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return {
        success: true,
        improvedCoverLetter: this.formatCoverLetter(response.choices[0].message.content),
        metadata: {
          model: "gpt-4",
          tokens: response.usage?.total_tokens || 0,
          improvedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Ошибка улучшения письма:', error);
      return {
        success: false,
        error: error.message,
        originalCoverLetter: coverLetter
      };
    }
  }

  // Генерация шаблонов писем
  async generateTemplates(category = 'general') {
    const templates = {
      general: [
        {
          name: 'Стандартное письмо',
          template: `Здравствуйте!

Меня заинтересовала вакансия "{vacancy_title}" в компании "{company_name}".

{personal_summary}

{relevant_experience}

Буду рад возможности обсудить детали сотрудничества.

С уважением,
{first_name} {last_name}`
        },
        {
          name: 'Письмо с акцентом на достижения',
          template: `Здравствуйте!

Меня заинтересовала вакансия "{vacancy_title}" в компании "{company_name}".

{personal_summary}

{key_achievements}

Готов обсудить, как мой опыт может принести пользу вашей команде.

С уважением,
{first_name} {last_name}`
        }
      ],
      tech: [
        {
          name: 'Для IT-специалистов',
          template: `Здравствуйте!

Меня заинтересовала вакансия "{vacancy_title}" в компании "{company_name}".

{personal_summary}

{technical_skills}

{project_experience}

Буду рад обсудить технические детали и возможности сотрудничества.

С уважением,
{first_name} {last_name}`
        }
      ]
    };

    return templates[category] || templates.general;
  }

  // Замена плейсхолдеров в шаблоне
  replaceTemplatePlaceholders(template, data) {
    return template
      .replace(/{vacancy_title}/g, data.vacancy?.title || '')
      .replace(/{company_name}/g, data.vacancy?.company?.name || '')
      .replace(/{personal_summary}/g, data.resume?.summary || '')
      .replace(/{first_name}/g, data.resume?.personalInfo?.firstName || '')
      .replace(/{last_name}/g, data.resume?.personalInfo?.lastName || '')
      .replace(/{relevant_experience}/g, this.formatExperience(data.resume?.experience))
      .replace(/{technical_skills}/g, data.resume?.skills?.map(s => s.name).join(', ') || '')
      .replace(/{key_achievements}/g, this.formatAchievements(data.resume?.experience))
      .replace(/{project_experience}/g, this.formatProjects(data.resume?.portfolio));
  }

  // Форматирование достижений
  formatAchievements(experience) {
    if (!experience || experience.length === 0) return '';
    
    const achievements = experience
      .flatMap(exp => exp.achievements || [])
      .slice(0, 3);
    
    return achievements.length > 0 ? 
      `Ключевые достижения: ${achievements.join('; ')}.` : 
      '';
  }

  // Форматирование проектов
  formatProjects(portfolio) {
    if (!portfolio || portfolio.length === 0) return '';
    
    return portfolio.slice(0, 2).map(project => 
      `${project.title} (${project.technologies?.join(', ') || 'различные технологии'})`
    ).join('; ');
  }
}

module.exports = new CoverLetterService();
