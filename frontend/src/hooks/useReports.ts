import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface ReportsFilterParams {
  timeHorizon?: 'sprint' | 'month' | 'quarter';
  from?: string;
  to?: string;
}

export const useReportsSummary = (params?: ReportsFilterParams) =>
  useQuery({
    queryKey: ['reports-summary', params],
    queryFn: async () => {
      const res = await apiClient.get('/v1/reports/summary', { params });
      return res.data.data;
    },
  });
