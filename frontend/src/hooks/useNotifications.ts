import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { NotificationItem } from '../types';

interface NotificationsData {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const useNotifications = () =>
  useQuery<NotificationsData>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/notifications');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId?: string) => {
      const res = await apiClient.patch('/v1/notifications', { notificationId });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
