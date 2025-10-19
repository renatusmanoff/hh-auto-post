import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Star,
  ExternalLink,
  Save,
  RefreshCw,
  Target,
  Calendar,
  Users,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const Vacancies = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({
    text: '',
    area: '',
    specialization: '',
    experience: '',
    employment: '',
    schedule: '',
    salary: {
      from: '',
      to: '',
      currency: 'RUR'
    },
    orderBy: 'relevance',
    page: 0,
    perPage: 20
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Поиск вакансий
  const searchVacancies = async () => {
    if (!searchParams.text.trim()) {
      toast.error('Введите ключевые слова для поиска');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.post('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/vacancies/search', {
        ...searchParams,
        page: currentPage
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setSearchResults(response.data.vacancies);
        setTotalFound(response.data.totalFound);
        toast.success(`Найдено ${response.data.totalFound} вакансий`);
      } else {
        toast.error('Ошибка поиска вакансий');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка поиска вакансий');
    } finally {
      setIsSearching(false);
    }
  };

  // Сохранение поиска
  const saveSearch = async () => {
    if (!searchParams.text.trim()) {
      toast.error('Введите ключевые слова для поиска');
      return;
    }

    try {
      const response = await axios.post('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/searches', {
        name: `Поиск: ${searchParams.text}`,
        keywords: searchParams.text,
        areaIds: searchParams.area ? [searchParams.area] : [],
        salary: searchParams.salary,
        experience: searchParams.experience,
        employment: searchParams.employment ? [searchParams.employment] : [],
        schedule: searchParams.schedule ? [searchParams.schedule] : [],
        specialization: searchParams.specialization ? [searchParams.specialization] : []
      }, {
        withCredentials: true
      });

      if (response.data) {
        toast.success('Поиск сохранен!');
      }
    } catch (error) {
      console.error('Save search error:', error);
      toast.error('Ошибка сохранения поиска');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSearchParams(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSearchParams(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Не указана';
    const { from, to, currency } = salary;
    const currencySymbol = currency === 'RUR' ? '₽' : currency;
    
    if (from && to) {
      return `${from.toLocaleString()} - ${to.toLocaleString()} ${currencySymbol}`;
    } else if (from) {
      return `от ${from.toLocaleString()} ${currencySymbol}`;
    } else if (to) {
      return `до ${to.toLocaleString()} ${currencySymbol}`;
    }
    return 'Не указана';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Search className="h-8 w-8 mr-3 text-blue-600" />
          Поиск вакансий
        </h1>
        <p className="mt-2 text-gray-600">
          Найдите подходящие вакансии и сохраните поиски для автоматических откликов
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Фильтры поиска */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Фильтры
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ключевые слова
                </label>
                <input
                  type="text"
                  value={searchParams.text}
                  onChange={(e) => handleInputChange('text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="React, JavaScript, Frontend"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Город
                </label>
                <select
                  value={searchParams.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Любой</option>
                  <option value="1">Москва</option>
                  <option value="2">Санкт-Петербург</option>
                  <option value="3">Новосибирск</option>
                  <option value="4">Екатеринбург</option>
                  <option value="5">Казань</option>
                  <option value="6">Нижний Новгород</option>
                  <option value="7">Челябинск</option>
                  <option value="8">Самара</option>
                  <option value="9">Омск</option>
                  <option value="10">Ростов-на-Дону</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Опыт работы
                </label>
                <select
                  value={searchParams.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Любой</option>
                  <option value="noExperience">Без опыта</option>
                  <option value="between1And3">1-3 года</option>
                  <option value="between3And6">3-6 лет</option>
                  <option value="moreThan6">Более 6 лет</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  График работы
                </label>
                <select
                  value={searchParams.schedule}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Любой</option>
                  <option value="fullDay">Полный день</option>
                  <option value="shift">Сменный график</option>
                  <option value="flexible">Гибкий график</option>
                  <option value="remote">Удаленная работа</option>
                  <option value="flyInFlyOut">Вахтовый метод</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Зарплата от
                </label>
                <input
                  type="number"
                  value={searchParams.salary.from}
                  onChange={(e) => handleInputChange('salary.from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сортировка
                </label>
                <select
                  value={searchParams.orderBy}
                  onChange={(e) => handleInputChange('orderBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">По релевантности</option>
                  <option value="publication_time">По дате публикации</option>
                  <option value="salary_desc">По убыванию зарплаты</option>
                  <option value="salary_asc">По возрастанию зарплаты</option>
                </select>
              </div>

              <div className="space-y-2">
                <button
                  onClick={searchVacancies}
                  disabled={isSearching}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Ищу...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Найти вакансии
                    </>
                  )}
                </button>
                
                <button
                  onClick={saveSearch}
                  className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить поиск
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Результаты поиска */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Результаты поиска
                </h2>
                {totalFound > 0 && (
                  <span className="text-sm text-gray-500">
                    Найдено {totalFound} вакансий
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Начните поиск вакансий
                  </h3>
                  <p className="text-gray-600">
                    Введите ключевые слова и нажмите "Найти вакансии"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((vacancy) => (
                    <div key={vacancy._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {vacancy.title}
                            </h3>
                            {vacancy.isNew && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Новое
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-3">
                            <Building className="h-4 w-4 mr-1" />
                            <span className="mr-4">{vacancy.company?.name}</span>
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="mr-4">{vacancy.location?.city}</span>
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(vacancy.publishedAt)}</span>
                          </div>

                          <div className="flex items-center mb-3">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {formatSalary(vacancy.salary)}
                            </span>
                          </div>

                          {vacancy.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {vacancy.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
                            </p>
                          )}

                          {vacancy.skills && vacancy.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {vacancy.skills.slice(0, 5).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {vacancy.skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                  +{vacancy.skills.length - 5} еще
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <a
                            href={vacancy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Открыть
                          </a>
                          
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center text-sm">
                            <Star className="h-4 w-4 mr-1" />
                            Сохранить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Пагинация */}
                  {totalFound > searchParams.perPage && (
                    <div className="flex justify-center mt-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.max(0, prev - 1));
                            searchVacancies();
                          }}
                          disabled={currentPage === 0}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Назад
                        </button>
                        
                        <span className="px-3 py-2 text-gray-700">
                          Страница {currentPage + 1} из {Math.ceil(totalFound / searchParams.perPage)}
                        </span>
                        
                        <button
                          onClick={() => {
                            setCurrentPage(prev => prev + 1);
                            searchVacancies();
                          }}
                          disabled={currentPage >= Math.ceil(totalFound / searchParams.perPage) - 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Вперед
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vacancies;
