import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel, UserRole } from '../models/User.js';
import { TenantModel } from '../models/Tenant.js';
import { ProjectModel } from '../models/Project.js';
import { InvitationModel } from '../models/Invitation.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { ValidationError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { getCurrencyForCountry } from '../utils/currency.js';
import { sendEmail } from '../utils/email.js';
import { ENV } from '../config/env.js';

const router = Router();

const JWT_SECRET = ENV.JWT_SECRET;
const JWT_REFRESH_SECRET = ENV.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = ENV.JWT_ACCESS_EXPIRES_IN;
const REFRESH_EXPIRES_IN = ENV.JWT_REFRESH_EXPIRES_IN;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateTokens(payload: { userId: string; id: string; name?: string; email: string; tenantId: string; role: string }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN as any });
  const refreshToken = jwt.sign({ userId: payload.userId, tenantId: payload.tenantId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });
  return { accessToken, refreshToken };
}

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user with credentials
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authenticated successfully, returns tokens and user profile
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendApiError(res, new ValidationError('Email and password are required'), 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user || !user.passwordHash) {
      return sendApiError(res, new UnauthorizedError('Invalid email or password'), 401);
    }

    if (!user.isActive) {
      return sendApiError(res, new UnauthorizedError('Account is deactivated'), 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return sendApiError(res, new UnauthorizedError('Invalid email or password'), 401);
    }

    const payload = {
      userId: user.userId,
      id: user.userId,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    const tokenHash = hashToken(refreshToken);
    await UserModel.updateOne({ userId: user.userId }, { $set: { refreshTokenHash: tokenHash } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return sendApiResponse(res, {
      accessToken,
      user: {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 2. POST /api/auth/register
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  country: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  subdomain: z
    .string()
    .min(3, 'Workspace identifier must be 3-30 characters')
    .max(30, 'Workspace identifier must be 3-30 characters')
    .regex(/^[a-z0-9-]+$/, 'Workspace identifier can only contain lowercase letters, numbers, and hyphens'),
  teamSize: z.string().optional(),
  primaryUseCase: z.string().optional(),
  methodology: z.string().optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors), 422);
    }

    const { name, email, password, orgName, country, subdomain, teamSize, primaryUseCase, methodology } = parseResult.data;
    const reserved = ['admin', 'api', 'app', 'www', 'mail', 'support', 'staging'];
    if (reserved.includes(subdomain)) {
      return sendApiError(res, { code: 'SUBDOMAIN_RESERVED', message: 'This workspace identifier is reserved' }, 400);
    }

    const existingTenant = await TenantModel.findOne({ slug: subdomain });
    if (existingTenant) {
      return sendApiError(res, { code: 'SUBDOMAIN_EXISTS', message: 'Workspace URL is already taken' }, 409);
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendApiError(res, { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tenantId = `tnt_${subdomain}`;
    const userId = generateId('user');

    let resolvedCurrency = parseResult.data.currency;
    let resolvedSymbol = parseResult.data.currencySymbol;
    if ((!resolvedCurrency || !resolvedSymbol) && country) {
      const match = getCurrencyForCountry(country);
      if (match) {
        resolvedCurrency = resolvedCurrency || match.code;
        resolvedSymbol = resolvedSymbol || match.symbol;
      }
    }

    const tenant = await TenantModel.create({
      tenantId,
      name: orgName,
      slug: subdomain,
      status: 'active',
      country: country || '',
      settings: {
        currency: resolvedCurrency || 'USD',
        currencySymbol: resolvedSymbol || '$',
        plan: 'Free',
        teamSize: teamSize || '1-5',
        primaryUseCase: primaryUseCase || 'engineering',
        methodology: methodology || 'agile_scrum',
      },
    });

    const user = await UserModel.create({
      userId,
      tenantId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'orgAdmin',
      provider: 'email',
      emailVerified: true,
      isActive: true,
    });

    const payload = {
      userId: user.userId,
      id: user.userId,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    const tokenHash = hashToken(refreshToken);
    await UserModel.updateOne({ userId: user.userId }, { $set: { refreshTokenHash: tokenHash } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return sendApiResponse(res, {
      accessToken,
      tenant: { id: tenant.tenantId, name: tenant.name, slug: tenant.slug },
      user: {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
    }, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 2b. POST /api/auth/signup (Initial user account registration before workspace onboarding)
const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parseResult = SignupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors), 422);
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendApiError(res, { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateId('user');

    const user = await UserModel.create({
      userId,
      tenantId: 'pending',
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      role: 'orgAdmin',
      provider: 'email',
      emailVerified: true,
      isActive: true,
    });

    const payload = {
      userId: user.userId,
      id: user.userId,
      name: user.name,
      email: user.email,
      tenantId: 'pending',
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    const tokenHash = hashToken(refreshToken);
    await UserModel.updateOne({ userId: user.userId }, { $set: { refreshTokenHash: tokenHash } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return sendApiResponse(res, {
      accessToken,
      user: payload,
    }, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 2c. POST /api/auth/create-workspace (Multi-step wizard workspace creation for authenticated user)
const CreateWorkspaceSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(3, 'Workspace identifier must be 3-30 characters')
    .max(30, 'Workspace identifier must be 3-30 characters')
    .regex(/^[a-z0-9-]+$/, 'Workspace identifier can only contain lowercase letters, numbers, and hyphens'),
  country: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  teamSize: z.string().optional(),
  primaryUseCase: z.string().optional(),
  methodology: z.string().optional(),
  starterProjectName: z.string().optional(),
});

router.post('/create-workspace', verifyAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = CreateWorkspaceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors), 422);
    }

    const {
      orgName,
      subdomain,
      country,
      teamSize,
      primaryUseCase,
      methodology,
      starterProjectName,
    } = parseResult.data;

    const cleanSubdomain = subdomain.toLowerCase().trim();
    const reserved = ['admin', 'api', 'app', 'www', 'mail', 'support', 'staging', 'platform', 'root'];
    if (reserved.includes(cleanSubdomain)) {
      return sendApiError(res, { code: 'SUBDOMAIN_RESERVED', message: 'This workspace identifier is reserved' }, 400);
    }

    const existingTenant = await TenantModel.findOne({ slug: cleanSubdomain });
    if (existingTenant) {
      return sendApiError(res, { code: 'SUBDOMAIN_EXISTS', message: 'Workspace URL is already taken. Please choose another.' }, 409);
    }

    const tenantId = `tnt_${cleanSubdomain}`;

    let resolvedCurrency = parseResult.data.currency;
    let resolvedSymbol = parseResult.data.currencySymbol;
    if ((!resolvedCurrency || !resolvedSymbol) && country) {
      const match = getCurrencyForCountry(country);
      if (match) {
        resolvedCurrency = resolvedCurrency || match.code;
        resolvedSymbol = resolvedSymbol || match.symbol;
      }
    }

    const tenant = await TenantModel.create({
      tenantId,
      name: orgName.trim(),
      slug: cleanSubdomain,
      status: 'active',
      country: country || '',
      settings: {
        currency: resolvedCurrency || 'USD',
        currencySymbol: resolvedSymbol || '$',
        plan: 'Free',
        teamSize: teamSize || '1-5',
        primaryUseCase: primaryUseCase || 'engineering',
        methodology: methodology || 'agile_scrum',
      },
    });

    const updatedUser = await UserModel.findOneAndUpdate(
      { userId: req.user!.userId },
      { tenantId, role: 'orgAdmin' },
      { new: true }
    );

    // Provision optional starter project
    if (starterProjectName && starterProjectName.trim()) {
      const projectId = generateId('project');
      await ProjectModel.create({
        projectId,
        tenantId,
        name: starterProjectName.trim(),
        description: 'Starter project generated during workspace onboarding',
        methodology: methodology === 'waterfall' ? 'Waterfall' : 'Agile',
        status: 'Active',
        members: [{ userId: req.user!.userId, role: 'manager' }],
        phases: [
          { id: 'phase_1', name: 'Planning & Discovery', color: '#1B4D3E' },
          { id: 'phase_2', name: 'Sprint Execution', color: '#34D399' },
          { id: 'phase_3', name: 'Launch & Review', color: '#8ABDA9' },
        ],
      });
    }

    const payload = {
      userId: req.user!.userId,
      id: req.user!.userId,
      name: updatedUser?.name || req.user!.name,
      email: updatedUser?.email || req.user!.email,
      tenantId,
      role: 'orgAdmin' as UserRole,
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    const tokenHash = hashToken(refreshToken);
    await UserModel.updateOne({ userId: req.user!.userId }, { $set: { refreshTokenHash: tokenHash } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return sendApiResponse(res, {
      accessToken,
      tenant: { id: tenant.tenantId, name: tenant.name, slug: tenant.slug },
      user: payload,
    }, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 2d. GET /api/auth/check-slug/:slug (Real-time slug availability check)
router.get('/check-slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const clean = slug.toLowerCase().trim();
    const reserved = ['admin', 'api', 'app', 'www', 'mail', 'support', 'staging', 'platform', 'root'];
    if (reserved.includes(clean)) {
      return sendApiResponse(res, { available: false, reason: 'Reserved word' });
    }
    const tenant = await TenantModel.findOne({ slug: clean });
    return sendApiResponse(res, { available: !tenant });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 3. POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return sendApiError(res, new UnauthorizedError('Refresh token required'), 401);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return sendApiError(res, new UnauthorizedError('Invalid or expired refresh token'), 401);
    }

    const user = await UserModel.findOne({ userId: decoded.userId }).select('+refreshTokenHash');
    if (!user || !user.isActive) {
      return sendApiError(res, new UnauthorizedError('User account not found or inactive'), 401);
    }

    const incomingHash = hashToken(refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
      return sendApiError(res, new UnauthorizedError('Refresh token has been revoked or expired'), 401);
    }

    const payload = {
      userId: user.userId,
      id: user.userId,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    // Rotate: Issue new token pair and update hash in DB
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(payload);
    const newHash = hashToken(newRefreshToken);
    await UserModel.updateOne({ userId: user.userId }, { $set: { refreshTokenHash: newHash } });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return sendApiResponse(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 4. POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      const incomingHash = hashToken(refreshToken);
      await UserModel.updateOne({ refreshTokenHash: incomingHash }, { $set: { refreshTokenHash: null } });
    }
  } catch {
    // Non-blocking cleanup
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return sendApiResponse(res, { message: 'Logged out successfully' });
});

// 5. GET /api/auth/me
router.get('/me', verifyAuth, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findOne({ userId: req.user!.userId }).select('-passwordHash');
    if (!user) {
      return sendApiError(res, new UnauthorizedError('User not found'), 404);
    }
    const tenant = await TenantModel.findOne({ tenantId: user.tenantId });
    return sendApiResponse(res, {
      user: {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
        avatarUrl: user.avatarUrl,
        department: user.department,
      },
      tenant: tenant ? {
        id: tenant.tenantId,
        name: tenant.name,
        slug: tenant.slug,
        settings: tenant.settings,
      } : null,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 6. GET /api/auth/invite-details
router.get('/invite-details', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return sendApiError(res, new ValidationError('Invitation token is required'), 400);
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invitation = await InvitationModel.findOne({ tokenHash, status: 'pending' });
    if (!invitation || new Date() > invitation.expiresAt) {
      return sendApiError(res, new UnauthorizedError('Invitation is invalid or has expired'), 401);
    }
    const tenant = await TenantModel.findOne({ tenantId: invitation.tenantId });
    return sendApiResponse(res, {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      department: invitation.department,
      workspaceName: tenant?.name || 'WorkSphere Workspace',
      expiresAt: invitation.expiresAt,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// 7. POST /api/auth/accept-invite
const AcceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  name: z.string().optional(),
});

router.post('/accept-invite', async (req: Request, res: Response) => {
  try {
    const parseResult = AcceptInviteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors), 422);
    }

    const { token, password, name } = parseResult.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await InvitationModel.findOne({
      tokenHash,
      status: 'pending',
    });

    if (!invitation) {
      return sendApiError(res, new UnauthorizedError('Invalid or expired invitation token'), 401);
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return sendApiError(res, new UnauthorizedError('This invitation link has expired'), 401);
    }

    const tenant = await TenantModel.findOne({ tenantId: invitation.tenantId });
    if (!tenant) {
      return sendApiError(res, new NotFoundError('Workspace not found'), 404);
    }

    const existingInTenant = await UserModel.findOne({
      tenantId: invitation.tenantId,
      email: invitation.email,
    });
    if (existingInTenant) {
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      await invitation.save();
      return sendApiError(res, new ConflictError('You are already a member of this workspace. Please log in.'), 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateId('user');

    const newUser = await UserModel.create({
      userId,
      tenantId: invitation.tenantId,
      email: invitation.email,
      name: name?.trim() || invitation.name,
      role: invitation.role,
      department: invitation.department,
      passwordHash,
      provider: 'email',
      emailVerified: true,
      isActive: true,
    });

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    const payload = {
      userId: newUser.userId,
      id: newUser.userId,
      name: newUser.name,
      email: newUser.email,
      tenantId: newUser.tenantId,
      role: newUser.role,
    };

    const { accessToken, refreshToken } = generateTokens(payload);
    const refreshTokenHash = hashToken(refreshToken);
    await UserModel.updateOne({ userId: newUser.userId }, { $set: { refreshTokenHash } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return sendApiResponse(
      res,
      {
        accessToken,
        tenant: { id: tenant.tenantId, name: tenant.name, slug: tenant.slug },
        user: {
          id: newUser.userId,
          userId: newUser.userId,
          name: newUser.name,
          email: newUser.email,
          tenantId: newUser.tenantId,
          role: newUser.role,
          department: newUser.department,
        },
      },
      201
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const parseResult = ForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors), 422);
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await UserModel.findOne({ email: normalizedEmail, isActive: true });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);

      user.resetPasswordTokenHash = tokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

      await sendEmail({
        to: user.email,
        subject: 'Reset Your WorkSphere Password',
        text: `Hello ${user.name},\n\nYou recently requested to reset your password for your WorkSphere account.\n\nPlease click the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please safely ignore this email.`,
        html: `<p>Hello ${user.name},</p><p>You recently requested to reset your password for your WorkSphere account.</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;">Reset Password</a></p><p>Or copy and paste this link: <br/><a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 1 hour. If you did not request this, please safely ignore this email.</p>`,
      });
    }

    // Always respond with success to prevent user enumeration
    return sendApiResponse(res, {
      message: 'If an account with that email exists, password reset instructions have been sent.',
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const parseResult = ResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors), 422);
    }

    const { token, password } = parseResult.data;
    const tokenHash = hashToken(token);

    const user = await UserModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return sendApiError(res, new UnauthorizedError('Invalid or expired password reset token'), 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    user.passwordHash = passwordHash;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    user.refreshTokenHash = null; // Invalidate current refresh tokens for security
    user.updatedAt = new Date();
    await user.save();

    return sendApiResponse(res, {
      message: 'Password has been successfully reset. You may now log in with your new credentials.',
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
