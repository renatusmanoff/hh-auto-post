import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  FileText,
  Upload,
  Download,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Eye,
  Copy,
  Sparkles,
  TrendingUp,
  Target,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const Resume = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  // Получение резюме пользователя
  const { data: resumes, isLoading: resumesLoading } = useQuery(
    'user-resumes',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/resumes', {
        withCredentials: true
      });
      return response.data;
    }
  );

  // Получение статистики резюме
  const { data: resumeStats } = useQuery(
    'resume-stats',
    async () => {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/resumes/stats', {
        withCredentials: true
      });
      return response.data;
    }
  );

  // Улучшение резюме с ИИ
  const improveResumeMutation = useMutation(
    async ({ resumeId, improvements }) => {
      const response = await axios.post(`process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/ai/improve-resume`, 
        { resumeId, improvements }, 
        { withCredentials: true }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('user-resumes');
        toast.success('Резюме улучшено с помощью ИИ');
        setShowImproveModal(false);
      },
      onError: (error) => {
        toast.error('Ошибка улучшения резюме');
      }
    }
  );

  const handleImproveResume = (resumeId) => {
    setSelectedResume(resumeId);
    setShowImproveModal(true);
  };

  const handleConfirmImprove = () => {
    if (selectedResume) {
      improveResumeMutation.mutate({
        resumeId: selectedResume,
        improvements: ['keywords', 'structure', 'achievements']
      });
    }
  };

  const getResumeScore = (resume) => {
    // Простая логика оценки резюме
    let score = 60; // Базовый балл
    
    if (resume.experience && resume.experience.length > 0) score += 10;
    if (resume.education && resume.education.length > 0) score += 10;
    if (resume.skills && resume.skills.length > 5) score += 10;
    if (resume.summary && resume.summary.length > 100) score += 10;
    
    return Math.min(score, 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              Резюме
            </h1>
            <p className="text-gray-600 mt-2">
              Управляйте резюме и улучшайте их с помощью ИИ
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Загрузить резюме
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего резюме</p>
              <p className="text-2xl font-bold text-gray-900">{resumes?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumeStats?.averageScore ? `${resumeStats.averageScore}/100` : '0/100'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Откликов с резюме</p>
              <p className="text-2xl font-bold text-gray-900">{resumeStats?.responsesWithResume || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Приглашений</p>
              <p className="text-2xl font-bold text-gray-900">{resumeStats?.invitations || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Мои резюме</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {resumesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Загрузка резюме...</p>
            </div>
          ) : resumes?.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет загруженных резюме</h3>
              <p className="text-gray-500 mb-4">
                Загрузите резюме для автоматической отправки откликов
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Загрузить резюме
              </button>
            </div>
          ) : (
            resumes?.map((resume) => {
              const score = getResumeScore(resume);
              const scoreColor = getScoreColor(score);
              
              return (
                <div key={resume._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {resume.title || 'Резюме'}
                        </h3>
                        {resume.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Активно
                          </span>
                        )}
                        {resume.isPrimary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Основное
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Балл:</span>
                          <span className={`font-bold ${scoreColor}`}>{score}/100</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Опыт:</span>
                          <span>{resume.experience?.length || 0} мест</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Навыки:</span>
                          <span>{resume.skills?.length || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Обновлено:</span>
                          <span>{formatDate(resume.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Score Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Качество резюме</span>
                          <span className={`font-medium ${scoreColor}`}>{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              score >= 80 ? 'bg-green-500' : 
                              score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      {score < 80 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Рекомендации по улучшению
                              </p>
                              <p className="text-sm text-yellow-700 mt-1">
                                Добавьте больше деталей об опыте работы и достижениях
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => handleImproveResume(resume._id)}
                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Улучшить с ИИ"
                      >
                        <Sparkles className="h-5 w-5" />
                      </button>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="h-5 w-5" />
                      </button>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="h-5 w-5" />
                      </button>
                      
                      <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Загрузить резюме
            </h3>
            <p className="text-gray-600 mb-6">
              Загрузите файл резюме или создайте новое из профиля HH.RU
            </p>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Перетащите файл сюда или</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  выберите файл
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Поддерживаются форматы: PDF, DOC, DOCX (до 5 МБ)
                </p>
              </div>
              
              <div className="text-center">
                <span className="text-gray-500">или</span>
              </div>
              
              <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                <Copy className="h-5 w-5 mr-2" />
                Импортировать из HH.RU
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Загрузить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Improve Modal */}
      {showImproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Улучшить резюме с ИИ
            </h3>
            <p className="text-gray-600 mb-6">
              ИИ проанализирует ваше резюме и предложит улучшения
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Что будет улучшено:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Оптимизация ключевых слов</li>
                      <li>• Улучшение структуры</li>
                      <li>• Добавление достижений</li>
                      <li>• Повышение читаемости</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImproveModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button 
                onClick={handleConfirmImprove}
                disabled={improveResumeMutation.isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {improveResumeMutation.isLoading ? 'Улучшаем...' : 'Улучшить резюме'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;
