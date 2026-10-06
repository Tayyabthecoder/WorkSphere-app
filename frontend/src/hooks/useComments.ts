import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { TaskComment } from '../types';

export const useComments = (taskId: string | null | undefined) => {
  return useQuery<TaskComment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await apiClient.get(`/v1/comments?taskId=${taskId}`);
      return res.data?.data || [];
    },
    enabled: Boolean(taskId),
  });
};

export const useCreateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      taskId: string;
      projectId: string;
      content: string;
      mentions?: string[];
    }) => {
      const res = await apiClient.post('/v1/comments', payload);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.taskId] });
    },
  });
};

export const useUpdateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      taskId: _taskId,
    }: {
      commentId: string;
      content: string;
      taskId: string;
    }) => {
      const res = await apiClient.put(`/v1/comments/${commentId}`, { content });
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.taskId] });
    },
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      taskId: _taskId,
    }: {
      commentId: string;
      taskId: string;
    }) => {
      const res = await apiClient.delete(`/v1/comments/${commentId}`);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.taskId] });
    },
  });
};
