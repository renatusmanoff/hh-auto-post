import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  TrendingUp,
  Send,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalResponses: 0,
    totalSearches: 0,
    responsesUsed: 0,
    responsesLimit: 0,
    recentResponses: []
  });

  // Получение статистики пользователя
  const { data: userStats, isLoading: statsLoading } = useQuery(
    'userStats',
    () => axios.get('/api/user/stats'),
    {
      refetchInterval: 30000, // Обновляем каждые 30 секунд
    }
  );

  useEffect(() => {
    if (userStats?.data?.success) {
      setStats(userStats.data.stats);
    }
  }, [userStats]);

  // Получение последних вакансий
  const { data: recentVacancies, isLoading: vacanciesLoading } = useQuery(
    'recentVacancies',
    () => axios.get('/api/vacancies/search', {
      params: {
        text: user?.resume?.skills?.slice(0, 3).join(' ') || '',
        perPage: 5
      }
    }),
    {
      enabled: !!user?.resume?.skills,
      refetchInterval: 60000, // Обновляем каждую минуту
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'Отправлен';
      case 'pending':
        return 'Ожидает';
      case 'failed':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  const getPlanBadge = (plan) => {
    const badges = {
      free: { text: 'Бесплатно', className: 'badge-gray' },
      basic: { text: 'Базовый', className: 'badge-info' },
      premium: { text: 'Премиум', className: 'badge-success' }
    };
    return badges[plan] || badges.free;
  };

  const remainingResponses = stats.responsesLimit - stats.responsesUsed;
  const responsePercentage = (stats.responsesUsed / stats.responsesLimit) * 100;

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Добро пожаловать, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Вот обзор вашей активности и последних обновлений
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-blue-500 flex items-center justify-center">
                  <Send className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Всего откликов</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalResponses}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-green-500 flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Сохраненных поисков</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSearches}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-yellow-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Использовано откликов</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.responsesUsed}/{stats.responsesLimit}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-purple-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Тарифный план</p>
                <span className={`badge ${getPlanBadge(user?.subscription?.plan).className}`}>
                  {getPlanBadge(user?.subscription?.plan).text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Limit Warning */}
      {remainingResponses <= 10 && remainingResponses > 0 && (
        <div className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Лимит откликов почти исчерпан
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    У вас осталось {remainingResponses} откликов. 
                    Рассмотрите возможность продления подписки для продолжения работы.
                  </p>
                </div>
                <div className="mt-3">
                  <div className="bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${responsePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Responses */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Последние отклики</h3>
              <a href="/responses" className="text-sm text-blue-600 hover:text-blue-500">
                Посмотреть все
              </a>
            </div>
          </div>
          <div className="card-body">
            {stats.recentResponses.length > 0 ? (
              <div className="space-y-4">
                {stats.recentResponses.slice(0, 5).map((response) => (
                  <div key={response._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(response.status)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {response.vacancyId?.title || 'Вакансия'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {response.vacancyId?.company?.name || 'Компания'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {format(new Date(response.createdAt), 'dd.MM.yyyy', { locale: ru })}
                      </p>
                      <span className={`badge ${
                        response.status === 'sent' ? 'badge-success' :
                        response.status === 'pending' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {getStatusText(response.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Send className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет откликов</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Начните с создания поиска вакансий
                </p>
                <div className="mt-6">
                  <a href="/vacancies" className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Найти вакансии
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Vacancies */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Рекомендуемые вакансии</h3>
              <a href="/vacancies" className="text-sm text-blue-600 hover:text-blue-500">
                Посмотреть все
              </a>
            </div>
          </div>
          <div className="card-body">
            {vacanciesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner"></div>
              </div>
            ) : recentVacancies?.data?.vacancies?.length > 0 ? (
              <div className="space-y-4">
                {recentVacancies.data.vacancies.slice(0, 5).map((vacancy) => (
                  <div key={vacancy._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{vacancy.title}</p>
                      <p className="text-sm text-gray-500">{vacancy.company?.name}</p>
                      {vacancy.salary && (
                        <p className="text-sm text-green-600 font-medium">
                          {vacancy.salary.from && `от ${vacancy.salary.from.toLocaleString()}`}
                          {vacancy.salary.to && ` до ${vacancy.salary.to.toLocaleString()}`}
                          {vacancy.salary.currency && ` ${vacancy.salary.currency}`}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <a
                        href={vacancy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Открыть
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет вакансий</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Настройте поиск для получения рекомендаций
                </p>
                <div className="mt-6">
                  <a href="/vacancies" className="btn-primary">
                    <Zap className="h-4 w-4 mr-2" />
                    Настроить поиск
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      {!user?.resume?.aboutMe && (
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Завершите настройку профиля
                </h3>
                <p className="text-sm text-gray-600">
                  Добавьте информацию о себе для более точного поиска вакансий и генерации сопроводительных писем.
                </p>
              </div>
              <div className="ml-4">
                <a href="/profile" className="btn-primary">
                  Заполнить профиль
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Подписка</h3>
              <p className="text-sm text-gray-600">
                {user?.subscription?.isActive ? (
                  <>
                    Активна до {format(new Date(user.subscription.endDate), 'dd.MM.yyyy', { locale: ru })}
                  </>
                ) : (
                  'Неактивна'
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`badge ${getPlanBadge(user?.subscription?.plan).className}`}>
                {getPlanBadge(user?.subscription?.plan).text}
              </span>
              <a href="/billing" className="btn-outline">
                Управление подпиской
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
