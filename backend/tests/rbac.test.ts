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
      expect(hasPermission('member', 'budget:read')).toBe(false);
      expect(hasPermission('member', 'client:read')).toBe(false);
      expect(hasPermission('member', 'report:read')).toBe(false);
    });

    it('should restrict teamLeader from budgets, clients, and executive reports', () => {
      expect(hasPermission('teamLeader', 'task:create')).toBe(true);
      expect(hasPermission('teamLeader', 'time:approve')).toBe(true);
      expect(hasPermission('teamLeader', 'budget:read')).toBe(false);
      expect(hasPermission('teamLeader', 'client:read')).toBe(false);
      expect(hasPermission('teamLeader', 'report:read')).toBe(false);
    });

    it('should restrict hr to people ops and reports, denying budgets and client management', () => {
      expect(hasPermission('hr', 'user:invite')).toBe(true);
      expect(hasPermission('hr', 'report:read')).toBe(true);
      expect(hasPermission('hr', 'budget:read')).toBe(false);
      expect(hasPermission('hr', 'client:read')).toBe(false);
      expect(hasPermission('hr', 'client:create')).toBe(false);
    });

    it('should allow manager to read and write budgets and manage clients', () => {
      expect(hasPermission('manager', 'budget:read')).toBe(true);
      expect(hasPermission('manager', 'budget:write')).toBe(true);
      expect(hasPermission('manager', 'client:read')).toBe(true);
      expect(hasPermission('manager', 'client:create')).toBe(true);
    });

    it('should restrict viewer to read-only access and deny clients and reports', () => {
      expect(hasPermission('viewer', 'project:read')).toBe(true);
      expect(hasPermission('viewer', 'task:read')).toBe(true);
      expect(hasPermission('viewer', 'task:create')).toBe(false);
      expect(hasPermission('viewer', 'time:log')).toBe(false);
      expect(hasPermission('viewer', 'time:approve')).toBe(false);
      expect(hasPermission('viewer', 'client:read')).toBe(false);
      expect(hasPermission('viewer', 'report:read')).toBe(false);
    });
  });

  describe('assertPermission()', () => {
    it('should not throw if permission is present', () => {
      expect(() => assertPermission('manager', 'time:approve')).not.toThrow();
      expect(() => assertPermission('manager', 'budget:read')).not.toThrow();
    });

    it('should throw ForbiddenError if permission is missing', () => {
      expect(() => assertPermission('member', 'time:approve')).toThrow(ForbiddenError);
      expect(() => assertPermission('member', 'budget:read')).toThrow(ForbiddenError);
      expect(() => assertPermission('teamLeader', 'client:read')).toThrow(ForbiddenError);
      expect(() => assertPermission('hr', 'budget:write')).toThrow(ForbiddenError);
    });
  });
});
