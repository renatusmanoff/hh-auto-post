const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Генерация сопроводительного письма
router.post('/cover-letter', requireAuth, async (req, res) => {
  try {
    const { vacancyTitle, companyName, vacancyDescription, vacancyRequirements, customPrompt } = req.body;
    
    if (!vacancyTitle || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Vacancy title and company name are required'
      });
    }
    
    // Формируем промпт для генерации сопроводительного письма
    const userInfo = `
Имя: ${req.user.firstName} ${req.user.lastName}
О себе: ${req.user.resume.aboutMe || 'Не указано'}
Навыки: ${req.user.resume.skills?.join(', ') || 'Не указаны'}
Опыт работы: ${req.user.resume.experience?.map(exp => 
  `${exp.position} в ${exp.company} (${exp.startDate ? exp.startDate.getFullYear() : 'н/д'} - ${exp.endDate ? exp.endDate.getFullYear() : 'н/д'})`
).join(', ') || 'Не указан'}
Образование: ${req.user.resume.education?.map(edu => 
  `${edu.degree} в ${edu.institution}`
).join(', ') || 'Не указано'}
Портфолио: ${req.user.resume.portfolioUrl || 'Не указано'}
`;

    const systemPrompt = `Ты профессиональный HR-консультант и эксперт по написанию сопроводительных писем. 
Твоя задача - создать персонализированное сопроводительное письмо для конкретной вакансии.

Требования к письму:
1. Длина: 150-300 слов
2. Тон: профессиональный, но дружелюбный
3. Структура: приветствие, краткое представление, соответствие требованиям, мотивация, завершение
4. Персонализация: используй конкретные навыки и опыт кандидата
5. Акцент на ценности: покажи, как кандидат может принести пользу компании
6. Избегай клише и шаблонных фраз

Письмо должно быть на русском языке, если не указано иное.`;

    const userPrompt = customPrompt || `
Создай сопроводительное письмо для следующей вакансии:

Должность: ${vacancyTitle}
Компания: ${companyName}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ''}
${vacancyRequirements ? `Требования: ${vacancyRequirements}` : ''}

Информация о кандидате:
${userInfo}

Письмо должно быть персонализированным, профессиональным и убедительным.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const coverLetter = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      coverLetter,
      usage: completion.usage
    });
    
  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cover letter',
      error: error.message
    });
  }
});

// Генерация сопроводительного письма на основе шаблона
router.post('/cover-letter/template', requireAuth, async (req, res) => {
  try {
    const { templateType, vacancyTitle, companyName, vacancyDescription } = req.body;
    
    const templates = {
      'junior': 'Создай сопроводительное письмо для junior-позиции. Акцент на мотивации к обучению и развитию.',
      'middle': 'Создай сопроводительное письмо для middle-позиции. Акцент на опыте и конкретных достижениях.',
      'senior': 'Создай сопроводительное письмо для senior-позиции. Акцент на лидерстве и экспертизе.',
      'manager': 'Создай сопроводительное письмо для управленческой позиции. Акцент на опыте управления командой.',
      'creative': 'Создай креативное сопроводительное письмо. Можно использовать нестандартный подход.',
      'formal': 'Создай формальное сопроводительное письмо в деловом стиле.'
    };
    
    const templatePrompt = templates[templateType] || templates['middle'];
    
    const userInfo = `
Имя: ${req.user.firstName} ${req.user.lastName}
О себе: ${req.user.resume.aboutMe || 'Не указано'}
Навыки: ${req.user.resume.skills?.join(', ') || 'Не указаны'}
Опыт работы: ${req.user.resume.experience?.map(exp => 
  `${exp.position} в ${exp.company} (${exp.startDate ? exp.startDate.getFullYear() : 'н/д'} - ${exp.endDate ? exp.endDate.getFullYear() : 'н/д'})`
).join(', ') || 'Не указан'}
`;

    const prompt = `${templatePrompt}

Должность: ${vacancyTitle}
Компания: ${companyName}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ''}

Информация о кандидате:
${userInfo}

Создай персонализированное сопроводительное письмо на основе этого шаблона.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });
    
    const coverLetter = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      coverLetter,
      templateType
    });
    
  } catch (error) {
    console.error('Template cover letter generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template cover letter',
      error: error.message
    });
  }
});

// ИИ ассистент для онбординга
router.post('/assistant', requireAuth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    const systemPrompt = `Ты - ИИ ассистент сервиса HH Finder, который помогает пользователям с автоматическим откликом на вакансии в HH.RU.

Твоя роль:
- Помогать пользователям настроить профиль и резюме
- Объяснять, как работает автоматический поиск и отклик на вакансии
- Давать советы по оптимизации сопроводительных писем
- Помогать с настройкой фильтров поиска
- Отвечать на вопросы о тарифных планах и возможностях сервиса

Контекст пользователя:
- Имя: ${req.user.firstName} ${req.user.lastName}
- Тарифный план: ${req.user.subscription.plan}
- Статус профиля: ${req.user.resume.aboutMe ? 'Заполнен' : 'Не заполнен'}
- Количество откликов: ${req.user.subscription.responsesUsed}/${req.user.subscription.responsesLimit}

Будь дружелюбным, полезным и конкретным в советах. Отвечай на русском языке.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      response,
      context: {
        userPlan: req.user.subscription.plan,
        profileComplete: !!req.user.resume.aboutMe,
        responsesUsed: req.user.subscription.responsesUsed,
        responsesLimit: req.user.subscription.responsesLimit
      }
    });
    
  } catch (error) {
    console.error('AI assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI assistant response',
      error: error.message
    });
  }
});

// Анализ резюме и рекомендации по улучшению
router.post('/resume-analysis', requireAuth, async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }
    
    const prompt = `Проанализируй это резюме и дай рекомендации по улучшению:

${resumeText}

Дай анализ по следующим аспектам:
1. Структура и оформление
2. Полнота информации
3. Ключевые слова и SEO
4. Опыт работы и достижения
5. Навыки и компетенции
6. Общие рекомендации

Будь конкретным и дай практические советы.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.5,
    });
    
    const analysis = completion.choices[0].message.content.trim();
    
    res.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error.message
    });
  }
});

// Генерация ключевых слов для поиска вакансий
router.post('/keywords', requireAuth, async (req, res) => {
  try {
    const { position, skills, experience } = req.body;
    
    if (!position) {
      return res.status(400).json({
        success: false,
        message: 'Position is required'
      });
    }
    
    const prompt = `Сгенерируй ключевые слова для поиска вакансий по позиции "${position}".

Дополнительная информация:
${skills ? `Навыки: ${skills}` : ''}
${experience ? `Опыт: ${experience}` : ''}

Верни список из 10-15 ключевых слов и фраз, которые помогут найти релевантные вакансии.
Включи синонимы, связанные термины и популярные названия должностей в этой области.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const keywordsText = completion.choices[0].message.content.trim();
    const keywords = keywordsText.split('\n').map(k => k.replace(/^\d+\.\s*/, '').trim()).filter(k => k);
    
    res.json({
      success: true,
      keywords,
      keywordsText
    });
    
  } catch (error) {
    console.error('Keywords generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate keywords',
      error: error.message
    });
  }
});

module.exports = router;
