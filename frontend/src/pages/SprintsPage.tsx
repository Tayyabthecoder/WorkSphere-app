import React, { useState } from 'react';
import { Plus, Zap, Filter, FolderKanban, Loader2 } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useSprints, useUpdateSprint, useDeleteSprint } from '../hooks/useSprints';
import { Sprint } from '../types';
import { SprintCard } from '../features/agile/components/SprintCard';
import { CreateSprintModal } from '../features/agile/components/CreateSprintModal';
import { EditSprintModal } from '../features/agile/components/EditSprintModal';
import { Button } from '../components/ui/Button';

export const SprintsPage: React.FC = () => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].projectId);
    }
  }, [projects, selectedProjectId]);

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'planning' | 'completed'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  const { data: sprints = [], isLoading: isLoadingSprints } = useSprints(
    selectedProjectId || undefined,
    activeTab === 'all' ? undefined : activeTab
  );

  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();

  const handleStartSprint = async (sprintId: string) => {
    await updateSprint.mutateAsync({ sprintId, status: 'active' });
  };

  const handleCompleteSprint = async (sprintId: string) => {
    await updateSprint.mutateAsync({ sprintId, status: 'completed' });
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (window.confirm('Are you sure you want to delete this sprint? Unfinished tasks will be moved to the backlog.')) {
      await deleteSprint.mutateAsync(sprintId);
    }
  };

  const currentProject = projects.find((p) => p.projectId === selectedProjectId);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Sprint Management</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald rounded-full">
              Agile
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Plan cycles, manage team velocity, and track sprint burndown metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-surface-card border border-border px-3 py-1.5 rounded-lg shadow-2xs">
            <FolderKanban className="w-4 h-4 text-text-muted" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Sprint
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {(['all', 'active', 'planning', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-brand-emerald/10 text-brand-emerald font-semibold'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-low'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {isLoadingProjects || isLoadingSprints ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
          <span className="text-xs">Loading sprints...</span>
        </div>
      ) : sprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-dashed border-border rounded-xl text-center">
          <Zap className="w-12 h-12 text-brand-emerald/40 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No sprints found</h3>
          <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">
            {currentProject
              ? `There are no ${activeTab === 'all' ? '' : activeTab} sprints in ${currentProject.name}. Create your first sprint to start planning tasks.`
              : 'Select a project to view its sprint cycles.'}
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Sprint
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.sprintId}
              sprint={sprint}
              onEdit={(s) => setEditingSprint(s)}
              onDelete={handleDeleteSprint}
              onStart={handleStartSprint}
              onComplete={handleCompleteSprint}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSprintModal
        projectId={selectedProjectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditSprintModal
        sprint={editingSprint}
        isOpen={!!editingSprint}
        onClose={() => setEditingSprint(null)}
      />
    </div>
  );
};

export default SprintsPage;
