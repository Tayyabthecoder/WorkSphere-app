import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Project } from '../types';

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/projects');
      return res.data.data;
    },
  });

export const useProject = (projectId?: string) =>
  useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/projects/${projectId}`);
      return res.data.data;
    },
    enabled: !!projectId,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await apiClient.post('/v1/projects', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...data }: Partial<Project> & { projectId: string }) => {
      const res = await apiClient.put(`/v1/projects/${projectId}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
};
