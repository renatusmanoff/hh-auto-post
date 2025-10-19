const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const HHService = require('../services/hhService');
const ResumeImprovementService = require('../services/resumeImprovementService');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'));
    }
  }
});

// Получение статистики резюме пользователя
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [
      totalResumes,
      primaryResume,
      analyzedResumes,
      avgScore
    ] = await Promise.all([
      Resume.countDocuments({ userId }),
      Resume.findOne({ userId, isPrimary: true }),
      Resume.countDocuments({ userId, 'aiAnalysis.score': { $exists: true } }),
      Resume.aggregate([
        { $match: { userId, 'aiAnalysis.score': { $exists: true } } },
        { $group: { _id: null, avgScore: { $avg: '$aiAnalysis.score' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalResumes,
        hasPrimaryResume: !!primaryResume,
        analyzedResumes,
        avgScore: avgScore[0]?.avgScore || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get resume stats',
      error: error.message
    });
  }
});

// Получение всех резюме пользователя
router.get('/', async (req, res) => {
  try {
    // Для тестового пользователя пытаемся получить реальное резюме из HH.RU
    if (req.user.email === 'test@example.com' && req.user.accessToken) {
      try {
        const HHService = require('../services/hhService');
        const resumes = await HHService.getUserResumes(req.user.accessToken);
        
        if (resumes && resumes.length > 0) {
          // Сохраняем резюме в базу данных
          const savedResumes = [];
          for (const resumeData of resumes) {
            let resume = await Resume.findOne({ 
              userId: req.user._id, 
              hhResumeId: resumeData.id 
            });
            
            if (!resume) {
              resume = new Resume({
                userId: req.user._id,
                title: resumeData.title,
                source: 'hh',
                hhResumeId: resumeData.id,
                content: resumeData,
                isPrimary: resumeData.isPrimary || false,
                isActive: true
              });
              await resume.save();
            }
            
            savedResumes.push(resume);
          }
          
          return res.json(savedResumes);
        }
      } catch (hhError) {
        console.log('Ошибка получения резюме из HH.RU:', hhError.message);
      }
    }

    // Если нет токена или ошибка, возвращаем моковое резюме
    if (req.user.email === 'test@example.com') {
      const mockResume = {
        _id: 'mock-resume-1',
        userId: req.user._id,
        title: 'Frontend разработчик (React, JavaScript)',
        source: 'hh',
        hhResumeId: 'mock-hh-resume-123',
        content: {
          personalInfo: {
            firstName: 'Тест',
            lastName: 'Пользователь',
            email: 'test@example.com',
            phone: '+7 (999) 123-45-67',
            location: 'Москва'
          },
          experience: [
            {
              company: 'ТехКомпания',
              position: 'Frontend разработчик',
              period: '2022 - настоящее время',
              description: 'Разработка пользовательских интерфейсов на React, TypeScript, работа с API'
            },
            {
              company: 'Стартап',
              position: 'JavaScript разработчик',
              period: '2020 - 2022',
              description: 'Разработка веб-приложений, работа с Vue.js и Node.js'
            }
          ],
          education: [
            {
              institution: 'МГУ',
              degree: 'Бакалавр информатики',
              year: '2020'
            }
          ],
          skills: ['React', 'JavaScript', 'TypeScript', 'Vue.js', 'Node.js', 'HTML', 'CSS', 'Git'],
          languages: [
            { name: 'Русский', level: 'Родной' },
            { name: 'Английский', level: 'Продвинутый' }
          ]
        },
        isPrimary: true,
        isActive: true,
        aiAnalysis: {
          score: 85,
          suggestions: [
            'Добавить больше конкретных достижений с цифрами',
            'Указать используемые технологии более детально',
            'Добавить ссылки на портфолио проектов'
          ],
          analyzedAt: new Date()
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
      
      return res.json([mockResume]);
    }

    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(resumes);
  } catch (error) {
    console.error('Ошибка получения резюме:', error);
    res.status(500).json({ message: 'Ошибка получения резюме', error: error.message });
  }
});

// Получение резюме по ID
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Ошибка получения резюме:', error);
    res.status(500).json({ message: 'Ошибка получения резюме', error: error.message });
  }
});

// Создание нового резюме
router.post('/', async (req, res) => {
  try {
    const resumeData = {
      userId: req.user._id,
      ...req.body
    };

    const resume = new Resume(resumeData);
    await resume.save();

    res.status(201).json(resume);
  } catch (error) {
    console.error('Ошибка создания резюме:', error);
    res.status(500).json({ message: 'Ошибка создания резюме', error: error.message });
  }
});

// Обновление резюме
router.put('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    // Обновляем поля
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        resume[key] = req.body[key];
      }
    });

    resume.lastUpdated = new Date();
    await resume.save();

    res.json(resume);
  } catch (error) {
    console.error('Ошибка обновления резюме:', error);
    res.status(500).json({ message: 'Ошибка обновления резюме', error: error.message });
  }
});

// Удаление резюме
router.delete('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.json({ message: 'Резюме удалено' });
  } catch (error) {
    console.error('Ошибка удаления резюме:', error);
    res.status(500).json({ message: 'Ошибка удаления резюме', error: error.message });
  }
});

// Загрузка файла резюме
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const resume = new Resume({
      userId: req.user._id,
      title: req.body.title || req.file.originalname,
      source: 'uploaded',
      files: [{
        name: req.file.originalname,
        url: `/uploads/resumes/${req.file.filename}`,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      }]
    });

    await resume.save();

    res.status(201).json(resume);
  } catch (error) {
    console.error('Ошибка загрузки резюме:', error);
    res.status(500).json({ message: 'Ошибка загрузки резюме', error: error.message });
  }
});

// Импорт резюме с HH.RU
router.post('/import-hh', async (req, res) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: 'ID резюме обязателен' });
    }

    // Получаем резюме с HH.RU
    const hhResume = await HHService.getResumeDetails(resumeId, req.user.accessToken);

    // Создаем резюме в нашей системе
    const resume = new Resume({
      userId: req.user._id,
      title: hhResume.title || 'Резюме с HH.RU',
      summary: hhResume.summary,
      personalInfo: {
        firstName: hhResume.first_name,
        lastName: hhResume.last_name,
        middleName: hhResume.middle_name,
        birthDate: hhResume.birth_date,
        gender: hhResume.gender?.id,
        citizenship: hhResume.citizenship?.map(c => c.name).join(', '),
        workPermit: hhResume.work_permit?.map(w => w.name).join(', '),
        phone: hhResume.phone?.number,
        email: hhResume.email?.email,
        site: hhResume.site?.url,
        skype: hhResume.skype?.skype,
        telegram: hhResume.telegram?.telegram
      },
      experience: hhResume.experience?.map(exp => ({
        position: exp.position,
        company: exp.company,
        description: exp.description,
        startDate: exp.start_date,
        endDate: exp.end_date,
        current: !exp.end_date,
        achievements: exp.achievements?.map(a => a.value),
        skills: exp.skills?.map(s => s.name)
      })),
      education: hhResume.education?.map(edu => ({
        institution: edu.name,
        faculty: edu.faculty?.name,
        specialization: edu.specialization?.name,
        yearOfGraduation: edu.year,
        degree: edu.level?.name
      })),
      skills: hhResume.skills?.map(skill => ({
        name: skill.name,
        level: skill.level?.name || 'intermediate'
      })),
      languages: hhResume.language?.map(lang => ({
        name: lang.name,
        level: lang.level?.name || 'B2'
      })),
      source: 'hh_import',
      hhResumeId: resumeId
    });

    await resume.save();

    res.status(201).json(resume);
  } catch (error) {
    console.error('Ошибка импорта резюме:', error);
    res.status(500).json({ message: 'Ошибка импорта резюме', error: error.message });
  }
});

// Получение резюме пользователя с HH.RU
router.get('/hh/list', async (req, res) => {
  try {
    const hhResumes = await HHService.getUserResumes(req.user.accessToken);
    res.json(hhResumes);
  } catch (error) {
    console.error('Ошибка получения резюме с HH.RU:', error);
    res.status(500).json({ message: 'Ошибка получения резюме с HH.RU', error: error.message });
  }
});

// Анализ резюме с помощью ИИ
router.post('/:id/analyze', async (req, res) => {
  try {
    const { targetPosition } = req.body;
    
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    const result = await ResumeImprovementService.analyzeResume(resume, targetPosition);

    if (result.success) {
      // Сохраняем анализ в резюме
      resume.aiAnalysis = {
        score: result.analysis.overallScore,
        recommendations: result.analysis.recommendations.split('\n').filter(r => r.trim()),
        keywords: result.analysis.keywords,
        lastAnalyzed: new Date()
      };
      await resume.save();

      res.json({
        analysis: result.analysis,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({ 
        message: 'Ошибка анализа резюме', 
        error: result.error,
        fallback: result.fallback 
      });
    }
  } catch (error) {
    console.error('Ошибка анализа резюме:', error);
    res.status(500).json({ message: 'Ошибка анализа резюме', error: error.message });
  }
});

// Улучшение раздела резюме
router.post('/:id/improve-section', async (req, res) => {
  try {
    const { section, targetPosition } = req.body;
    
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    const result = await ResumeImprovementService.improveSection(resume, section, targetPosition);

    if (result.success) {
      res.json({
        improvedSection: result.improvedSection,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({ 
        message: 'Ошибка улучшения раздела', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Ошибка улучшения раздела:', error);
    res.status(500).json({ message: 'Ошибка улучшения раздела', error: error.message });
  }
});

// ATS-оптимизация резюме
router.post('/:id/optimize-ats', async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    const result = await ResumeImprovementService.optimizeForATS(resume, jobDescription);

    if (result.success) {
      res.json({
        optimizedResume: result.optimizedResume,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({ 
        message: 'Ошибка ATS-оптимизации', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Ошибка ATS-оптимизации:', error);
    res.status(500).json({ message: 'Ошибка ATS-оптимизации', error: error.message });
  }
});

// Установка основного резюме
router.put('/:id/set-primary', async (req, res) => {
  try {
    // Снимаем флаг основного со всех резюме пользователя
    await Resume.updateMany(
      { userId: req.user._id },
      { isPrimary: false }
    );

    // Устанавливаем основное резюме
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isPrimary: true },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    res.json({ message: 'Основное резюме установлено', resume });
  } catch (error) {
    console.error('Ошибка установки основного резюме:', error);
    res.status(500).json({ message: 'Ошибка установки основного резюме', error: error.message });
  }
});

// Получение статистики резюме
router.get('/:id/stats', async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    // Получаем статистику откликов с этим резюме
    const Response = require('../models/Response');
    const responseStats = await Response.aggregate([
      { $match: { resumeId: resume._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      viewsCount: resume.viewsCount,
      responsesCount: resume.responsesCount,
      invitationsCount: resume.invitationsCount,
      responseBreakdown: responseStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      aiScore: resume.aiAnalysis?.score || 0,
      lastAnalyzed: resume.aiAnalysis?.lastAnalyzed
    };

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики резюме:', error);
    res.status(500).json({ message: 'Ошибка получения статистики резюме', error: error.message });
  }
});

module.exports = router;
