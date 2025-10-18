const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const Response = require('../models/Response');
const Search = require('../models/Search');
const Vacancy = require('../models/Vacancy');

// Middleware для проверки авторизации и админских прав
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};

// Получение общей статистики
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalPayments,
      totalRevenue,
      totalResponses,
      totalSearches,
      recentUsers,
      recentPayments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'subscription.isActive': true }),
      Payment.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Response.countDocuments(),
      Search.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('firstName lastName email subscription createdAt'),
      Payment.find({ status: 'completed' }).sort({ completedAt: -1 }).limit(10).populate('userId', 'firstName lastName email')
    ]);
    
    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          recent: recentUsers
        },
        payments: {
          total: totalPayments,
          revenue: totalRevenue[0]?.total || 0,
          recent: recentPayments
        },
        activity: {
          totalResponses,
          totalSearches
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get admin stats',
      error: error.message
    });
  }
});

// Получение списка пользователей
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 0, perPage = 20, search, plan, status } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (plan) {
      filter['subscription.plan'] = plan;
    }
    
    if (status === 'active') {
      filter['subscription.isActive'] = true;
      filter['subscription.endDate'] = { $gt: new Date() };
    } else if (status === 'inactive') {
      filter.$or = [
        { 'subscription.isActive': false },
        { 'subscription.endDate': { $lte: new Date() } }
      ];
    }
    
    const users = await User.find(filter)
      .select('firstName lastName email subscription createdAt lastLogin isActive')
      .sort({ createdAt: -1 })
      .skip(page * perPage)
      .limit(parseInt(perPage));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      pages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Получение детальной информации о пользователе
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const [responses, searches, payments] = await Promise.all([
      Response.find({ userId: user._id }).populate('vacancyId').sort({ createdAt: -1 }).limit(20),
      Search.find({ userId: user._id }).sort({ createdAt: -1 }),
      Payment.find({ userId: user._id }).sort({ createdAt: -1 })
    ]);
    
    res.json({
      success: true,
      user,
      activity: {
        responses,
        searches,
        payments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user details',
      error: error.message
    });
  }
});

// Обновление пользователя
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, subscription, isActive, isAdmin } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (subscription) {
      user.subscription = { ...user.subscription, ...subscription };
    }
    if (isActive !== undefined) user.isActive = isActive;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Блокировка/разблокировка пользователя
router.post('/users/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
});

// Получение списка платежей
router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const { page = 0, perPage = 20, status, plan } = req.query;
    
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (plan) {
      filter.plan = plan;
    }
    
    const payments = await Payment.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(page * perPage)
      .limit(parseInt(perPage));
    
    const total = await Payment.countDocuments(filter);
    
    res.json({
      success: true,
      payments,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      pages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
});

// Получение статистики по откликам
router.get('/responses/stats', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }
    
    const [
      totalResponses,
      responsesByStatus,
      responsesByDay,
      topCompanies
    ] = await Promise.all([
      Response.countDocuments(dateFilter),
      Response.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Response.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Response.aggregate([
        { $match: dateFilter },
        { $lookup: { from: 'vacancies', localField: 'vacancyId', foreignField: '_id', as: 'vacancy' } },
        { $unwind: '$vacancy' },
        { $group: { _id: '$vacancy.company.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    res.json({
      success: true,
      stats: {
        totalResponses,
        responsesByStatus,
        responsesByDay,
        topCompanies
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get response stats',
      error: error.message
    });
  }
});

// Получение списка откликов
router.get('/responses', requireAdmin, async (req, res) => {
  try {
    const { page = 0, perPage = 20, status, userId } = req.query;
    
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = userId;
    }
    
    const responses = await Response.find(filter)
      .populate('userId', 'firstName lastName email')
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

// Получение списка вакансий
router.get('/vacancies', requireAdmin, async (req, res) => {
  try {
    const { page = 0, perPage = 20, search, isActive } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const vacancies = await Vacancy.find(filter)
      .sort({ createdAt: -1 })
      .skip(page * perPage)
      .limit(parseInt(perPage));
    
    const total = await Vacancy.countDocuments(filter);
    
    res.json({
      success: true,
      vacancies,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      pages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get vacancies',
      error: error.message
    });
  }
});

// Получение списка поисков
router.get('/searches', requireAdmin, async (req, res) => {
  try {
    const { page = 0, perPage = 20, userId, isActive } = req.query;
    
    const filter = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const searches = await Search.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(page * perPage)
      .limit(parseInt(perPage));
    
    const total = await Search.countDocuments(filter);
    
    res.json({
      success: true,
      searches,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      pages: Math.ceil(total / perPage)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get searches',
      error: error.message
    });
  }
});

// Создание админа
router.post('/create-admin', requireAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name and last name are required'
      });
    }
    
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      existingUser.isAdmin = true;
      await existingUser.save();
      
      res.json({
        success: true,
        message: 'User promoted to admin',
        user: existingUser
      });
    } else {
      const newAdmin = new User({
        email,
        firstName,
        lastName,
        isAdmin: true,
        subscription: {
          plan: 'premium',
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          responsesLimit: 10000
        }
      });
      
      await newAdmin.save();
      
      res.json({
        success: true,
        message: 'Admin user created',
        user: newAdmin
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message
    });
  }
});

module.exports = router;
