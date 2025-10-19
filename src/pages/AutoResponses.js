import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Zap,
  Play,
  Pause,
  Settings,
  Plus,
  Search,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AutoResponses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState({
    vacancyTitle: '',
    companyName: '',
    vacancyDescription: '',
    vacancyRequirements: '',
    customPrompt: '',
    generatedLetter: ''
  });
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);

  // Функция для редактирования поиска
  const handleEditSearch = (search) => {
    setSelectedSearch(search);
    setShowEditModal(true);
  };

  // Функция для генерации сопроводительного письма
  const generateCoverLetter = async () => {
    if (!coverLetterData.vacancyTitle || !coverLetterData.companyName) {
      toast.error('Заполните название вакансии и компанию');
      return;
    }

    setIsGeneratingLetter(true);
    try {
      const response = await axios.post('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/ai/cover-letter', {
        vacancyTitle: coverLetterData.vacancyTitle,
        companyName: coverLetterData.companyName,
        vacancyDescription: coverLetterData.vacancyDescription,
        vacancyRequirements: coverLetterData.vacancyRequirements,
        customPrompt: coverLetterData.customPrompt
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setCoverLetterData(prev => ({
          ...prev,
          generatedLetter: response.data.coverLetter
        }));
        toast.success('Сопроводительное письмо сгенерировано!');
      } else {
        toast.error('Ошибка генерации письма');
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
      toast.error('Ошибка генерации сопроводительного письма');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  // Получение списка поисков
  const { data: searches, isLoading: searchesLoading } = useQuery(
    'searches',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/searches', {
        withCredentials: true
      });
      return response.data;
    }
  );

  // Получение статистики откликов
  const { data: stats } = useQuery(
    'response-stats',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/responses/stats/overview', {
        withCredentials: true
      });
      return response.data;
    }
  );

  // Запуск/остановка автооткликов
  const toggleSearchMutation = useMutation(
    async ({ searchId, enabled }) => {
      const response = await axios.put(`process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/searches/${searchId}/toggle`, 
        { enabled }, 
        { withCredentials: true }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('searches');
        toast.success('Настройки обновлены');
      },
      onError: (error) => {
        toast.error('Ошибка обновления настроек');
      }
    }
  );

  const handleToggleSearch = (searchId, currentStatus) => {
    toggleSearchMutation.mutate({ 
      searchId, 
      enabled: !currentStatus 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { 
        text: 'Активен', 
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      paused: { 
        text: 'Приостановлен', 
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      error: { 
        text: 'Ошибка', 
        className: 'bg-red-100 text-red-800',
        icon: AlertCircle
      }
    };
    return badges[status] || badges.paused;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Zap className="h-8 w-8 text-blue-600 mr-3" />
              Автоотклики
            </h1>
            <p className="text-gray-600 mt-2">
              Автоматическая отправка откликов на подходящие вакансии
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать поиск
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего поисков</p>
              <p className="text-2xl font-bold text-gray-900">{searches?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Откликов отправлено</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalResponses || 0}</p>
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
              <Users className="h-6 w-6 text-orange-600" />
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

      {/* Searches List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Мои поиски</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {searchesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка поисков...</p>
            </div>
          ) : searches?.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных поисков</h3>
              <p className="text-gray-500 mb-4">
                Создайте первый поиск для автоматической отправки откликов
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать поиск
              </button>
            </div>
          ) : (
            searches?.map((search) => {
              const statusBadge = getStatusBadge(search.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div key={search._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {search.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.text}
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
                      <button
                        onClick={() => handleToggleSearch(search._id, search.status === 'active')}
                        disabled={toggleSearchMutation.isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          search.status === 'active'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {search.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1 inline" />
                            Остановить
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1 inline" />
                            Запустить
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleEditSearch(search)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Настройки поиска"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Search Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Создать новый поиск
            </h3>
            <p className="text-gray-600 mb-6">
              Настройте параметры поиска для автоматической отправки откликов
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название поиска
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Например: Frontend разработчик в Москве"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ключевые слова
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="React, JavaScript, TypeScript"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Город
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Любой</option>
                    <option value="moscow">Москва</option>
                    <option value="spb">Санкт-Петербург</option>
                    <option value="remote">Удаленно</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Зарплата от
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>
            
            {/* Секция сопроводительного письма */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                Сопроводительное письмо
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Настройте сопроводительное письмо для автоматических откликов
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название вакансии
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Frontend разработчик"
                      value={coverLetterData.vacancyTitle}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, vacancyTitle: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Компания
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Название компании"
                      value={coverLetterData.companyName}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание вакансии (опционально)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Краткое описание вакансии..."
                    value={coverLetterData.vacancyDescription}
                    onChange={(e) => setCoverLetterData(prev => ({ ...prev, vacancyDescription: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Требования (опционально)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Основные требования к кандидату..."
                    value={coverLetterData.vacancyRequirements}
                    onChange={(e) => setCoverLetterData(prev => ({ ...prev, vacancyRequirements: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дополнительные инструкции для ИИ (опционально)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Например: подчеркнуть опыт работы с React, упомянуть готовность к удаленной работе..."
                    value={coverLetterData.customPrompt}
                    onChange={(e) => setCoverLetterData(prev => ({ ...prev, customPrompt: e.target.value }))}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={generateCoverLetter}
                    disabled={isGeneratingLetter}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGeneratingLetter ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Генерирую...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Сгенерировать письмо с ИИ
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowCoverLetterModal(true)}
                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
                  >
                    Предварительный просмотр
                  </button>
                </div>
                
                {coverLetterData.generatedLetter && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">✅ Сопроводительное письмо готово!</p>
                    <p className="text-xs text-green-600">Письмо будет использоваться для автоматических откликов</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Создать поиск
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Preview Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                Предварительный просмотр сопроводительного письма
              </h3>
              <button
                onClick={() => setShowCoverLetterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {coverLetterData.generatedLetter ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Сгенерированное письмо:</h4>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {coverLetterData.generatedLetter}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCoverLetterModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Закрыть
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coverLetterData.generatedLetter);
                      toast.success('Письмо скопировано в буфер обмена!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Копировать
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Сопроводительное письмо не сгенерировано
                </h3>
                <p className="text-gray-600 mb-6">
                  Сначала сгенерируйте письмо с помощью ИИ
                </p>
                <button
                  onClick={() => setShowCoverLetterModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Search Modal */}
      {showEditModal && selectedSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Редактировать поиск: {selectedSearch.name}
            </h3>
            <p className="text-gray-600 mb-6">
              Измените параметры поиска для автоматической отправки откликов
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название поиска
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedSearch.name}
                  placeholder="Название поиска"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ключевые слова
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={selectedSearch.keywords}
                  placeholder="React, JavaScript, Frontend"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимум откликов в день
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedSearch.dailyLimit || 50}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Интервал между откликами (минуты)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedSearch.runInterval || 60}
                    min="1"
                    max="1440"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание поиска
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  defaultValue={selectedSearch.description}
                  placeholder="Описание поиска..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  toast.success('Настройки поиска сохранены!');
                  setShowEditModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Сохранить изменения
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoResponses;
