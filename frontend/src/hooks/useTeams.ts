import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Team } from '../types';
import { getSocket } from '../lib/socket';

export interface TeamsFilter {
  managerId?: string;
  department?: string;
}

export const useTeams = (filters?: TeamsFilter) => {
  const qc = useQueryClient();

  // Real-time synchronization for squad / team structure changes
  useEffect(() => {
    const socket = getSocket();

    const handleTeamsUpdate = () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    };

    socket.on('teams:created', handleTeamsUpdate);
    socket.on('teams:updated', handleTeamsUpdate);
    socket.on('teams:deleted', handleTeamsUpdate);
    socket.on('team:member_added', handleTeamsUpdate);
    socket.on('team:member_updated', handleTeamsUpdate);

    return () => {
      socket.off('teams:created', handleTeamsUpdate);
      socket.off('teams:updated', handleTeamsUpdate);
      socket.off('teams:deleted', handleTeamsUpdate);
      socket.off('team:member_added', handleTeamsUpdate);
      socket.off('team:member_updated', handleTeamsUpdate);
    };
  }, [qc]);

  return useQuery<Team[]>({
    queryKey: ['teams', filters],
    queryFn: async () => {
      const res = await apiClient.get('/v1/teams', { params: filters });
      return res.data?.data || [];
    },
  });
};

export const useTeamDetail = (teamId: string | null | undefined) => {
  return useQuery<Team>({
    queryKey: ['teams', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('teamId required');
      const res = await apiClient.get(`/v1/teams/${teamId}`);
      return res.data?.data;
    },
    enabled: Boolean(teamId),
  });
};

export const useCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      department?: string;
      managerId: string;
      leaderId?: string | null;
      memberIds?: string[];
      colorLabel?: string;
    }) => {
      const res = await apiClient.post('/v1/teams', data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useUpdateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      ...data
    }: {
      teamId: string;
      name?: string;
      description?: string;
      department?: string;
      managerId?: string;
      leaderId?: string | null;
      memberIds?: string[];
      colorLabel?: string;
    }) => {
      const res = await apiClient.patch(`/v1/teams/${teamId}`, data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useAddTeamMembers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userIds }: { teamId: string; userIds: string[] }) => {
      const res = await apiClient.post(`/v1/teams/${teamId}/members`, { userIds });
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useRemoveTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const res = await apiClient.delete(`/v1/teams/${teamId}/members/${userId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};

export const useDeleteTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiClient.delete(`/v1/teams/${teamId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
};
