import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.js';
import { TenantModel } from '../models/Tenant.js';
import { UnauthorizedError } from '../utils/errors.js';
import { sendApiError } from '../utils/apiResponse.js';
import { ENV } from '../config/env.js';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  name?: string;
  email: string;
  tenantId: string;
  role: UserRole;
  impersonated?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendApiError(res, new UnauthorizedError('Authentication token required'), 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = ENV.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
      name: decoded.name,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role,
      impersonated: !!decoded.impersonated,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendApiError(res, { code: 'TOKEN_EXPIRED', message: 'Token has expired' }, 401);
    }
    return sendApiError(res, new UnauthorizedError('Invalid authentication token'), 401);
  }
}

export async function verifyTenantActive(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return sendApiError(res, new UnauthorizedError('Authentication required'), 401);
    }
    // SuperAdmin has platform-wide authority
    if (user.role === 'superAdmin') {
      return next();
    }
    if (user.tenantId === 'pending') {
      return sendApiError(res, { code: 'WORKSPACE_PENDING', message: 'Workspace onboarding incomplete' }, 403);
    }
    const tenant = (await TenantModel.findOne({ tenantId: user.tenantId }).select('status').lean()) as any;
    if (!tenant || tenant.status !== 'active') {
      return sendApiError(
        res,
        { code: 'TENANT_INACTIVE', message: 'Workspace is suspended, archived, or does not exist' },
        403
      );
    }
    next();
  } catch (err: any) {
    return sendApiError(res, { code: 'SERVER_ERROR', message: 'Failed to verify workspace status' }, 500);
  }
}
