import React, { useState, useEffect } from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProjectSubNav } from '../features/projects/components/ProjectSubNav';
import apiClient from '../api/client';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      apiClient
        .get(`/v1/projects/${projectId}`)
        .then((res) => {
          if (res.data?.success) {
            setProject(res.data.data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-dim rounded" />
        <div className="h-12 w-full bg-surface-card rounded-xl border border-border" />
        <div className="h-[600px] w-full bg-surface-card rounded-xl border border-border" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <h3 className="text-base font-bold text-text-primary">Project Not Found</h3>
        <p className="text-xs text-text-muted mt-1 mb-4">The requested project does not exist.</p>
        <Link to="/projects">
          <Button variant="secondary" size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Breadcrumb & Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="p-1.5 rounded-lg border border-border/80 text-text-secondary hover:text-text-primary hover:bg-surface-low transition-colors"
            aria-label="Back to projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">{project.name}</h2>
              <Badge variant={project.status === 'Active' ? 'completed' : 'neutral'} size="sm">
                {project.status}
              </Badge>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald font-semibold">
                {project.methodology || 'Agile'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{project.description}</p>
          </div>
        </div>
      </div>

      {/* Methodology-Aware Project Sub Navigation */}
      <ProjectSubNav
        projectId={projectId!}
        methodology={project.methodology}
      />

      {/* Sub-Route Outlet for Overview / Board / List / Timeline / Calendar / Backlog / Capacity */}
      <div className="min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
};

export default ProjectDetailPage;
