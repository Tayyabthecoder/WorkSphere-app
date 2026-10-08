import { hasPermission, assertPermission } from '../src/middleware/rbac.js';
import { ForbiddenError } from '../src/utils/errors.js';

describe('RBAC Middleware & Permissions', () => {
  describe('hasPermission()', () => {
    it('should grant superAdmin complete tenant administration privileges', () => {
      expect(hasPermission('superAdmin', 'tenant:manage')).toBe(true);
      expect(hasPermission('superAdmin', 'project:delete')).toBe(true);
      expect(hasPermission('superAdmin', 'time:approve')).toBe(true);
      expect(hasPermission('superAdmin', 'comment:delete')).toBe(true);
    });

    it('should grant orgAdmin management and approval permissions', () => {
      expect(hasPermission('orgAdmin', 'project:create')).toBe(true);
      expect(hasPermission('orgAdmin', 'time:approve')).toBe(true);
      expect(hasPermission('orgAdmin', 'comment:create')).toBe(true);
      expect(hasPermission('orgAdmin', 'tenant:manage')).toBe(false);
    });

    it('should grant manager timesheet approval and project management permissions', () => {
      expect(hasPermission('manager', 'time:approve')).toBe(true);
      expect(hasPermission('manager', 'task:create')).toBe(true);
      expect(hasPermission('manager', 'user:deactivate')).toBe(true);
      expect(hasPermission('manager', 'tenant:manage')).toBe(false);
    });

    it('should grant member task and comment abilities, but deny approval', () => {
      expect(hasPermission('member', 'task:create')).toBe(true);
      expect(hasPermission('member', 'time:log')).toBe(true);
      expect(hasPermission('member', 'comment:create')).toBe(true);
      expect(hasPermission('member', 'time:approve')).toBe(false);
      expect(hasPermission('member', 'budget:write')).toBe(false);
    });

    it('should restrict viewer to read-only access', () => {
      expect(hasPermission('viewer', 'project:read')).toBe(true);
      expect(hasPermission('viewer', 'task:read')).toBe(true);
      expect(hasPermission('viewer', 'task:create')).toBe(false);
      expect(hasPermission('viewer', 'time:log')).toBe(false);
      expect(hasPermission('viewer', 'time:approve')).toBe(false);
    });
  });

  describe('assertPermission()', () => {
    it('should not throw if permission is present', () => {
      expect(() => assertPermission('manager', 'time:approve')).not.toThrow();
    });

    it('should throw ForbiddenError if permission is missing', () => {
      expect(() => assertPermission('member', 'time:approve')).toThrow(ForbiddenError);
    });
  });
});
