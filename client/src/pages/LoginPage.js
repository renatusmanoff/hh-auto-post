import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Shield, Zap, Users } from 'lucide-react';

const LoginPage = () => {
  const { loginWithHH } = useAuth();

  const benefits = [
    {
      icon: Briefcase,
      title: 'Автоматический поиск',
      description: 'Находим релевантные вакансии 24/7'
    },
    {
      icon: Zap,
      title: 'ИИ письма',
      description: 'Генерируем персонализированные сопроводительные письма'
    },
    {
      icon: Shield,
      title: 'Безопасность',
      description: 'Используем официальное API HH.RU'
    },
    {
      icon: Users,
      title: 'Поддержка',
      description: 'Помогаем на каждом этапе поиска работы'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link to="/" className="text-3xl font-bold gradient-text">
            HH Finder
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Войдите в аккаунт
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Авторизуйтесь через ваш аккаунт HH.RU для начала работы
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-body">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Вход через HH.RU
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Мы используем официальное API HH.RU для безопасной авторизации
                </p>
                
                <button
                  onClick={loginWithHH}
                  className="w-full btn-primary text-lg py-3"
                >
                  <Briefcase className="h-5 w-5 mr-2" />
                  Войти через HH.RU
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Преимущества сервиса</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-md bg-blue-100 text-blue-600 mb-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">{benefit.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Нет аккаунта HH.RU?{' '}
            <a
              href="https://hh.ru/account/register"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Зарегистрируйтесь
            </a>
          </p>
        </div>

        <div className="mt-8">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Что происходит после входа?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">1</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      Импортируем ваше резюме из HH.RU
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">2</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      Настраиваем критерии поиска вакансий
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      Запускаем автоматический поиск и отклики
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Нажимая "Войти через HH.RU", вы соглашаетесь с{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              условиями использования
            </Link>{' '}
            и{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              политикой конфиденциальности
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
