import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle,
  Star,
  Users,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Bot,
  Target,
  TrendingUp,
  MessageCircle,
  Mail,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const LandingPage = () => {
  const { loginWithHH } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: Zap,
      title: 'Автоматический поиск',
      description: 'Находим релевантные вакансии по вашим критериям 24/7'
    },
    {
      icon: Bot,
      title: 'ИИ сопроводительные письма',
      description: 'Генерируем персонализированные письма с помощью GPT'
    },
    {
      icon: Target,
      title: 'Умные фильтры',
      description: 'Настройте точные критерии поиска и сохраните их'
    },
    {
      icon: TrendingUp,
      title: 'Аналитика и рекомендации',
      description: 'Получайте советы от ИИ HR по оптимизации резюме'
    },
    {
      icon: MessageCircle,
      title: 'Уведомления',
      description: 'Telegram, Email и Push уведомления о новых вакансиях'
    },
    {
      icon: Shield,
      title: 'Безопасность',
      description: 'Ваши данные защищены и не передаются третьим лицам'
    }
  ];

  const plans = [
    {
      name: 'Бесплатно',
      price: '0',
      period: '24 часа',
      description: 'Попробуйте сервис бесплатно',
      features: [
        'До 50 откликов',
        'Базовый поиск вакансий',
        'Простая генерация писем',
        'Email уведомления'
      ],
      buttonText: 'Попробовать бесплатно',
      popular: false
    },
    {
      name: 'Базовый',
      price: '700',
      period: 'месяц',
      description: 'Для активного поиска работы',
      features: [
        'Неограниченные отклики',
        'Автоматический поиск',
        'ИИ генерация писем',
        'Все типы уведомлений',
        'Сохранение поисков',
        'Приоритетная поддержка'
      ],
      buttonText: 'Выбрать план',
      popular: true
    },
    {
      name: 'Премиум',
      price: '1990',
      period: 'месяц',
      description: 'Максимальные возможности',
      features: [
        'Все возможности Базового',
        'Аналитика от ИИ HR',
        'Рекомендации по карьере',
        'Расширенная аналитика',
        'Персональный менеджер',
        'API доступ'
      ],
      buttonText: 'Выбрать план',
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Анна Петрова',
      role: 'Frontend разработчик',
      content: 'За неделю получила 5 собеседований! Сервис действительно работает.',
      rating: 5
    },
    {
      name: 'Михаил Сидоров',
      role: 'Backend разработчик',
      content: 'ИИ генерирует отличные сопроводительные письма. Экономит кучу времени.',
      rating: 5
    },
    {
      name: 'Елена Козлова',
      role: 'Product Manager',
      content: 'Нашла работу мечты за 2 недели. Рекомендую всем!',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'Как работает автоматический отклик?',
      answer: 'Вы настраиваете критерии поиска вакансий, а наш сервис автоматически находит подходящие позиции и отправляет отклики с персонализированными сопроводительными письмами.'
    },
    {
      question: 'Безопасно ли это для моего аккаунта HH.RU?',
      answer: 'Да, мы используем официальное API HH.RU и соблюдаем все их требования безопасности. Ваши данные защищены.'
    },
    {
      question: 'Могу ли я настроить сопроводительные письма?',
      answer: 'Конечно! Вы можете использовать ИИ генерацию, создавать собственные шаблоны или комбинировать оба подхода.'
    },
    {
      question: 'Что если я превышу лимит откликов?',
      answer: 'HH.RU ограничивает количество откликов в день. Мы следим за лимитами и уведомляем вас заранее о необходимости продления подписки.'
    },
    {
      question: 'Можно ли отменить подписку?',
      answer: 'Да, вы можете отменить подписку в любое время в личном кабинете. Отмена вступит в силу в конце текущего периода.'
    },
    {
      question: 'Поддерживаете ли вы другие платформы?',
      answer: 'Пока мы работаем только с HH.RU, но планируем добавить поддержку других платформ в будущем.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold gradient-text">HH Finder</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loginWithHH}
                className="btn-primary"
              >
                Войти через HH.RU
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Найди работу мечты
              <span className="block text-yellow-300">автоматически</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Сервис для автоматического поиска и отклика на вакансии в HH.RU с использованием ИИ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={loginWithHH}
                className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Начать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
                Смотреть демо
              </button>
            </div>
            <p className="mt-4 text-blue-200">
              24 часа бесплатно • Без привязки карты • Мгновенный старт
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Как это работает
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Простой процесс от настройки до получения предложений о работе
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card">
                  <div className="card-body text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Простой процесс
            </h2>
            <p className="text-xl text-gray-600">
              Всего 3 шага до автоматического поиска работы
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 text-white text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Подключите HH.RU
              </h3>
              <p className="text-gray-600">
                Авторизуйтесь через ваш аккаунт HH.RU и импортируйте резюме
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 text-white text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Настройте поиск
              </h3>
              <p className="text-gray-600">
                Укажите критерии поиска, навыки и предпочтения по работе
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 text-white text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Получайте отклики
              </h3>
              <p className="text-gray-600">
                Сервис автоматически находит вакансии и отправляет отклики
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Тарифные планы
            </h2>
            <p className="text-xl text-gray-600">
              Выберите подходящий план для ваших потребностей
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`card relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Популярный
                    </span>
                  </div>
                )}
                <div className="card-body text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}₽</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={loginWithHH}
                    className={`w-full btn ${
                      plan.popular 
                        ? 'btn-primary' 
                        : 'btn-outline'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Отзывы пользователей
            </h2>
            <p className="text-xl text-gray-600">
              Более 1000+ довольных пользователей уже нашли работу
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Часто задаваемые вопросы
            </h2>
            <p className="text-xl text-gray-600">
              Ответы на популярные вопросы о сервисе
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="card">
                <button
                  className="w-full text-left card-body flex justify-between items-center"
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы найти работу мечты?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Присоединяйтесь к тысячам пользователей, которые уже нашли работу с помощью HH Finder
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={loginWithHH}
              className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
              Связаться с нами
            </button>
          </div>
          <p className="mt-4 text-blue-200">
            Без привязки карты • Отмена в любое время • Поддержка 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold gradient-text mb-4">HH Finder</h3>
              <p className="text-gray-400">
                Автоматический поиск работы с использованием ИИ
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">Возможности</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Тарифы</Link></li>
                <li><Link to="/security" className="hover:text-white">Безопасность</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Поддержка</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Помощь</Link></li>
                <li><Link to="/contact" className="hover:text-white">Контакты</Link></li>
                <li><Link to="/status" className="hover:text-white">Статус</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  support@hh-finder.ru
                </div>
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  +7 (800) 123-45-67
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HH Finder. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
