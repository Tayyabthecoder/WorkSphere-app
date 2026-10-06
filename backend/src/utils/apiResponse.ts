import { Response } from 'express';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export function sendApiResponse<T>(res: Response, data: T, status = 200, meta?: ApiMeta) {
  return res.status(status).json({
    success: true,
    data,
    meta: meta || null,
    error: null,
  });
}

export function sendApiError(
  res: Response,
  error: { code?: string; message: string; details?: unknown } | unknown,
  status = 400
) {
  let code = 'BAD_REQUEST';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string') code = err.code as string;
    if (typeof err.message === 'string') message = err.message as string;
    if (err.details !== undefined) details = err.details;
  } else if (typeof error === 'string') {
    message = error;
  }

  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
}
