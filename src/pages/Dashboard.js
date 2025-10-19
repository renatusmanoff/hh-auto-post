import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Send,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Zap,
  FileText,
  Bell,
  Settings,
  CreditCard,
  User,
  LogOut,
  Play,
  Pause,
  Sparkles,
  ArrowRight,
  Star,
  Award,
  Activity,
  Briefcase,
  MapPin,
  DollarSign,
  Building
} from 'lucide-react';

const Dashboard = () => {
  const { user, checkAuthStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Проверяем параметр авторизации
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('auth') === 'success') {
      checkAuthStatus();
      window.history.replaceState({}, document.title, '/dashboard');
    }
  }, [location.search, checkAuthStatus]);

  // Получение статистики
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/user/stats', {
        withCredentials: true
      });
      return response.data;
    }
  );

  // Получение активных поисков
  const { data: searches } = useQuery(
    'active-searches',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/searches?status=active', {
        withCredentials: true
      });
      return response.data;
    }
  );

  // Получение последних откликов
  const { data: recentResponsesData } = useQuery(
    'recent-responses',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/responses?limit=5', {
        withCredentials: true
      });
      return response.data;
    }
  );

  const recentResponses = recentResponsesData?.responses || [];

  // Получение рекомендуемых вакансий
  const { data: recommendedVacanciesData } = useQuery(
    'recommended-vacancies',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/vacancies/recommended', {
        withCredentials: true
      });
      return response.data;
    }
  );

  const recommendedVacancies = recommendedVacanciesData?.vacancies || [];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanBadge = (plan) => {
    const badges = {
      free: { text: 'Бесплатно', className: 'bg-gray-100 text-gray-800' },
      basic: { text: 'Базовый', className: 'bg-blue-100 text-blue-800' },
      premium: { text: 'Премиум', className: 'bg-purple-100 text-purple-800' }
    };
    return badges[plan] || badges.free;
  };

  const getResponseStatusBadge = (status) => {
    const badges = {
      sent: { text: 'Отправлен', className: 'bg-blue-100 text-blue-800', icon: Send },
      viewed: { text: 'Просмотрен', className: 'bg-yellow-100 text-yellow-800', icon: Eye },
      invited: { text: 'Приглашение', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { text: 'Отказ', className: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    return badges[status] || badges.sent;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Добро пожаловать, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Вот обзор вашей активности и последних обновлений
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanBadge(user?.subscription?.plan).className}`}>
              {getPlanBadge(user?.subscription?.plan).text}
            </span>
            <button
              onClick={() => navigate('/billing')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Улучшить план
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего откликов</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalResponses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активных поисков</p>
              <p className="text-2xl font-bold text-gray-900">{searches?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Приглашений</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.invitations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Конверсия</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.conversionRate ? `${stats.conversionRate}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Create Search */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Создать поиск</h3>
          <p className="text-blue-100 text-sm mb-4">
            Настройте автоматические отклики на подходящие вакансии
          </p>
          <button
            onClick={() => navigate('/searches')}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Создать поиск
          </button>
        </div>

        {/* Improve Resume */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Улучшить резюме</h3>
          <p className="text-green-100 text-sm mb-4">
            ИИ проанализирует и улучшит ваше резюме
          </p>
          <button
            onClick={() => navigate('/resume')}
            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Улучшить резюме
          </button>
        </div>

        {/* View Analytics */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Аналитика</h3>
          <p className="text-purple-100 text-sm mb-4">
            Отслеживайте эффективность ваших откликов
          </p>
          <button
            onClick={() => navigate('/analytics')}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Посмотреть аналитику
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Responses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Последние отклики</h2>
              <button
                onClick={() => navigate('/responses')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Посмотреть все
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentResponses?.length === 0 ? (
              <div className="p-8 text-center">
                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет откликов</h3>
                <p className="text-gray-500 mb-4">
                  Начните с создания поиска вакансий
                </p>
                <button
                  onClick={() => navigate('/searches')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Найти вакансии
                </button>
              </div>
            ) : (
              recentResponses.map((response) => {
                const statusBadge = getResponseStatusBadge(response.status);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <div key={response._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {response.vacancy?.title || 'Вакансия'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {response.vacancy?.company?.name || 'Компания'}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(response.createdAt)}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recommended Vacancies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Рекомендуемые вакансии</h2>
              <button
                onClick={() => navigate('/vacancies')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Посмотреть все
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recommendedVacancies?.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет вакансий</h3>
                <p className="text-gray-500 mb-4">
                  Настройте поиск для получения рекомендаций
                </p>
                <button
                  onClick={() => navigate('/searches')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Настроить поиск
                </button>
              </div>
            ) : (
              recommendedVacancies.map((vacancy) => (
                <div key={vacancy._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {vacancy.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Building className="h-4 w-4 mr-1" />
                        {vacancy.company?.name}
                        {vacancy.area?.name && (
                          <>
                            <MapPin className="h-4 w-4 ml-3 mr-1" />
                            {vacancy.area.name}
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        {vacancy.salary && (
                          <>
                            <DollarSign className="h-4 w-4 mr-1" />
                            {vacancy.salary.from && `от ${vacancy.salary.from.toLocaleString()} ₽`}
                            {vacancy.salary.to && ` до ${vacancy.salary.to.toLocaleString()} ₽`}
                          </>
                        )}
                        <Clock className="h-4 w-4 ml-3 mr-1" />
                        {formatDate(vacancy.published_at)}
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Откликнуться
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Searches */}
      {searches?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Активные поиски</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {searches.map((search) => (
              <div key={search._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 mr-3">
                        {search.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Активен
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Search className="h-4 w-4 mr-2" />
                        <span>{search.keywords || 'Все вакансии'}</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        <span>{search.responsesCount || 0} откликов</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Создан {formatDate(search.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Обновлен {formatDate(search.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-6">
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                      <Pause className="h-4 w-4 mr-1 inline" />
                      Остановить
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;