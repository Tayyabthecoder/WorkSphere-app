import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Sprint, Task } from '../types';

export interface CreateSprintInput {
  projectId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  capacityPoints?: number;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  capacityPoints?: number;
  status?: 'planning' | 'active' | 'completed';
}

export const useSprints = (projectId?: string, status?: string) =>
  useQuery<Sprint[]>({
    queryKey: ['sprints', projectId, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.projectId = projectId;
      if (status) params.status = status;
      const res = await apiClient.get('/v1/sprints', { params });
      return res.data.data;
    },
    enabled: projectId !== undefined,
  });

export const useSprint = (sprintId?: string) =>
  useQuery<Sprint & { tasks?: Task[] }>({
    queryKey: ['sprint', sprintId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/sprints/${sprintId}`);
      return res.data.data;
    },
    enabled: !!sprintId,
  });

export const useCreateSprint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSprintInput) => {
      const res = await apiClient.post('/v1/sprints', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
};

export const useUpdateSprint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, ...data }: UpdateSprintInput & { sprintId: string }) => {
      const res = await apiClient.put(`/v1/sprints/${sprintId}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['sprints'] });
      qc.invalidateQueries({ queryKey: ['sprint', variables.sprintId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteSprint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await apiClient.delete(`/v1/sprints/${sprintId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
