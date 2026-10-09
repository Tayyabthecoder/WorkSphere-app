import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, ArrowRight, FolderKanban } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CreateProjectModal } from '../CreateProjectModal';
import { useCurrency } from '../../../store/CurrencyContext';
import { useAuthStore } from '../../../store/auth';
import { hasPermission } from '../../../lib/rbac';
import { Project } from '../../../types';
import apiClient from '../../../api/client';

interface ProjectsViewProps {
  initialProjects?: Project[];
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ initialProjects }) => {
  const { formatCurrency } = useCurrency();
  const user = useAuthStore((state) => state.user);
  const canCreateProject = hasPermission(user?.role, 'project:create');
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [isLoading, setIsLoading] = useState(!initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/projects');
      if (res.data?.success) {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialProjects) {
      fetchProjects();
    }
  }, [initialProjects]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Project Portfolio</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage your organization&apos;s active and upcoming deliverables.
          </p>
        </div>
        {canCreateProject && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-surface-card rounded-xl border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project: any) => (
            <Link key={project.projectId} to={`/projects/${project.projectId}`}>
              <Card className="flex flex-col justify-between h-[210px] rounded-xl border border-border/80 shadow-card hover:border-brand-emerald/40 hover:shadow-subtle transition-all cursor-pointer">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                      {project.methodology || 'SCRUM'}
                    </span>
                    <Badge variant={project.status === 'Active' ? 'completed' : 'neutral'} size="sm">
                      {project.status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mt-3 tracking-tight">
                    {project.name}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {project.description || 'No description provided'}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{project.members?.length || 1} members</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                    <span>
                      Budget: <span className="font-mono tabular-nums">{formatCurrency(project.budget?.total || 0)}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-emerald" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-surface-low border border-border/80 flex items-center justify-center text-text-muted mb-3 shadow-2xs">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">No projects yet</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Create your first project to activate Kanban boards, sprints, and Gantt timelines.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Create Project
              </Button>
            </div>
          )}
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
};

export default ProjectsView;
