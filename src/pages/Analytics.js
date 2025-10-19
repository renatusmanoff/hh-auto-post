import React from 'react';
import { BarChart3, TrendingUp, Target, Users } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
          Аналитика
        </h1>
        <p className="text-gray-600 mt-2">
          Отслеживайте эффективность ваших откликов и поисков
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Аналитика в разработке
        </h2>
        <p className="text-gray-600 mb-6">
          Здесь будет детальная аналитика по эффективности откликов, конверсии и другим метрикам
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="flex items-center justify-center">
            <Target className="h-5 w-5 mr-2" />
            Конверсия откликов
          </div>
          <div className="flex items-center justify-center">
            <Users className="h-5 w-5 mr-2" />
            Статистика по компаниям
          </div>
          <div className="flex items-center justify-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Графики эффективности
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
