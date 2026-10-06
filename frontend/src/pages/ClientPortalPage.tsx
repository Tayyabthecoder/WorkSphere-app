import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import apiClient from '../api/client';

interface DeliverableItem {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
}

interface ProjectPhase {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  color?: string;
}

interface PortalProject {
  projectId: string;
  name: string;
  description?: string;
  status: string;
  methodology: string;
  startDate?: string;
  endDate?: string;
  colorLabel?: string;
  progressPct: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  phases: ProjectPhase[];
  deliverables: DeliverableItem[];
  budget?: {
    total: number;
    currency: string;
  };
}

interface PortalData {
  client: {
    name: string;
    company?: string;
    portalSettings: {
      allowOverview: boolean;
      allowTimeline: boolean;
      allowDeliverables: boolean;
      allowFinancialSummary: boolean;
    };
  };
  tenant: {
    name: string;
    logoUrl?: string;
  };
  projects: PortalProject[];
}

export const ClientPortalPage: React.FC = () => {
  const { portalToken } = useParams<{ portalToken: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!portalToken) return;
    setIsLoading(true);
    apiClient
      .get(`/v1/portal/${portalToken}`)
      .then((res) => {
        if (!res.data?.success) {
          setError(res.data?.error?.message || 'Access link is invalid or expired.');
        } else {
          setData(res.data.data);
          if (res.data.data.projects?.length > 0) {
            setSelectedProjectId(res.data.data.projects[0].projectId);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load project portal');
      })
      .finally(() => setIsLoading(false));
  }, [portalToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-brand-emerald border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-text-primary">Opening Secure Client Portal...</h2>
        <p className="text-xs text-text-muted mt-1">Decrypting tokenized deliverable parameters</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-rose-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-text-primary mb-2">Portal Access Link Unavailable</h2>
          <p className="text-xs text-text-secondary mb-6 leading-relaxed">
            {error || 'This tokenized link has expired or has been disabled by the project administrator.'}
          </p>
          <div className="p-3 bg-surface-low rounded-lg text-xs font-mono text-text-muted">
            Error Code: 404_PORTAL_INVALID
          </div>
        </Card>
      </div>
    );
  }

  const { client, tenant, projects } = data;
  const currentProject = projects.find((p) => p.projectId === selectedProjectId) || projects[0];

  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary flex flex-col">
      {/* Top Banner Header */}
      <header className="border-b border-border/80 bg-surface-card px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                  {tenant.name}
                </h1>
                <Badge variant="completed" size="sm" dot>
                  Verified Portal
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Client Workspace: <span className="font-semibold text-text-primary">{client.name}</span>
                {client.company && ` (${client.company})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-brand-emerald" />
            <span className="hidden sm:inline font-mono">Secure Stakeholder Access</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        {/* Project Selector (if multi-project) */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {projects.map((proj) => (
              <button
                key={proj.projectId}
                type="button"
                onClick={() => setSelectedProjectId(proj.projectId)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  currentProject.projectId === proj.projectId
                    ? 'bg-brand-emerald text-white shadow-2xs'
                    : 'bg-surface-card text-text-secondary border border-border/80 hover:bg-surface-low'
                }`}
              >
                {proj.name}
              </button>
            ))}
          </div>
        )}

        {currentProject ? (
          <div className="flex flex-col gap-6">
            {/* Project Hero Summary */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                      {currentProject.name}
                    </h2>
                    <Badge variant={currentProject.status === 'Active' ? 'completed' : 'neutral'} size="sm">
                      {currentProject.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {currentProject.description || 'Deliverables and milestone tracking.'}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-text-muted uppercase">Execution Progress</span>
                    <span className="text-xl font-bold font-mono text-brand-emerald">
                      {currentProject.progressPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-surface-low rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-brand-emerald rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, currentProject.progressPct)}%` }}
                />
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-text-muted">Total Deliverables</span>
                  <div className="text-base font-bold font-mono mt-0.5">{currentProject.totalTasks}</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-text-muted">Completed</span>
                  <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
                    {currentProject.completedTasks}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-text-muted">In Progress</span>
                  <div className="text-base font-bold font-mono text-amber-600 mt-0.5">
                    {currentProject.inProgressTasks}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-text-muted">Target Delivery</span>
                  <div className="text-xs font-mono text-text-secondary mt-1">
                    {currentProject.endDate
                      ? new Date(currentProject.endDate).toLocaleDateString()
                      : 'Rolling'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Deliverables List */}
            {client.portalSettings?.allowDeliverables && currentProject.deliverables && (
              <Card className="p-6">
                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-emerald" />
                  Key Deliverables & Milestones
                </h3>

                <div className="flex flex-col divide-y divide-border/60">
                  {currentProject.deliverables.length === 0 ? (
                    <div className="py-6 text-center text-xs text-text-muted">
                      No deliverables published yet.
                    </div>
                  ) : (
                    currentProject.deliverables.map((item) => (
                      <div
                        key={item.taskId}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              item.status === 'Done' ? 'text-brand-emerald' : 'text-text-muted/40'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              item.status === 'Done'
                                ? 'line-through text-text-muted'
                                : 'text-text-primary'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.dueDate && (
                            <span className="font-mono text-[11px] text-text-muted hidden sm:inline">
                              Due {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <Badge
                            variant={item.status === 'Done' ? 'completed' : 'neutral'}
                            size="sm"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-12 text-center text-xs text-text-muted">
            No projects have been assigned to your portal profile yet.
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-surface-card py-4 text-center text-xs text-text-muted">
        Powered by WorkSphere Executive Project Operations &bull; Read-Only Stakeholder View
      </footer>
    </div>
  );
};

export default ClientPortalPage;
