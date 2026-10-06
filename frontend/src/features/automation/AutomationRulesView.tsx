import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Power,
  RotateCw,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AutomationRule } from '../../types';
import apiClient from '../../api/client';
import CreateRuleModal from './CreateRuleModal';

interface AutomationRulesViewProps {
  projectId?: string;
}

export const AutomationRulesView: React.FC<AutomationRulesViewProps> = ({ projectId }) => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [projects, setProjects] = useState<{ projectId: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const query = selectedProjectId && selectedProjectId !== 'all' ? `?projectId=${selectedProjectId}` : '';
      const res = await apiClient.get(`/v1/automation${query}`);
      if (res.data?.success) {
        setRules(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch automation rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    apiClient
      .get('/v1/projects')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setProjects(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchRules();
  }, [selectedProjectId]);

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const res = await apiClient.put(`/v1/automation/${rule.ruleId}`, {
        isActive: !rule.isActive,
      });
      if (res.data?.success) {
        setRules((prev) =>
          prev.map((r) => (r.ruleId === rule.ruleId ? { ...r, isActive: !r.isActive } : r))
        );
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await apiClient.delete(`/v1/automation/${ruleId}`);
      setRules((prev) => prev.filter((r) => r.ruleId !== ruleId));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  // Summary Metrics
  const totalRules = rules.length;
  const activeRules = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);
  const totalExecutions = useMemo(
    () => rules.reduce((acc, r) => acc + (r.executionCount || 0), 0),
    [rules]
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Workflow Automations
            </h2>
            <Badge variant="success" className="text-[10px] tracking-wide uppercase">
              Engine Active
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure event-driven trigger-action rules for task lifecycle and sprint transitions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs p-2 rounded-lg bg-surface-card border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
          >
            <option value="all">Global Workspace (All Projects)</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            className="shadow-2xs"
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Total Rules
            </span>
            <p className="text-xl font-bold text-text-primary tracking-tight">{totalRules}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Active Listeners
            </span>
            <p className="text-xl font-bold text-text-primary tracking-tight">{activeRules}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Automations Triggered
            </span>
            <p className="text-xl font-bold text-text-primary tracking-tight">
              {totalExecutions}
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="p-16 rounded-xl bg-surface-card border border-border text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No Automation Rules Configured</h3>
          <p className="text-xs text-text-secondary max-w-sm">
            Save team hours with pre-configured recipes or build custom workflows that trigger on task changes.
          </p>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => setIsModalOpen(true)}
            className="mt-1"
          >
            Explore Pre-Built Recipes
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.ruleId}
              className={`p-5 rounded-xl bg-surface-card border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                rule.isActive
                  ? 'border-border/80 hover:border-brand-emerald/40'
                  : 'border-border/40 opacity-70 bg-surface-low/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-text-primary">{rule.name}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        rule.isActive
                          ? 'bg-brand-emerald/15 text-brand-emerald'
                          : 'bg-surface-low text-text-muted'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {rule.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      rule.isActive
                        ? 'border-brand-emerald/30 text-brand-emerald hover:bg-brand-emerald/10'
                        : 'border-border text-text-muted hover:bg-surface-low'
                    }`}
                    title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.ruleId)}
                    className="p-1.5 rounded-lg border border-border/60 text-text-muted hover:text-red-400 hover:border-red-400/40 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Workflow Flow Steps */}
              <div className="p-3 rounded-lg bg-surface-low/50 border border-border/60 flex flex-col gap-2.5">
                {/* Trigger */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-mono uppercase text-brand-emerald font-bold px-1.5 py-0.5 rounded bg-brand-emerald/10">
                    WHEN
                  </span>
                  <span className="font-semibold text-text-primary">
                    {rule.trigger.event}
                  </span>
                  {rule.trigger.condition?.field && (
                    <span className="text-[11px] text-text-muted">
                      (where {rule.trigger.condition.field}{' '}
                      {rule.trigger.condition.operator}{' '}
                      <strong className="text-text-primary">
                        "{rule.trigger.condition.value}"
                      </strong>
                      )
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 pl-1 border-l-2 border-amber-500/30">
                  {rule.actions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] font-mono uppercase text-amber-500 font-bold px-1 py-0.5 rounded bg-amber-500/10">
                        THEN
                      </span>
                      <span className="text-text-primary font-medium">{act.type}</span>
                      {act.params && Object.keys(act.params).length > 0 && (
                        <span className="text-[10px] text-text-muted font-mono truncate max-w-xs">
                          {JSON.stringify(act.params)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Execution Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  <span>
                    Executed <strong>{rule.executionCount || 0}</strong> times
                  </span>
                </span>
                <span>
                  {rule.lastExecutedAt
                    ? `Last run ${new Date(rule.lastExecutedAt).toLocaleDateString()}`
                    : 'Never executed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Wizard */}
      <CreateRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRuleCreated={fetchRules}
        projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
      />
    </div>
  );
};

export default AutomationRulesView;
