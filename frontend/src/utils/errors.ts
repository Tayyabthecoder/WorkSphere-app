import { AxiosError } from 'axios';

/**
 * Extracts a human-readable error message from an unknown error, AxiosError, or API response error.
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') {
    return error;
  }

  // Axios error detection
  if (isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (typeof data?.error === 'string') {
      return data.error;
    }
    if (data?.message) {
      return data.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === 'string') return errObj.message;
    if (typeof errObj.error === 'string') return errObj.error;
  }

  return fallbackMessage;
}

/**
 * Type guard for Axios errors.
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error && (error as any).isAxiosError === true;
}

/**
 * Checks if the error was caused by a network timeout or dropped connection.
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === 'ERR_NETWORK' || !error.response;
  }
  return false;
}

/**
 * Formats API errors for display in toast or alerts.
 */
export function formatApiError(error: unknown): { title: string; description: string } {
  const message = getErrorMessage(error);
  let title = 'Request Failed';

  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) title = 'Unauthorized';
    else if (status === 403) title = 'Access Forbidden';
    else if (status === 404) title = 'Not Found';
    else if (status === 422) title = 'Validation Error';
    else if (status && status >= 500) title = 'Server Error';
  }

  return { title, description: message };
}
