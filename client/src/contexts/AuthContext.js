import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверка статуса авторизации
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/auth/status', {
        withCredentials: true
      });
      if (response.data.authenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Вход через HH.RU
  const loginWithHH = () => {
    window.location.href = 'process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/auth/hh';
  };

  // Выход
  const logout = async () => {
    try {
      await axios.post('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/auth/logout', {}, {
        withCredentials: true
      });
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Вы успешно вышли из системы');
    } catch (error) {
      toast.error('Ошибка при выходе из системы');
    }
  };

  // Обновление профиля пользователя
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/user/profile', profileData, {
        withCredentials: true
      });
      setUser(response.data.user);
      toast.success('Профиль обновлен');
      return response.data.user;
    } catch (error) {
      toast.error('Ошибка при обновлении профиля');
      throw error;
    }
  };

  // Обновление настроек
  const updateSettings = async (settingsData) => {
    try {
      const response = await axios.put('process.env.NODE_ENV === "production" ? "https://myunion.pro" : "http://localhost:3001"/api/user/settings/notifications', settingsData, {
        withCredentials: true
      });
      setUser(prev => ({
        ...prev,
        settings: response.data.settings
      }));
      toast.success('Настройки обновлены');
      return response.data.settings;
    } catch (error) {
      toast.error('Ошибка при обновлении настроек');
      throw error;
    }
  };

  // Проверка лимитов
  const canMakeResponse = () => {
    if (!user) return false;
    return user.subscription.responsesUsed < user.subscription.responsesLimit;
  };

  // Получение оставшихся откликов
  const getRemainingResponses = () => {
    if (!user) return 0;
    return Math.max(0, user.subscription.responsesLimit - user.subscription.responsesUsed);
  };

  // Проверка активной подписки
  const hasActiveSubscription = () => {
    if (!user) return false;
    return user.subscription.isActive && new Date(user.subscription.endDate) > new Date();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    loginWithHH,
    logout,
    updateProfile,
    updateSettings,
    canMakeResponse,
    getRemainingResponses,
    hasActiveSubscription,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
