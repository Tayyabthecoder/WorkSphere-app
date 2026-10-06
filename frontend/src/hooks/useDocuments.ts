import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { DocumentItem, FolderItem, FileItem } from '../types';

export const documentKeys = {
  all: ['documents'] as const,
  list: (projectId?: string, folderId?: string | null, search?: string) =>
    ['documents', 'list', projectId || 'all', folderId ?? 'all', search || ''] as const,
  detail: (documentId: string) => ['documents', 'detail', documentId] as const,
  folders: (projectId?: string) => ['folders', projectId || 'all'] as const,
  files: (projectId?: string, folderId?: string | null) =>
    ['files', projectId || 'all', folderId ?? 'all'] as const,
};

export function useDocuments(projectId?: string, folderId?: string | null, search?: string) {
  return useQuery({
    queryKey: documentKeys.list(projectId, folderId, search),
    queryFn: async (): Promise<DocumentItem[]> => {
      const params = new URLSearchParams();
      if (projectId && projectId !== 'all') params.append('projectId', projectId);
      if (folderId !== undefined) {
        params.append('folderId', folderId === null ? 'null' : folderId);
      }
      if (search) params.append('search', search);

      const qs = params.toString();
      const res = await apiClient.get(`/v1/documents${qs ? `?${qs}` : ''}`);
      return res.data?.data || [];
    },
  });
}

export function useFolders(projectId?: string) {
  return useQuery({
    queryKey: documentKeys.folders(projectId),
    queryFn: async (): Promise<FolderItem[]> => {
      const params = new URLSearchParams();
      if (projectId && projectId !== 'all') params.append('projectId', projectId);
      const qs = params.toString();
      const res = await apiClient.get(`/v1/folders${qs ? `?${qs}` : ''}`);
      return res.data?.data || [];
    },
  });
}

export function useFiles(projectId?: string, folderId?: string | null) {
  return useQuery({
    queryKey: documentKeys.files(projectId, folderId),
    queryFn: async (): Promise<FileItem[]> => {
      const params = new URLSearchParams();
      if (projectId && projectId !== 'all') params.append('projectId', projectId);
      if (folderId !== undefined) {
        params.append('folderId', folderId === null ? 'null' : folderId);
      }
      const qs = params.toString();
      const res = await apiClient.get(`/v1/files${qs ? `?${qs}` : ''}`);
      return res.data?.data || [];
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; projectId: string; parentFolderId?: string | null }) => {
      const res = await apiClient.post('/v1/folders', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; content?: string; projectId: string; folderId?: string | null }) => {
      const res = await apiClient.post('/v1/documents', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, ...payload }: { documentId: string; title?: string; content?: string; folderId?: string | null }) => {
      const res = await apiClient.put(`/v1/documents/${documentId}`, payload);
      return res.data?.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(vars.documentId) });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await apiClient.delete(`/v1/documents/${documentId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/v1/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiClient.delete(`/v1/files/${fileId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
