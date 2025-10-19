const OpenAI = require('openai');

class ResumeImprovementService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Анализ резюме с помощью ИИ
  async analyzeResume(resume, targetPosition = null) {
    try {
      const prompt = this.buildAnalysisPrompt(resume, targetPosition);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Ты профессиональный HR-консультант и карьерный коуч с 15-летним опытом. Твоя задача - проанализировать резюме и дать конкретные рекомендации по улучшению."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const analysis = response.choices[0].message.content;
      
      return {
        success: true,
        analysis: this.parseAnalysis(analysis),
        score: this.calculateScore(resume),
        metadata: {
          model: "gpt-4",
          tokens: response.usage?.total_tokens || 0,
          analyzedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Ошибка анализа резюме:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackAnalysis(resume)
      };
    }
  }

  // Построение промпта для анализа
  buildAnalysisPrompt(resume, targetPosition) {
    const prompt = `
Проанализируй следующее резюме и дай детальную оценку:

ИНФОРМАЦИЯ О КАНДИДАТЕ:
- Имя: ${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}
- О себе: ${resume.summary || 'Не указано'}

ОПЫТ РАБОТЫ:
${this.formatExperience(resume.experience)}

ОБРАЗОВАНИЕ:
${this.formatEducation(resume.education)}

НАВЫКИ:
${resume.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'Не указано'}

ЯЗЫКИ:
${resume.languages?.map(l => `${l.name} (${l.level})`).join(', ') || 'Не указано'}

СЕРТИФИКАТЫ:
${resume.certificates?.map(c => c.name).join(', ') || 'Не указано'}

ПОРТФОЛИО:
${resume.portfolio?.map(p => p.title).join(', ') || 'Не указано'}

ЦЕЛЕВАЯ ПОЗИЦИЯ: ${targetPosition || 'Не указана'}

ЗАДАЧИ АНАЛИЗА:
1. Оцени резюме по шкале от 1 до 100
2. Выяви сильные стороны
3. Определи слабые места и области для улучшения
4. Дай конкретные рекомендации по каждому разделу
5. Предложи ключевые слова для ATS-систем
6. Оцени соответствие целевой позиции

ФОРМАТ ОТВЕТА:
ОБЩАЯ ОЦЕНКА: [число от 1 до 100]

СИЛЬНЫЕ СТОРОНЫ:
- [список сильных сторон]

СЛАБЫЕ МЕСТА:
- [список проблем]

РЕКОМЕНДАЦИИ:
1. [конкретная рекомендация]
2. [конкретная рекомендация]
...

КЛЮЧЕВЫЕ СЛОВА:
[список ключевых слов через запятую]

СООТВЕТСТВИЕ ПОЗИЦИИ:
[оценка соответствия целевой позиции]

Дай детальный анализ:`;

    return prompt;
  }

  // Форматирование опыта работы
  formatExperience(experience) {
    if (!experience || experience.length === 0) return 'Опыт работы не указан';
    
    return experience.map((exp, index) => `
${index + 1}. ${exp.position} в ${exp.company}
   Период: ${exp.startDate ? new Date(exp.startDate).getFullYear() : '?'} - ${exp.current ? 'настоящее время' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '?')}
   Описание: ${exp.description || 'Не указано'}
   Достижения: ${exp.achievements?.join('; ') || 'Не указано'}
   Навыки: ${exp.skills?.join(', ') || 'Не указано'}
`).join('\n');
  }

  // Форматирование образования
  formatEducation(education) {
    if (!education || education.length === 0) return 'Образование не указано';
    
    return education.map((edu, index) => `
${index + 1}. ${edu.specialization} в ${edu.institution}
   Год окончания: ${edu.yearOfGraduation || 'Не указан'}
   Степень: ${edu.degree || 'Не указана'}
`).join('\n');
  }

  // Парсинг анализа от ИИ
  parseAnalysis(analysis) {
    const sections = {
      overallScore: this.extractScore(analysis),
      strengths: this.extractSection(analysis, 'СИЛЬНЫЕ СТОРОНЫ'),
      weaknesses: this.extractSection(analysis, 'СЛАБЫЕ МЕСТА'),
      recommendations: this.extractSection(analysis, 'РЕКОМЕНДАЦИИ'),
      keywords: this.extractKeywords(analysis),
      positionMatch: this.extractSection(analysis, 'СООТВЕТСТВИЕ ПОЗИЦИИ')
    };

    return sections;
  }

  // Извлечение оценки
  extractScore(text) {
    const match = text.match(/ОБЩАЯ ОЦЕНКА:\s*(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  // Извлечение секции
  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n[A-ZА-Я]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  // Извлечение ключевых слов
  extractKeywords(text) {
    const keywordsSection = this.extractSection(text, 'КЛЮЧЕВЫЕ СЛОВА');
    return keywordsSection.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  // Расчет базового балла
  calculateScore(resume) {
    let score = 0;
    
    // Базовые проверки
    if (resume.summary && resume.summary.length > 50) score += 10;
    if (resume.experience && resume.experience.length > 0) score += 20;
    if (resume.education && resume.education.length > 0) score += 10;
    if (resume.skills && resume.skills.length > 3) score += 15;
    if (resume.languages && resume.languages.length > 0) score += 5;
    
    // Качество описаний
    if (resume.experience) {
      resume.experience.forEach(exp => {
        if (exp.description && exp.description.length > 50) score += 5;
        if (exp.achievements && exp.achievements.length > 0) score += 5;
      });
    }
    
    // Дополнительные элементы
    if (resume.certificates && resume.certificates.length > 0) score += 5;
    if (resume.portfolio && resume.portfolio.length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  // Резервный анализ при ошибке ИИ
  generateFallbackAnalysis(resume) {
    const score = this.calculateScore(resume);
    
    return {
      overallScore: score,
      strengths: this.generateFallbackStrengths(resume),
      weaknesses: this.generateFallbackWeaknesses(resume),
      recommendations: this.generateFallbackRecommendations(resume),
      keywords: this.generateFallbackKeywords(resume),
      positionMatch: 'Требуется ручная оценка соответствия позиции'
    };
  }

  // Генерация сильных сторон
  generateFallbackStrengths(resume) {
    const strengths = [];
    
    if (resume.experience && resume.experience.length > 0) {
      strengths.push('Есть опыт работы');
    }
    if (resume.education && resume.education.length > 0) {
      strengths.push('Указано образование');
    }
    if (resume.skills && resume.skills.length > 3) {
      strengths.push('Хороший набор навыков');
    }
    if (resume.languages && resume.languages.length > 0) {
      strengths.push('Знание иностранных языков');
    }
    
    return strengths.join('\n- ');
  }

  // Генерация слабых мест
  generateFallbackWeaknesses(resume) {
    const weaknesses = [];
    
    if (!resume.summary || resume.summary.length < 50) {
      weaknesses.push('Слабое описание в разделе "О себе"');
    }
    if (!resume.experience || resume.experience.length === 0) {
      weaknesses.push('Отсутствует опыт работы');
    }
    if (!resume.skills || resume.skills.length < 3) {
      weaknesses.push('Недостаточно навыков');
    }
    if (!resume.certificates || resume.certificates.length === 0) {
      weaknesses.push('Нет сертификатов');
    }
    
    return weaknesses.join('\n- ');
  }

  // Генерация рекомендаций
  generateFallbackRecommendations(resume) {
    const recommendations = [];
    
    if (!resume.summary || resume.summary.length < 50) {
      recommendations.push('Добавьте подробное описание в раздел "О себе"');
    }
    if (resume.experience) {
      resume.experience.forEach((exp, index) => {
        if (!exp.description || exp.description.length < 50) {
          recommendations.push(`Добавьте описание обязанностей для позиции ${index + 1}`);
        }
        if (!exp.achievements || exp.achievements.length === 0) {
          recommendations.push(`Добавьте достижения для позиции ${index + 1}`);
        }
      });
    }
    if (!resume.certificates || resume.certificates.length === 0) {
      recommendations.push('Добавьте сертификаты и курсы');
    }
    
    return recommendations.join('\n');
  }

  // Генерация ключевых слов
  generateFallbackKeywords(resume) {
    const keywords = [];
    
    if (resume.skills) {
      keywords.push(...resume.skills.map(s => s.name));
    }
    if (resume.experience) {
      resume.experience.forEach(exp => {
        if (exp.skills) {
          keywords.push(...exp.skills);
        }
      });
    }
    
    return [...new Set(keywords)]; // Убираем дубликаты
  }

  // Улучшение конкретного раздела резюме
  async improveSection(resume, section, targetPosition = null) {
    try {
      const prompt = this.buildSectionImprovementPrompt(resume, section, targetPosition);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Ты профессиональный HR-консультант, который помогает улучшать конкретные разделы резюме."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return {
        success: true,
        improvedSection: response.choices[0].message.content,
        metadata: {
          model: "gpt-4",
          tokens: response.usage?.total_tokens || 0,
          improvedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Ошибка улучшения раздела:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Построение промпта для улучшения раздела
  buildSectionImprovementPrompt(resume, section, targetPosition) {
    const sectionData = resume[section];
    
    const prompt = `
Улучши следующий раздел резюме:

РАЗДЕЛ: ${section.toUpperCase()}

ТЕКУЩЕЕ СОДЕРЖАНИЕ:
${JSON.stringify(sectionData, null, 2)}

ЦЕЛЕВАЯ ПОЗИЦИЯ: ${targetPosition || 'Не указана'}

ОБЩАЯ ИНФОРМАЦИЯ О КАНДИДАТЕ:
- Опыт работы: ${resume.experience?.length || 0} позиций
- Навыки: ${resume.skills?.map(s => s.name).join(', ') || 'Не указано'}
- Образование: ${resume.education?.map(e => e.specialization).join(', ') || 'Не указано'}

ЗАДАЧИ:
1. Проанализируй текущее содержание раздела
2. Предложи улучшенную версию
3. Добавь недостающие элементы
4. Сделай текст более убедительным и профессиональным
5. Адаптируй под целевую позицию

Верни улучшенную версию раздела в том же формате:`;

    return prompt;
  }

  // Генерация ATS-оптимизированного резюме
  async optimizeForATS(resume, jobDescription) {
    try {
      const prompt = `
Оптимизируй резюме для прохождения ATS-систем:

РЕЗЮМЕ:
${JSON.stringify(resume, null, 2)}

ОПИСАНИЕ ВАКАНСИИ:
${jobDescription}

ЗАДАЧИ:
1. Извлеки ключевые слова из описания вакансии
2. Добавь их в соответствующие разделы резюме
3. Оптимизируй форматирование для ATS
4. Сохрани читаемость для людей
5. Убери избыточную информацию

Верни оптимизированное резюме:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Ты эксперт по ATS-оптимизации резюме. Твоя задача - сделать резюме максимально проходимым через автоматические системы отбора."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      });

      return {
        success: true,
        optimizedResume: JSON.parse(response.choices[0].message.content),
        metadata: {
          model: "gpt-4",
          tokens: response.usage?.total_tokens || 0,
          optimizedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Ошибка ATS-оптимизации:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ResumeImprovementService();
