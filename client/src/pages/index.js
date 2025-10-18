import React from 'react';
import { User, Settings, Bell, Shield } from 'lucide-react';

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <User className="h-6 w-6 mr-2" />
            Профиль пользователя
          </h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Страница профиля
            </h3>
            <p className="text-gray-600">
              Здесь будет форма редактирования профиля, импорт резюме и настройки
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Vacancies = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Поиск вакансий</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Поиск и фильтрация вакансий
            </h3>
            <p className="text-gray-600">
              Здесь будет форма поиска вакансий с фильтрами и сохранением поисков
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Responses = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Мои отклики</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              История откликов
            </h3>
            <p className="text-gray-600">
              Здесь будет список всех отправленных откликов с их статусами
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Searches = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Сохраненные поиски</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Управление поисками
            </h3>
            <p className="text-gray-600">
              Здесь будет список сохраненных поисков и возможность их редактирования
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Настройки
          </h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <Settings className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Настройки приложения
            </h3>
            <p className="text-gray-600">
              Здесь будут настройки уведомлений, автоматических откликов и другие параметры
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Billing = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Биллинг</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Управление подпиской
            </h3>
            <p className="text-gray-600">
              Здесь будет информация о тарифных планах, платежах и управлении подпиской
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin pages
const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Админ панель
          </h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Панель администратора
            </h3>
            <p className="text-gray-600">
              Здесь будет статистика, управление пользователями и системные настройки
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Список пользователей
            </h3>
            <p className="text-gray-600">
              Здесь будет таблица пользователей с возможностью управления их аккаунтами
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPayments = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Платежи</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              История платежей
            </h3>
            <p className="text-gray-600">
              Здесь будет список всех платежей и статистика по доходам
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminResponses = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Аналитика откликов</h1>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Статистика откликов
            </h3>
            <p className="text-gray-600">
              Здесь будет аналитика по откликам, конверсии и эффективности
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export {
  Profile,
  Vacancies,
  Responses,
  Searches,
  Settings,
  Billing,
  AdminDashboard,
  AdminUsers,
  AdminPayments,
  AdminResponses
};
