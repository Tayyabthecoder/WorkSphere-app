import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export type AvailabilityType = 'pto' | 'holiday' | 'partial';

export interface AvailabilityItem {
  availabilityId: string;
  userId: string;
  date: string;
  type: AvailabilityType;
  hoursAvailable: number;
  note?: string;
}

export interface MemberCapacity {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  department?: string;
  workingDays: number;
  ptoDays: number;
  availableHours: number;
  committedHours: number;
  committedPoints: number;
  assignedTaskCount: number;
  loadPct: number;
  status: 'optimal' | 'heavy' | 'overloaded';
}

export interface CapacityData {
  sprintId?: string | null;
  sprintName?: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  totalAvailableHours: number;
  totalCommittedHours: number;
  overallLoadPct: number;
  members: MemberCapacity[];
}

export const capacityKeys = {
  all: ['capacity'] as const,
  sprint: (sprintId: string) => ['capacity', 'sprint', sprintId] as const,
  project: (projectId: string, startDate?: string, endDate?: string) =>
    ['capacity', 'project', projectId, startDate || '', endDate || ''] as const,
  availability: (userId?: string, from?: string, to?: string) =>
    ['availability', userId || 'all', from || '', to || ''] as const,
};

export function useSprintCapacity(sprintId?: string | null) {
  return useQuery({
    queryKey: capacityKeys.sprint(sprintId || ''),
    queryFn: async (): Promise<CapacityData | null> => {
      if (!sprintId) return null;
      const res = await apiClient.get(`/v1/capacity?sprintId=${encodeURIComponent(sprintId)}`);
      return res.data?.data || null;
    },
    enabled: Boolean(sprintId),
  });
}

export function useProjectCapacity(projectId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: capacityKeys.project(projectId, startDate, endDate),
    queryFn: async (): Promise<CapacityData | null> => {
      const params = new URLSearchParams();
      if (projectId && projectId !== 'all') params.append('projectId', projectId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const qs = params.toString();
      const res = await apiClient.get(`/v1/capacity${qs ? `?${qs}` : ''}`);
      return res.data?.data || null;
    },
  });
}

export function useAvailability(userId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: capacityKeys.availability(userId, from, to),
    queryFn: async (): Promise<AvailabilityItem[]> => {
      const params = new URLSearchParams();
      if (userId && userId !== 'all') params.append('userId', userId);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const qs = params.toString();
      const res = await apiClient.get(`/v1/availability${qs ? `?${qs}` : ''}`);
      return res.data?.data || [];
    },
  });
}

export function useRecordAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId?: string;
      date: string;
      type: AvailabilityType;
      hoursAvailable?: number;
      note?: string;
    }) => {
      const res = await apiClient.post('/v1/availability', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['capacity'] });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (availabilityId: string) => {
      const res = await apiClient.delete(`/v1/availability/${availabilityId}`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['capacity'] });
    },
  });
}

// Backward-compatible hook
export const useCapacity = (sprintId?: string) => {
  const query = useSprintCapacity(sprintId);
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error ? (query.error as any).message : null,
    refetch: query.refetch,
  };
};

export default useCapacity;
