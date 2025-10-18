const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const axios = require('axios');
const User = require('../models/User');

// HH.RU OAuth Strategy
passport.use('hh', new OAuth2Strategy({
  authorizationURL: 'https://hh.ru/oauth/authorize',
  tokenURL: 'https://hh.ru/oauth/token',
  clientID: process.env.HH_CLIENT_ID,
  clientSecret: process.env.HH_CLIENT_SECRET,
  callbackURL: process.env.HH_REDIRECT_URI,
  scope: 'read:user read:resumes write:applications'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Получаем информацию о пользователе из HH.RU API
    const userResponse = await axios.get('https://api.hh.ru/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'HH-Finder/1.0'
      }
    });

    const hhUser = userResponse.data;
    
    // Ищем существующего пользователя или создаем нового
    let user = await User.findOne({ hhId: hhUser.id });
    
    if (!user) {
      // Получаем резюме пользователя
      const resumesResponse = await axios.get('https://api.hh.ru/resumes/mine', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'HH-Finder/1.0'
        }
      });

      const resumes = resumesResponse.data.items || [];
      const primaryResume = resumes.find(r => r.status.id === 'published') || resumes[0];

      user = new User({
        hhId: hhUser.id,
        email: hhUser.email,
        firstName: hhUser.first_name,
        lastName: hhUser.last_name,
        phone: hhUser.phone?.number,
        avatar: hhUser.photo?.url,
        resume: {
          hhResumeId: primaryResume?.id,
          aboutMe: primaryResume?.description,
          skills: primaryResume?.skills?.map(s => s.name) || []
        },
        subscription: {
          plan: 'free',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          responsesLimit: 50 // HH.RU free limit
        }
      });

      await user.save();
    } else {
      // Обновляем информацию о пользователе
      user.firstName = hhUser.first_name;
      user.lastName = hhUser.last_name;
      user.phone = hhUser.phone?.number;
      user.avatar = hhUser.photo?.url;
      user.lastLogin = new Date();
      await user.save();
    }

    // Сохраняем токен доступа в сессии
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;

    return done(null, user);
  } catch (error) {
    console.error('HH OAuth error:', error);
    return done(error, null);
  }
}));

// Сериализация пользователя для сессии
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Десериализация пользователя из сессии
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
