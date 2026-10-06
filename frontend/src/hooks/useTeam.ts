import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { TeamMember } from '../types';

export const useTeam = () =>
  useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/team');
      return res.data.data;
    },
  });

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; name: string; role: string; department?: string; password?: string }) => {
      const res = await apiClient.post('/v1/team', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, ...data }: Partial<TeamMember> & { userId: string }) => {
      const res = await apiClient.put(`/v1/team/${userId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useDeactivateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/v1/team/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};
