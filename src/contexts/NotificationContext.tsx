import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  notifyGroupUpdate: (groupName: string, membersCount: number, maxMembers: number) => void;
  notifyReferralSuccess: (referredName: string, commission: number) => void;
  notifyPaymentProcessed: (amount: number, type: 'withdrawal' | 'commission') => void;
  notifyAchievement: (achievementName: string, bonus?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const notificationData = useNotifications();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};