import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCompany } from './CompanyContext';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState({
    email: true,
    browser: true,
    inApp: true,
    sound: false,
    categories: {
      sales: true,
      inventory: true,
      customers: true,
      system: true,
      financial: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Cargar notificaciones al cambiar de empresa
  useEffect(() => {
    if (currentCompany && user) {
      loadNotifications();
      loadPreferences();
    }
  }, [currentCompany, user]);

  // Configurar WebSocket o polling para notificaciones en tiempo real
  useEffect(() => {
    if (currentCompany && user) {
      // Aquí se configuraría WebSocket o polling
      const interval = setInterval(() => {
        checkForNewNotifications();
      }, 30000); // Verificar cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [currentCompany, user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications(
        user.id,
        currentCompany.company.id
      );
      
      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        console.error('Error cargando notificaciones:', result.error);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const result = await notificationService.getPreferences(
        user.id,
        currentCompany.company.id
      );
      
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
    }
  };

  const checkForNewNotifications = async () => {
    try {
      const result = await notificationService.getNotifications(
        user.id,
        currentCompany.company.id,
        { onlyNew: true }
      );
      
      if (result.success && result.data.notifications.length > 0) {
        const newNotifications = result.data.notifications;
        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadCount(prev => prev + newNotifications.length);
        
        // Mostrar notificaciones del navegador si está habilitado
        if (preferences.browser) {
          newNotifications.forEach(notification => {
            showBrowserNotification(notification);
          });
        }
        
        // Reproducir sonido si está habilitado
        if (preferences.sound) {
          playNotificationSound();
        }
      }
    } catch (error) {
      console.error('Error verificando nuevas notificaciones:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead(
        user.id,
        currentCompany.company.id
      );
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            read: true, 
            readAt: new Date() 
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      
      if (result.success) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const result = await notificationService.updatePreferences(
        user.id,
        currentCompany.company.id,
        newPreferences
      );
      
      if (result.success) {
        setPreferences(newPreferences);
        
        // Solicitar permisos del navegador si se habilitó
        if (newPreferences.browser && 'Notification' in window) {
          Notification.requestPermission();
        }
      }
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
    }
  };

  const createNotification = async (notificationData) => {
    try {
      const result = await notificationService.createNotification({
        ...notificationData,
        userId: user.id,
        companyId: currentCompany.company.id
      });
      
      if (result.success) {
        // Agregar la nueva notificación al estado local
        setNotifications(prev => [result.data, ...prev]);
        if (!result.data.read) {
          setUnreadCount(prev => prev + 1);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error creando notificación:', error);
      return { success: false, error: error.message };
    }
  };

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        data: notification
      });
      
      browserNotification.onclick = () => {
        markAsRead(notification.id);
        // Aquí se podría navegar a la página relevante
        window.focus();
        browserNotification.close();
      };
      
      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  };

  const playNotificationSound = () => {
    // Reproducir sonido de notificación
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
  };

  const getNotificationsByCategory = useCallback((category) => {
    return notifications.filter(notification => notification.category === category);
  }, [notifications]);

  const getUnreadByCategory = useCallback((category) => {
    return notifications.filter(notification => 
      notification.category === category && !notification.read
    ).length;
  }, [notifications]);

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const value = {
    // Estado
    notifications,
    unreadCount,
    preferences,
    loading,
    connected,
    
    // Acciones
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    createNotification,
    
    // Utilidades
    getNotificationsByCategory,
    getUnreadByCategory,
    requestBrowserPermission
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};