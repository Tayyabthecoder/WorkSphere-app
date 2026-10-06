import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Task } from '../types';

export interface TaskFilterParams {
  projectId?: string;
  status?: string;
  priority?: string;
  sprintId?: string | null;
  assignee?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export const useTasks = (params?: TaskFilterParams) =>
  useQuery<Task[]>({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const res = await apiClient.get('/v1/tasks', { params });
      return res.data.data;
    },
  });

export const useTask = (taskId?: string) =>
  useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/tasks/${taskId}`);
      return res.data.data;
    },
    enabled: !!taskId,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await apiClient.post('/v1/tasks', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...data }: Partial<Task> & { taskId: string }) => {
      const res = await apiClient.put(`/v1/tasks/${taskId}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', variables.taskId] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiClient.delete(`/v1/tasks/${taskId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
};
