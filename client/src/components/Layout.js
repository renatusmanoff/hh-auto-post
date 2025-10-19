import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Home,
  User,
  Search,
  Send,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart3,
  FileText,
  Zap,
  Target,
  TrendingUp,
  Bell
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Главная', href: '/dashboard', icon: Home },
    { name: 'Автоотклики', href: '/auto-responses', icon: Zap },
    { name: 'Поиски', href: '/searches', icon: Target },
    { name: 'Отклики', href: '/responses', icon: Send },
    { name: 'Резюме', href: '/resume', icon: FileText },
    { name: 'Аналитика', href: '/analytics', icon: TrendingUp },
    { name: 'Настройки', href: '/settings', icon: Settings },
    { name: 'Биллинг', href: '/billing', icon: CreditCard },
  ];

  const adminNavigation = [
    { name: 'Админ панель', href: '/admin', icon: Shield },
    { name: 'Пользователи', href: '/admin/users', icon: User },
    { name: 'Платежи', href: '/admin/payments', icon: CreditCard },
    { name: 'Отклики', href: '/admin/responses', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const getPlanBadge = (plan) => {
    const badges = {
      free: { text: 'Бесплатно', className: 'badge-gray' },
      basic: { text: 'Базовый', className: 'badge-info' },
      premium: { text: 'Премиум', className: 'badge-success' }
    };
    return badges[plan] || badges.free;
  };

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">HH</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">HH Finder</h1>
              </div>
            </div>
            <nav className="mt-8 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isCurrentPath(item.href)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
              {user?.isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Администрирование
                  </div>
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isCurrentPath(item.href)
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user?.subscription?.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                    user?.subscription?.plan === 'basic' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {getPlanBadge(user?.subscription?.plan).text}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-full border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                    <span className="text-white font-bold">HH</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">HH Finder</h1>
                    <p className="text-xs text-gray-500">Автоотклики на вакансии</p>
                  </div>
                </div>
              </div>
              <nav className="mt-8 flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isCurrentPath(item.href)
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
                {user?.isAdmin && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Администрирование
                    </div>
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isCurrentPath(item.href)
                              ? 'bg-blue-50 text-blue-700 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  {user?.avatar ? (
                    <img className="h-12 w-12 rounded-full" src={user.avatar} alt="" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user?.subscription?.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                      user?.subscription?.plan === 'basic' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {getPlanBadge(user?.subscription?.plan).text}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  title="Выйти"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">HH</span>
              </div>
              <span className="font-semibold text-gray-900">HH Finder</span>
            </div>
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
