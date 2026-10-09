import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { canCallerManageMember, canManageRole } from '../src/middleware/rbac.js';
import { generateId } from '../src/utils/id.js';
import { TeamModel } from '../src/models/Team.js';

describe('Teams & Squad Boundary Management Architecture', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateId("team")', () => {
    it('should generate team entity IDs with team_ prefix', () => {
      const teamId = generateId('team');
      expect(teamId).toMatch(/^team_[a-f0-9]{16}$/);
    });
  });

  describe('Hierarchical Authority for Org Chart Roles', () => {
    it('should allow Org Admin to manage Managing Director, HR, Managers, Team Leaders, and Members', () => {
      expect(canManageRole('orgAdmin', 'managingDirector')).toBe(true);
      expect(canManageRole('orgAdmin', 'hr')).toBe(true);
      expect(canManageRole('orgAdmin', 'manager')).toBe(true);
      expect(canManageRole('orgAdmin', 'teamLeader')).toBe(true);
      expect(canManageRole('orgAdmin', 'member')).toBe(true);
      expect(canManageRole('orgAdmin', 'viewer')).toBe(true);
      expect(canManageRole('orgAdmin', 'superAdmin')).toBe(false);
    });

    it('should allow Managing Director to manage HR, Managers, Team Leaders, and Members', () => {
      expect(canManageRole('managingDirector', 'hr')).toBe(true);
      expect(canManageRole('managingDirector', 'manager')).toBe(true);
      expect(canManageRole('managingDirector', 'teamLeader')).toBe(true);
      expect(canManageRole('managingDirector', 'member')).toBe(true);
      expect(canManageRole('managingDirector', 'viewer')).toBe(true);
      expect(canManageRole('managingDirector', 'orgAdmin')).toBe(false);
      expect(canManageRole('managingDirector', 'superAdmin')).toBe(false);
    });

    it('should allow HR to manage Managers, Team Leaders, Members, and Viewers', () => {
      expect(canManageRole('hr', 'manager')).toBe(true);
      expect(canManageRole('hr', 'teamLeader')).toBe(true);
      expect(canManageRole('hr', 'member')).toBe(true);
      expect(canManageRole('hr', 'viewer')).toBe(true);
      expect(canManageRole('hr', 'managingDirector')).toBe(false);
      expect(canManageRole('hr', 'orgAdmin')).toBe(false);
    });

    it('should restrict Manager to Team Leaders, Members, and Viewers', () => {
      expect(canManageRole('manager', 'teamLeader')).toBe(true);
      expect(canManageRole('manager', 'member')).toBe(true);
      expect(canManageRole('manager', 'viewer')).toBe(true);
      expect(canManageRole('manager', 'manager')).toBe(false);
      expect(canManageRole('manager', 'hr')).toBe(false);
      expect(canManageRole('manager', 'managingDirector')).toBe(false);
      expect(canManageRole('manager', 'orgAdmin')).toBe(false);
    });

    it('should restrict Team Leader from administrative role management', () => {
      expect(canManageRole('teamLeader', 'member')).toBe(false);
      expect(canManageRole('teamLeader', 'viewer')).toBe(false);
      expect(canManageRole('teamLeader', 'manager')).toBe(false);
    });
  });

  describe('canCallerManageMember() Scoped Boundary Verification', () => {
    const tenantId = 'tnt_acme';

    it('should prevent callers from managing themselves', async () => {
      const caller = { userId: 'usr_admin', role: 'orgAdmin' as const, tenantId };
      const target = { userId: 'usr_admin', role: 'orgAdmin' as const };
      const result = await canCallerManageMember(caller, target);
      expect(result).toBe(false);
    });

    it('should grant Org Admin and Managing Director company-wide authority', async () => {
      const orgAdmin = { userId: 'usr_admin', role: 'orgAdmin' as const, tenantId };
      const md = { userId: 'usr_md', role: 'managingDirector' as const, tenantId };
      const memberInTeam1 = { userId: 'usr_m1', role: 'member' as const, teamId: 'team_alpha' };

      expect(await canCallerManageMember(orgAdmin, memberInTeam1)).toBe(true);
      expect(await canCallerManageMember(md, memberInTeam1)).toBe(true);
    });

    it('should grant HR company-wide authority over members and managers', async () => {
      const hr = { userId: 'usr_hr', role: 'hr' as const, tenantId };
      const memberInTeam2 = { userId: 'usr_m2', role: 'member' as const, teamId: 'team_beta' };
      const manager1 = { userId: 'usr_mgr1', role: 'manager' as const, teamId: 'team_alpha' };

      expect(await canCallerManageMember(hr, memberInTeam2)).toBe(true);
      expect(await canCallerManageMember(hr, manager1)).toBe(true);
    });

    it('should allow Manager 1 to manage members in their OWN team (Team 1)', async () => {
      const manager1 = { userId: 'usr_mgr1', role: 'manager' as const, tenantId };
      const memberInTeam1 = { userId: 'usr_m1', role: 'member' as const, teamId: 'team_alpha' };

      jest.spyOn(TeamModel, 'findOne').mockResolvedValue({
        teamId: 'team_alpha',
        managerId: 'usr_mgr1',
        isActive: true,
      } as any);

      const allowed = await canCallerManageMember(manager1, memberInTeam1);
      expect(allowed).toBe(true);
      expect(TeamModel.findOne).toHaveBeenCalledWith({
        tenantId,
        teamId: 'team_alpha',
        managerId: 'usr_mgr1',
        isActive: true,
      });
    });

    it('should allow Manager 1 to manage team leader in their OWN team (Team 1)', async () => {
      const manager1 = { userId: 'usr_mgr1', role: 'manager' as const, tenantId };
      const leadInTeam1 = { userId: 'usr_lead1', role: 'teamLeader' as const, teamId: 'team_alpha' };

      jest.spyOn(TeamModel, 'findOne').mockResolvedValue({
        teamId: 'team_alpha',
        managerId: 'usr_mgr1',
        isActive: true,
      } as any);

      const allowed = await canCallerManageMember(manager1, leadInTeam1);
      expect(allowed).toBe(true);
    });

    it('should STRICTLY FORBID Manager 1 from managing team leader in Manager 2 squad (Team 2)', async () => {
      const manager1 = { userId: 'usr_mgr1', role: 'manager' as const, tenantId };
      const leadInTeam2 = { userId: 'usr_lead2', role: 'teamLeader' as const, teamId: 'team_beta' };

      jest.spyOn(TeamModel, 'findOne').mockResolvedValue(null as any);

      const allowed = await canCallerManageMember(manager1, leadInTeam2);
      expect(allowed).toBe(false);
    });
  });
});

