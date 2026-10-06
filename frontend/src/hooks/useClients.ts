import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Client } from '../types';

export const useClients = () =>
  useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/clients');
      return res.data.data;
    },
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const res = await apiClient.post('/v1/clients', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, ...data }: Partial<Client> & { clientId: string }) => {
      const res = await apiClient.put(`/v1/clients/${clientId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const res = await apiClient.delete(`/v1/clients/${clientId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
