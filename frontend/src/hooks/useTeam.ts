import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { TeamMember, Invitation } from '../types';
import { getSocket } from '../lib/socket';

export interface TeamFilters {
  department?: string;
  status?: 'all' | 'active' | 'deactivated';
  search?: string;
}

export const useTeam = (filters?: TeamFilters) => {
  const qc = useQueryClient();

  // Real-time synchronization for team changes
  useEffect(() => {
    const socket = getSocket();

    const handleTeamUpdate = () => {
      qc.invalidateQueries({ queryKey: ['team'] });
    };

    socket.on('team:member_added', handleTeamUpdate);
    socket.on('team:member_invited', handleTeamUpdate);
    socket.on('team:member_updated', handleTeamUpdate);
    socket.on('team:member_removed', handleTeamUpdate);
    socket.on('team:invite_created', handleTeamUpdate);
    socket.on('team:invite_revoked', handleTeamUpdate);

    return () => {
      socket.off('team:member_added', handleTeamUpdate);
      socket.off('team:member_invited', handleTeamUpdate);
      socket.off('team:member_updated', handleTeamUpdate);
      socket.off('team:member_removed', handleTeamUpdate);
      socket.off('team:invite_created', handleTeamUpdate);
      socket.off('team:invite_revoked', handleTeamUpdate);
    };
  }, [qc]);

  return useQuery<TeamMember[]>({
    queryKey: ['team', filters],
    queryFn: async () => {
      const res = await apiClient.get('/v1/team', { params: filters });
      return res.data?.data || [];
    },
  });
};

export const useInvitations = () =>
  useQuery<Invitation[]>({
    queryKey: ['team', 'invitations'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/team/invitations');
      return res.data?.data || [];
    },
  });

export const useAddMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      role: string;
      department?: string;
      teamId?: string | null;
      reportsToUserId?: string | null;
      jobTitle?: string;
      password?: string;
    }) => {
      const res = await apiClient.post('/v1/team/add', data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      role: string;
      department?: string;
      teamId?: string | null;
      reportsToUserId?: string | null;
      jobTitle?: string;
      password?: string;
    }) => {
      const res = await apiClient.post('/v1/team/add', data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useResendInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await apiClient.post(`/v1/team/invitations/${invitationId}/resend`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', 'invitations'] });
    },
  });
};

export const useRevokeInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await apiClient.delete(`/v1/team/invitations/${invitationId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', 'invitations'] });
    },
  });
};

export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, ...data }: Partial<TeamMember> & { userId: string }) => {
      const res = await apiClient.patch(`/v1/team/${userId}`, data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDeactivateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      reassignToUserId,
    }: {
      userId: string;
      reassignToUserId?: string;
    }) => {
      const res = await apiClient.post(`/v1/team/${userId}/deactivate`, { reassignToUserId });
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/v1/team/${userId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
