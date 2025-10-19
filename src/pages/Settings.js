import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Settings as SettingsIcon,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      telegram: true,
      push: true,
      newVacancies: true,
      responses: true,
      invitations: true,
      errors: true
    },
    autoResponse: {
      enabled: true,
      maxDailyResponses: 50,
      maxTotalResponses: 200,
      responseInterval: 60,
      skipDuplicates: true,
      skipCompanies: [],
      preferredSchedule: 'workdays'
    },
    profile: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      timezone: 'Europe/Moscow',
      language: 'ru'
    },
    privacy: {
      showProfile: true,
      allowMessages: true,
      shareAnalytics: false
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  // Сохранение настроек
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/user/settings', settings, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Настройки сохранены!');
        queryClient.invalidateQueries('user-settings');
      } else {
        toast.error('Ошибка сохранения настроек');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleArraySettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value.split(',').map(item => item.trim()).filter(item => item)
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="h-8 w-8 mr-3 text-blue-600" />
          Настройки
        </h1>
        <p className="mt-2 text-gray-600">
          Управляйте настройками уведомлений, автоматических откликов и профиля
        </p>
      </div>

      <div className="space-y-8">
        {/* Уведомления */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Уведомления</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Каналы уведомлений</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Mail className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Email уведомления</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.telegram}
                    onChange={(e) => handleSettingChange('notifications', 'telegram', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Smartphone className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Telegram уведомления</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Globe className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Push уведомления в браузере</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Типы уведомлений</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.newVacancies}
                    onChange={(e) => handleSettingChange('notifications', 'newVacancies', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Target className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Новые подходящие вакансии</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.responses}
                    onChange={(e) => handleSettingChange('notifications', 'responses', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Zap className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Статус отправленных откликов</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.invitations}
                    onChange={(e) => handleSettingChange('notifications', 'invitations', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <CheckCircle className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Приглашения на собеседования</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.errors}
                    onChange={(e) => handleSettingChange('notifications', 'errors', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <AlertCircle className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                  <span className="text-gray-700">Ошибки в работе системы</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Автоматические отклики */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Zap className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Автоматические отклики</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoResponse.enabled}
                  onChange={(e) => handleSettingChange('autoResponse', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">Включить автоматические отклики</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Максимум откликов в день
                </label>
                <input
                  type="number"
                  value={settings.autoResponse.maxDailyResponses}
                  onChange={(e) => handleSettingChange('autoResponse', 'maxDailyResponses', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Максимум откликов всего
                </label>
                <input
                  type="number"
                  value={settings.autoResponse.maxTotalResponses}
                  onChange={(e) => handleSettingChange('autoResponse', 'maxTotalResponses', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Интервал между откликами (минуты)
              </label>
              <input
                type="number"
                value={settings.autoResponse.responseInterval}
                onChange={(e) => handleSettingChange('autoResponse', 'responseInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="1440"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Исключить компании (через запятую)
              </label>
              <input
                type="text"
                value={settings.autoResponse.skipCompanies.join(', ')}
                onChange={(e) => handleArraySettingChange('autoResponse', 'skipCompanies', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Компания 1, Компания 2"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoResponse.skipDuplicates}
                  onChange={(e) => handleSettingChange('autoResponse', 'skipDuplicates', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">Пропускать дублирующиеся вакансии</span>
              </label>
            </div>
          </div>
        </div>

        {/* Профиль */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Профиль</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  value={settings.profile.firstName}
                  onChange={(e) => handleSettingChange('profile', 'firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={settings.profile.lastName}
                  onChange={(e) => handleSettingChange('profile', 'lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={settings.profile.phone}
                onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Часовой пояс
                </label>
                <select
                  value={settings.profile.timezone}
                  onChange={(e) => handleSettingChange('profile', 'timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Europe/Moscow">Москва (UTC+3)</option>
                  <option value="Europe/Kiev">Киев (UTC+2)</option>
                  <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                  <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Язык интерфейса
                </label>
                <select
                  value={settings.profile.language}
                  onChange={(e) => handleSettingChange('profile', 'language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Конфиденциальность */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Конфиденциальность</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.showProfile}
                onChange={(e) => handleSettingChange('privacy', 'showProfile', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Показывать профиль в поиске</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.allowMessages}
                onChange={(e) => handleSettingChange('privacy', 'allowMessages', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Разрешить сообщения от работодателей</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.shareAnalytics}
                onChange={(e) => handleSettingChange('privacy', 'shareAnalytics', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Поделиться анонимной аналитикой для улучшения сервиса</span>
            </label>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Сохраняю...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Сохранить настройки
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
