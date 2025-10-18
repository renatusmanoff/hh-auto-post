import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOneSignalInitialized, setIsOneSignalInitialized] = useState(false);

  // Инициализация OneSignal
  useEffect(() => {
    const initializeOneSignal = () => {
      if (window.OneSignal) {
        window.OneSignal.init({
          appId: process.env.REACT_APP_ONESIGNAL_APP_ID || '0bd90862-850a-4f7a-b722-9de6e32c0707',
        }).then(() => {
          setIsOneSignalInitialized(true);
          console.log('OneSignal initialized');
        }).catch((error) => {
          console.error('OneSignal initialization failed:', error);
        });
      }
    };

    // Проверяем, загружен ли OneSignal
    if (window.OneSignal) {
      initializeOneSignal();
    } else {
      // Ждем загрузки OneSignal
      const checkOneSignal = setInterval(() => {
        if (window.OneSignal) {
          clearInterval(checkOneSignal);
          initializeOneSignal();
        }
      }, 100);

      // Очищаем интервал через 10 секунд
      setTimeout(() => {
        clearInterval(checkOneSignal);
      }, 10000);
    }
  }, []);

  // Подписка на push уведомления
  const subscribeToPush = async () => {
    if (!isOneSignalInitialized) {
      toast.error('Push уведомления не инициализированы');
      return false;
    }

    try {
      const permission = await window.OneSignal.showNativePrompt();
      if (permission) {
        toast.success('Push уведомления включены');
        return true;
      } else {
        toast.error('Push уведомления отклонены');
        return false;
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
      toast.error('Ошибка при включении push уведомлений');
      return false;
    }
  };

  // Отправка тестового уведомления
  const sendTestNotification = async (type = 'all') => {
    try {
      const response = await axios.post('/api/notifications/test', { type });
      if (response.data.success) {
        const results = response.data.results;
        const messages = [];
        
        if (results.email) messages.push('Email уведомление отправлено');
        if (results.telegram) messages.push('Telegram уведомление отправлено');
        if (results.push) messages.push('Push уведомление отправлено');
        
        if (messages.length > 0) {
          toast.success(messages.join(', '));
        } else {
          toast.error('Не удалось отправить уведомления');
        }
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Ошибка при отправке тестового уведомления');
    }
  };

  // Получение списка уведомлений
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Отметка уведомления как прочитанного
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Отметка всех уведомлений как прочитанных
  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Удаление уведомления
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Получение статуса уведомлений
  const getNotificationStatus = async () => {
    try {
      const response = await axios.get('/api/notifications/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification status:', error);
      return null;
    }
  };

  const value = {
    notifications,
    unreadCount,
    isOneSignalInitialized,
    subscribeToPush,
    sendTestNotification,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStatus
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
