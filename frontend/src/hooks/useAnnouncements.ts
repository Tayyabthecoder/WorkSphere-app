import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Announcement } from '../types';

export const useAnnouncements = () =>
  useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/announcements');
      return res.data.data;
    },
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Announcement>) => {
      const res = await apiClient.post('/v1/announcements', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};
