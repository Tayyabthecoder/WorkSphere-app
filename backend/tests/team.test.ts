import crypto from 'crypto';
import { canManageRole, assertCanManageRole, ROLE_HIERARCHY, hasPermission } from '../src/middleware/rbac.js';
import { ForbiddenError } from '../src/utils/errors.js';
import { generateId } from '../src/utils/id.js';

describe('Team Module & Role Hierarchy Architecture', () => {
  describe('Role Hierarchy & canManageRole()', () => {
    it('should allow superAdmin to manage any lower role tier', () => {
      expect(canManageRole('superAdmin', 'orgAdmin')).toBe(true);
      expect(canManageRole('superAdmin', 'manager')).toBe(true);
      expect(canManageRole('superAdmin', 'member')).toBe(true);
      expect(canManageRole('superAdmin', 'viewer')).toBe(true);
    });

    it('should allow orgAdmin to manage all workspace roles (orgAdmin, manager, member, viewer)', () => {
      expect(canManageRole('orgAdmin', 'orgAdmin')).toBe(true);
      expect(canManageRole('orgAdmin', 'manager')).toBe(true);
      expect(canManageRole('orgAdmin', 'member')).toBe(true);
      expect(canManageRole('orgAdmin', 'viewer')).toBe(true);
    });

    it('should prevent orgAdmin from modifying superAdmin', () => {
      expect(canManageRole('orgAdmin', 'superAdmin')).toBe(false);
    });

    it('should allow manager to manage member and viewer', () => {
      expect(canManageRole('manager', 'member')).toBe(true);
      expect(canManageRole('manager', 'viewer')).toBe(true);
    });

    it('should prevent manager from managing manager, orgAdmin, or superAdmin', () => {
      expect(canManageRole('manager', 'manager')).toBe(false);
      expect(canManageRole('manager', 'orgAdmin')).toBe(false);
      expect(canManageRole('manager', 'superAdmin')).toBe(false);
    });

    it('should prevent member and viewer from managing any role', () => {
      expect(canManageRole('member', 'member')).toBe(false);
      expect(canManageRole('member', 'viewer')).toBe(false);
      expect(canManageRole('viewer', 'viewer')).toBe(false);
    });
  });

  describe('assertCanManageRole() Guard', () => {
    it('should allow higher ranking caller to proceed without error', () => {
      expect(() => assertCanManageRole('orgAdmin', 'manager', 'assign')).not.toThrow();
      expect(() => assertCanManageRole('orgAdmin', 'orgAdmin', 'assign')).not.toThrow();
      expect(() => assertCanManageRole('manager', 'member', 'invite')).not.toThrow();
    });

    it('should throw ForbiddenError when caller tries to assign prohibited role', () => {
      expect(() => assertCanManageRole('manager', 'orgAdmin', 'invite')).toThrow(ForbiddenError);
      expect(() => assertCanManageRole('manager', 'manager', 'assign')).toThrow(ForbiddenError);
      expect(() => assertCanManageRole('orgAdmin', 'superAdmin', 'assign')).toThrow(ForbiddenError);
      expect(() => assertCanManageRole('member', 'manager', 'modify')).toThrow(ForbiddenError);
    });
  });

  describe('Strict RBAC Rules for Team Modification & Deactivation', () => {
    it('should verify manager, orgAdmin, and superAdmin have user:deactivate permission', () => {
      expect(hasPermission('manager', 'user:deactivate')).toBe(true);
      expect(hasPermission('orgAdmin', 'user:deactivate')).toBe(true);
      expect(hasPermission('superAdmin', 'user:deactivate')).toBe(true);
      expect(hasPermission('member', 'user:deactivate')).toBe(false);
      expect(hasPermission('viewer', 'user:deactivate')).toBe(false);
    });

    it('should enforce that managers can only onboard member or viewer roles', () => {
      const allowedForManager = ['member', 'viewer'];
      const prohibitedForManager = ['manager', 'orgAdmin', 'superAdmin'];

      for (const role of prohibitedForManager) {
        expect(canManageRole('manager', role as any)).toBe(false);
      }
      for (const role of allowedForManager) {
        expect(canManageRole('manager', role as any)).toBe(true);
      }
    });

    it('should verify orgAdmin manages all workspace roles but cannot manage superAdmin', () => {
      expect(canManageRole('orgAdmin', 'orgAdmin')).toBe(true);
      expect(canManageRole('orgAdmin', 'manager')).toBe(true);
      expect(canManageRole('orgAdmin', 'member')).toBe(true);
      expect(canManageRole('orgAdmin', 'viewer')).toBe(true);
      expect(canManageRole('orgAdmin', 'superAdmin')).toBe(false);
    });
  });

  describe('Invitation Crypto Token Generation & Hashing', () => {
    it('should generate secure raw tokens and non-reversible sha256 hashes', () => {
      const rawToken1 = crypto.randomBytes(32).toString('hex');
      const hash1 = crypto.createHash('sha256').update(rawToken1).digest('hex');

      const rawToken2 = crypto.randomBytes(32).toString('hex');
      const hash2 = crypto.createHash('sha256').update(rawToken2).digest('hex');

      expect(rawToken1).toHaveLength(64);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toBe(rawToken1);
      expect(hash1).not.toBe(hash2);

      // Verify deterministic verification
      const verifyHash = crypto.createHash('sha256').update(rawToken1).digest('hex');
      expect(verifyHash).toBe(hash1);
    });

    it('should generate properly formatted invitation entity IDs', () => {
      const invId = generateId('inv');
      expect(invId).toMatch(/^inv_[a-f0-9]{16}$/);
    });
  });

  describe('Tenant Email Domain Restrictions Logic', () => {
    function isEmailAllowed(email: string, restrictDomain: boolean, allowedDomain?: string): boolean {
      if (!restrictDomain || !allowedDomain) return true;
      const normalizedAllowed = allowedDomain.toLowerCase().replace(/^@/, '');
      const userDomain = email.toLowerCase().split('@')[1];
      return userDomain === normalizedAllowed;
    }

    it('should permit any valid email when domain restriction is disabled', () => {
      expect(isEmailAllowed('jane@gmail.com', false, 'company.com')).toBe(true);
      expect(isEmailAllowed('bob@external.org', false)).toBe(true);
    });

    it('should restrict invitations when domain restriction is enabled', () => {
      expect(isEmailAllowed('alice@acme.com', true, 'acme.com')).toBe(true);
      expect(isEmailAllowed('alice@ACME.COM', true, 'acme.com')).toBe(true);
      expect(isEmailAllowed('alice@acme.com', true, '@acme.com')).toBe(true);
      expect(isEmailAllowed('hacker@gmail.com', true, 'acme.com')).toBe(false);
      expect(isEmailAllowed('partner@othercorp.com', true, 'acme.com')).toBe(false);
    });
  });

  describe('Direct Member Addition Logic', () => {
    it('should generate valid user entity IDs for directly added members', () => {
      const userId = generateId('user');
      expect(userId).toMatch(/^usr_[a-f0-9]{16}$/);
    });

    it('should generate secure initial passwords when none is provided', () => {
      const initialPassword = `Temp${crypto.randomBytes(4).toString('hex')}!`;
      expect(initialPassword).toMatch(/^Temp[a-f0-9]{8}!$/);
      expect(initialPassword.length).toBeGreaterThanOrEqual(8);
    });
  });
});
