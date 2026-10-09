import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FolderKanban,
  UserCheck,
  User,
  Crown,
  HeartHandshake,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { TeamMember, Team } from '../../../types';

interface OrgChartViewProps {
  members: TeamMember[];
  teams: Team[];
  onMemberSelect?: (member: TeamMember) => void;
}

export const OrgChartView: React.FC<OrgChartViewProps> = ({
  members,
  teams,
  onMemberSelect,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Group members by their organizational role tier
  const orgAdmins = useMemo(
    () => members.filter((m) => m.isActive && (m.role === 'orgAdmin' || m.role === 'superAdmin')),
    [members]
  );

  const managingDirectors = useMemo(
    () => members.filter((m) => m.isActive && m.role === 'managingDirector'),
    [members]
  );

  const hrPersonnel = useMemo(
    () => members.filter((m) => m.isActive && m.role === 'hr'),
    [members]
  );

  const managers = useMemo(
    () => members.filter((m) => m.isActive && m.role === 'manager'),
    [members]
  );

  // Fallbacks: If no explicit Managing Director or HR is configured yet, pick senior managers or prompt to assign
  const rootAdmin = orgAdmins[0] || {
    userId: 'mock_orgAdmin',
    name: 'Org Admin',
    email: 'admin@company.com',
    role: 'orgAdmin',
    jobTitle: 'Organization Administrator',
    isActive: true,
  } as TeamMember;

  const mdLead = managingDirectors[0] || (managers.length > 0 ? null : {
    userId: 'mock_md',
    name: 'Managing Director',
    email: 'md@company.com',
    role: 'managingDirector',
    jobTitle: 'Executive Director',
    isActive: true,
  } as TeamMember);

  const hrLead = hrPersonnel[0] || null;

  // Search match helper
  const isMatch = (text?: string) => {
    if (!searchFilter.trim() || !text) return false;
    return text.toLowerCase().includes(searchFilter.trim().toLowerCase());
  };

  const isHighlighted = (member?: TeamMember | null, team?: Team | null) => {
    if (!searchFilter.trim()) return false;
    if (member && (isMatch(member.name) || isMatch(member.email) || isMatch(member.jobTitle))) return true;
    if (team && (isMatch(team.name) || isMatch(team.department))) return true;
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Interactive Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-3 rounded-xl border border-border">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Highlight employee, title, or squad..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
            />
          </div>

          <span className="text-[11px] text-text-muted hidden md:inline font-mono">
            {teams.length} Squads • {members.filter((m) => m.isActive).length} Employees
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.1).toFixed(1)))}
            className="p-1.5 text-text-muted hover:text-text-primary bg-surface-low hover:bg-surface-card rounded-lg border border-border text-xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-text-muted w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))}
            className="p-1.5 text-text-muted hover:text-text-primary bg-surface-low hover:bg-surface-card rounded-lg border border-border text-xs"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="px-2 py-1 text-text-muted hover:text-text-primary bg-surface-low hover:bg-surface-card rounded-lg border border-border text-[11px] font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Organizational Tree Viewport Canvas */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-auto bg-surface-low/60 rounded-2xl border border-border/80 p-8 min-h-[640px] flex justify-center items-start relative select-none"
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="flex flex-col items-center gap-8 min-w-max pb-12"
        >
          {/* LEVEL 0: ORG ADMIN */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => onMemberSelect?.(rootAdmin)}
              className={`group cursor-pointer relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 shadow-lg ${
                isHighlighted(rootAdmin)
                  ? 'border-brand-emerald ring-4 ring-brand-emerald/30 bg-surface-card scale-105'
                  : 'border-purple-500/70 bg-surface-card hover:border-purple-400 hover:shadow-purple-500/10'
              }`}
            >
              <div className="relative">
                <Avatar name={rootAdmin.name} src={rootAdmin.avatarUrl} size="md" />
                <div className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white p-1 rounded-full shadow-xs">
                  <Crown className="w-2.5 h-2.5" />
                </div>
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">{rootAdmin.name}</span>
                  <Badge variant="neutral" size="sm" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Org Admin
                  </Badge>
                </div>
                <span className="text-[10px] text-text-muted">{rootAdmin.jobTitle || 'Executive Leadership'}</span>
                <span className="text-[10px] text-text-muted font-mono">{rootAdmin.email}</span>
              </div>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-8 bg-border" />
          </div>

          {/* LEVEL 1: MANAGING DIRECTOR & HR STAFF BRANCH */}
          <div className="flex flex-col items-center">
            <div className="flex items-start justify-center gap-12 relative">
              {/* Horizontal Connecting Crossbar between MD and HR */}
              {hrLead && (
                <div className="absolute top-6 left-1/4 right-1/4 h-0.5 bg-border -z-10" />
              )}

              {/* Managing Director Node */}
              <div className="flex flex-col items-center">
                <div
                  onClick={() => mdLead && onMemberSelect?.(mdLead)}
                  className={`group cursor-pointer flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 shadow-md ${
                    isHighlighted(mdLead)
                      ? 'border-brand-emerald ring-4 ring-brand-emerald/30 bg-surface-card scale-105'
                      : 'border-blue-500/70 bg-surface-card hover:border-blue-400'
                  }`}
                >
                  <div className="relative">
                    <Avatar name={mdLead?.name || 'Managing Director'} src={mdLead?.avatarUrl} size="md" />
                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-xs">
                      <Shield className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">
                        {mdLead?.name || 'Managing Director'}
                      </span>
                      <Badge variant="neutral" size="sm" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        Executive
                      </Badge>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {mdLead?.jobTitle || 'Managing Director'}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">{mdLead?.email || 'md@company.com'}</span>
                  </div>
                </div>

                <div className="w-0.5 h-8 bg-border" />
              </div>

              {/* HR / People Ops Node (Staff Branch) */}
              {hrLead && (
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => onMemberSelect?.(hrLead)}
                    className={`group cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 shadow-md ${
                      isHighlighted(hrLead)
                        ? 'border-brand-emerald ring-4 ring-brand-emerald/30 bg-surface-card scale-105'
                        : 'border-emerald-500/70 bg-surface-card hover:border-emerald-400'
                    }`}
                  >
                    <div className="relative">
                      <Avatar name={hrLead.name} src={hrLead.avatarUrl} size="sm" />
                      <div className="absolute -top-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
                        <HeartHandshake className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary">{hrLead.name}</span>
                        <Badge variant="neutral" size="sm" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          HR Lead
                        </Badge>
                      </div>
                      <span className="text-[10px] text-text-muted">{hrLead.jobTitle || 'People Operations'}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-text-muted font-mono mt-1">Cross-Company Talent</span>
                </div>
              )}
            </div>
          </div>

          {/* LEVEL 2: MANAGERS LEVEL (Manager 1, Manager 2, Manager 3) */}
          <div className="flex flex-col items-center">
            {managers.length === 0 ? (
              <div className="p-4 bg-surface-card rounded-xl border border-dashed border-border text-center text-xs text-text-muted">
                No Managers assigned yet. Onboard members with the "Manager" role to populate squads.
              </div>
            ) : (
              <div className="flex items-start justify-center gap-12 relative">
                {/* Horizontal Spine connecting all managers */}
                {managers.length > 1 && (
                  <div className="absolute top-0 left-12 right-12 h-0.5 bg-border -z-10" />
                )}

                {managers.map((mgr) => {
                  const managerTeams = teams.filter((t) => t.managerId === mgr.userId);
                  const isCollapsed = Boolean(collapsedNodes[mgr.userId]);

                  return (
                    <div key={mgr.userId} className="flex flex-col items-center">
                      {/* Top connecting vertical stub */}
                      <div className="w-0.5 h-4 bg-border" />

                      {/* Manager Node Card */}
                      <div
                        onClick={() => onMemberSelect?.(mgr)}
                        className={`group cursor-pointer flex flex-col p-3.5 rounded-xl border-2 transition-all duration-200 shadow-md min-w-[220px] ${
                          isHighlighted(mgr)
                            ? 'border-brand-emerald ring-4 ring-brand-emerald/30 bg-surface-card scale-105'
                            : 'border-amber-500/70 bg-surface-card hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={mgr.name} src={mgr.avatarUrl} size="sm" />
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-bold text-text-primary group-hover:text-brand-emerald transition-colors">
                                {mgr.name}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {mgr.jobTitle || 'Squad Manager'}
                              </span>
                            </div>
                          </div>
                          <Badge variant="neutral" size="sm" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                            Manager
                          </Badge>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-text-muted">
                          <span>Oversees {managerTeams.length} Squads</span>
                          {managerTeams.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapse(mgr.userId);
                              }}
                              className="text-text-muted hover:text-text-primary p-0.5 rounded-sm hover:bg-surface-low"
                              title={isCollapsed ? 'Expand Squads' : 'Collapse Squads'}
                            >
                              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* LEVEL 3 & 4: TEAMS & MEMBERS UNDER THIS MANAGER */}
                      {!isCollapsed && managerTeams.length > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-6 bg-border" />

                          <div className="flex items-start justify-center gap-6 relative">
                            {/* Horizontal Bar connecting squads under this manager */}
                            {managerTeams.length > 1 && (
                              <div className="absolute top-0 left-8 right-8 h-0.5 bg-border -z-10" />
                            )}

                            {managerTeams.map((squad) => {
                              const squadMembers = squad.members || [];
                              const isSquadCollapsed = Boolean(collapsedNodes[squad.teamId]);

                              return (
                                <div key={squad.teamId} className="flex flex-col items-center">
                                  {/* Squad Vertical Inbound Stem */}
                                  <div className="w-0.5 h-4 bg-border" />

                                  {/* LEVEL 3: SQUAD (TEAM) NODE */}
                                  <div
                                    className={`flex flex-col p-3 rounded-xl border-2 transition-all duration-200 shadow-xs min-w-[190px] ${
                                      isHighlighted(undefined, squad)
                                        ? 'border-brand-emerald ring-2 ring-brand-emerald/40 bg-surface-card'
                                        : 'border-border/80 bg-surface-card hover:border-border'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: squad.colorLabel || '#0D9488' }}
                                        />
                                        <span className="text-xs font-bold text-text-primary truncate">
                                          {squad.name}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleCollapse(squad.teamId)}
                                        className="text-text-muted hover:text-text-primary p-0.5 rounded-sm"
                                        title={isSquadCollapsed ? 'Expand Members' : 'Collapse Members'}
                                      >
                                        {isSquadCollapsed ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronUp className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>

                                    <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                                      <span>{squad.department}</span>
                                      <Badge variant="neutral" size="sm">
                                        {squadMembers.length} Members
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* LEVEL 4: SQUAD MEMBERS (TEAM LEADER FEATURED AT TOP) */}
                                  {!isSquadCollapsed && squadMembers.length > 0 && (() => {
                                    const teamLeader = squad.leader
                                      ? (squadMembers.find((m) => m.userId === squad.leader?.userId) || squad.leader)
                                      : squadMembers.find((m) => m.userId === squad.leaderId || m.role === 'teamLeader');
                                    const regularMembers = squadMembers.filter((m) => m.userId !== teamLeader?.userId);

                                    return (
                                      <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-4 bg-border" />

                                        <div className="space-y-2 mt-1">
                                          {/* Featured Team Leader Node */}
                                          {teamLeader && (
                                            <div
                                              key={teamLeader.userId}
                                              onClick={() => onMemberSelect?.(teamLeader as any)}
                                              className={`group cursor-pointer flex items-center justify-between gap-3 p-2 rounded-lg border-2 transition-all duration-150 min-w-[190px] bg-teal-500/10 border-teal-500/40 hover:border-teal-400 ${
                                                isHighlighted(teamLeader as any)
                                                  ? 'ring-2 ring-teal-400 bg-teal-500/20'
                                                  : ''
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className="relative shrink-0">
                                                  <Avatar
                                                    name={teamLeader.name}
                                                    src={teamLeader.avatarUrl}
                                                    size="sm"
                                                  />
                                                  <div className="absolute -top-1 -right-1 bg-teal-600 text-white rounded-full p-0.5 shadow-xs">
                                                    <Crown className="w-2.5 h-2.5" />
                                                  </div>
                                                </div>
                                                <div className="flex flex-col min-w-0 text-left">
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-teal-400 transition-colors">
                                                      {teamLeader.name}
                                                    </span>
                                                  </div>
                                                  <span className="text-[9px] font-semibold text-teal-400 truncate">
                                                    {teamLeader.jobTitle || 'Team Leader'}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/20 border border-teal-500/30 px-1.5 py-0.5 rounded-xs">
                                                  Lead
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Regular Squad Members */}
                                          {regularMembers.map((member) => (
                                            <div
                                              key={member.userId}
                                              onClick={() => onMemberSelect?.(member as any)}
                                              className={`group cursor-pointer flex items-center justify-between gap-3 p-2 rounded-lg border transition-all duration-150 min-w-[190px] ${
                                                isHighlighted(member as any)
                                                  ? 'border-brand-emerald ring-2 ring-brand-emerald/40 bg-surface-card'
                                                  : 'border-border/60 bg-surface-card hover:border-brand-emerald hover:bg-surface-low'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <Avatar
                                                  name={member.name}
                                                  src={member.avatarUrl}
                                                  size="sm"
                                                />
                                                <div className="flex flex-col min-w-0 text-left">
                                                  <span className="text-[11px] font-semibold text-text-primary truncate group-hover:text-brand-emerald transition-colors">
                                                    {member.name}
                                                  </span>
                                                  <span className="text-[9px] text-text-muted truncate">
                                                    {member.jobTitle || member.role}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-[9px] font-mono text-text-muted">
                                                  {member.activeTasks || 0} tasks
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
