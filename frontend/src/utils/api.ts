export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: ApiMeta | null;
  error?: ApiErrorPayload | null;
}

/**
 * Extracts data payload from a standard API response or returns the raw response.
 */
export function extractData<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const resObj = response as { data: unknown };
    if (resObj.data && typeof resObj.data === 'object' && 'data' in resObj.data && 'success' in resObj.data) {
      return (resObj.data as ApiResponse<T>).data;
    }
    return resObj.data as T;
  }
  return response as T;
}

/**
 * Extracts metadata payload from a standard API response.
 */
export function extractMeta(response: unknown): ApiMeta | null {
  if (response && typeof response === 'object' && 'data' in response) {
    const resObj = response as { data: unknown };
    if (resObj.data && typeof resObj.data === 'object' && 'meta' in resObj.data) {
      return (resObj.data as ApiResponse).meta || null;
    }
  }
  return null;
}

/**
 * Formats a key-value dictionary into a query parameter string.
 */
export function buildQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Checks if a response indicates success.
 */
export function isApiSuccess(response: unknown): boolean {
  if (response && typeof response === 'object') {
    const res = response as { success?: boolean; data?: { success?: boolean } };
    if (typeof res.success === 'boolean') return res.success;
    if (res.data && typeof res.data.success === 'boolean') return res.data.success;
  }
  return false;
}
