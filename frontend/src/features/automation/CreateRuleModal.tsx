import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, ArrowRight, ShieldAlert, CheckCircle2, Play } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AutomationRule, AutomationTrigger, AutomationAction } from '../../types';
import apiClient from '../../api/client';

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleCreated: () => void;
  projectId?: string;
}

const RECIPES = [
  {
    id: 'qa-review-triage',
    badge: 'Quality Assurance',
    name: 'Auto-Assign QA on In Review',
    description: 'When task moves to In Review, send alert and tag deliverable for QA verification.',
    trigger: {
      event: 'task.status_changed' as const,
      condition: { field: 'status', operator: 'equals' as const, value: 'In Review' },
    },
    actions: [
      { type: 'send_notification' as const, params: { message: 'Task moved to In Review. Ready for QA.' } },
      { type: 'add_label' as const, params: { label: 'needs-qa' } },
    ],
  },
  {
    id: 'critical-escalation',
    badge: 'Incident Response',
    name: 'Escalate Critical Blocker',
    description: 'When task priority escalated to Critical, automatically move to In Progress and broadcast alert.',
    trigger: {
      event: 'task.priority_changed' as const,
      condition: { field: 'priority', operator: 'equals' as const, value: 'critical' },
    },
    actions: [
      { type: 'change_status' as const, params: { status: 'In Progress' } },
      { type: 'send_notification' as const, params: { message: 'CRITICAL task escalated to In Progress!' } },
    ],
  },
  {
    id: 'done-tagger',
    badge: 'Sprint Hygiene',
    name: 'Auto-Tag Delivered Stories',
    description: 'Attach "verified-done" tracking tag whenever any deliverable completes.',
    trigger: {
      event: 'task.status_changed' as const,
      condition: { field: 'status', operator: 'equals' as const, value: 'Done' },
    },
    actions: [
      { type: 'add_label' as const, params: { label: 'verified-done' } },
    ],
  },
  {
    id: 'new-task-triage',
    badge: 'Backlog Grooming',
    name: 'Default Intake Triage',
    description: 'Tag newly created tasks with "triaged" and set baseline priority to medium.',
    trigger: {
      event: 'task.created' as const,
    },
    actions: [
      { type: 'change_priority' as const, params: { priority: 'medium' } },
      { type: 'add_label' as const, params: { label: 'triaged' } },
    ],
  },
];

export const CreateRuleModal: React.FC<CreateRuleModalProps> = ({
  isOpen,
  onClose,
  onRuleCreated,
  projectId,
}) => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'custom'>('recipes');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [event, setEvent] = useState<AutomationTrigger['event']>('task.status_changed');
  const [conditionField, setConditionField] = useState('status');
  const [conditionOperator, setConditionOperator] = useState<'equals' | 'not_equals' | 'contains'>('equals');
  const [conditionValue, setConditionValue] = useState('In Review');
  const [actions, setActions] = useState<AutomationAction[]>([
    { type: 'change_status', params: { status: 'In Progress' } },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectRecipe = (recipe: typeof RECIPES[0]) => {
    setName(recipe.name);
    setDescription(recipe.description);
    setEvent(recipe.trigger.event);
    if (recipe.trigger.condition) {
      setConditionField(recipe.trigger.condition.field || 'status');
      setConditionOperator(recipe.trigger.condition.operator || 'equals');
      setConditionValue(recipe.trigger.condition.value || '');
    } else {
      setConditionField('');
      setConditionValue('');
    }
    setActions([...recipe.actions]);
    setActiveTab('custom');
  };

  const handleAddAction = () => {
    setActions((prev) => [...prev, { type: 'add_label', params: { label: 'automated' } }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActionTypeChange = (index: number, newType: AutomationAction['type']) => {
    setActions((prev) => {
      const copy = [...prev];
      let defaultParams: Record<string, any> = {};
      if (newType === 'change_status') defaultParams = { status: 'In Progress' };
      if (newType === 'change_priority') defaultParams = { priority: 'high' };
      if (newType === 'add_label') defaultParams = { label: 'priority' };
      if (newType === 'send_notification') defaultParams = { message: 'Task updated automatically.' };
      if (newType === 'assign_user') defaultParams = { userId: '' };
      copy[index] = { type: newType, params: defaultParams };
      return copy;
    });
  };

  const handleActionParamChange = (index: number, key: string, value: any) => {
    setActions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        params: { ...copy[index].params, [key]: value },
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a rule name');
      return;
    }
    if (actions.length === 0) {
      setError('At least one action is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const trigger: AutomationTrigger = {
        event,
        ...(conditionField && conditionValue
          ? {
              condition: {
                field: conditionField,
                operator: conditionOperator,
                value: conditionValue,
              },
            }
          : {}),
      };

      await apiClient.post('/v1/automation', {
        name: name.trim(),
        description: description.trim(),
        projectId: projectId || null,
        trigger,
        actions,
        isActive: true,
      });

      onRuleCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border/80 rounded-xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                New Automation Rule
              </h3>
              <p className="text-xs text-text-secondary">
                Configure event-driven trigger and action workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 p-1 bg-surface-low rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'recipes'
                ? 'bg-surface-card text-brand-emerald shadow-2xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Pre-Built Recipes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'custom'
                ? 'bg-surface-card text-brand-emerald shadow-2xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Custom Rule Builder
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {activeTab === 'recipes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RECIPES.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelectRecipe(r)}
                className="p-4 rounded-xl bg-surface-low/50 border border-border/80 hover:border-amber-500/50 hover:bg-surface-low cursor-pointer transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500">
                    {r.badge}
                  </span>
                  <h4 className="text-xs font-bold text-text-primary group-hover:text-amber-400 transition-colors">
                    {r.name}
                  </h4>
                  <p className="text-[11px] text-text-secondary line-clamp-2">
                    {r.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-text-muted">
                  <span>Use Recipe</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Rule Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Triage Critical Tasks"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional intent description"
                />
              </div>
            </div>

            {/* Trigger Section */}
            <div className="p-3.5 rounded-xl bg-surface-low/40 border border-border/70 flex flex-col gap-3">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-brand-emerald" />
                When Event Happens (Trigger)
              </span>

              <select
                value={event}
                onChange={(e) => setEvent(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg bg-surface-card border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
              >
                <option value="task.created">Task Created</option>
                <option value="task.status_changed">Task Status Changes</option>
                <option value="task.priority_changed">Task Priority Escalated</option>
                <option value="sprint.started">Sprint Cycle Starts</option>
                <option value="sprint.completed">Sprint Cycle Completed</option>
              </select>

              {/* Condition Section */}
              <div className="pt-2 border-t border-border/60">
                <label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
                  Filter Condition (Optional):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    className="text-xs p-2 rounded-lg bg-surface-card border border-border/80 text-text-primary outline-none"
                  >
                    <option value="">No Filter (Any)</option>
                    <option value="status">Field: Status</option>
                    <option value="priority">Field: Priority</option>
                  </select>

                  <select
                    value={conditionOperator}
                    onChange={(e) => setConditionOperator(e.target.value as any)}
                    disabled={!conditionField}
                    className="text-xs p-2 rounded-lg bg-surface-card border border-border/80 text-text-primary outline-none disabled:opacity-40"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does Not Equal</option>
                    <option value="contains">Contains</option>
                  </select>

                  <Input
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    disabled={!conditionField}
                    placeholder="e.g., In Review"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="p-3.5 rounded-xl bg-surface-low/40 border border-border/70 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  Then Execute Actions ({actions.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddAction}
                  className="text-xs py-1 h-7"
                >
                  Add Action
                </Button>
              </div>

              <div className="flex flex-col gap-2.5">
                {actions.map((act, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-surface-card border border-border/80 flex items-center gap-2"
                  >
                    <span className="text-[10px] font-mono text-text-muted px-1">
                      #{index + 1}
                    </span>

                    <select
                      value={act.type}
                      onChange={(e) => handleActionTypeChange(index, e.target.value as any)}
                      className="text-xs p-1.5 rounded-md bg-surface-low border border-border/60 text-text-primary outline-none"
                    >
                      <option value="change_status">Change Status</option>
                      <option value="change_priority">Change Priority</option>
                      <option value="add_label">Add Label / Tag</option>
                      <option value="send_notification">Send Notification</option>
                      <option value="assign_user">Assign User</option>
                    </select>

                    <div className="flex-1">
                      {act.type === 'change_status' && (
                        <select
                          value={act.params?.status || 'In Progress'}
                          onChange={(e) => handleActionParamChange(index, 'status', e.target.value)}
                          className="w-full text-xs p-1.5 rounded-md bg-surface-low border border-border/60 text-text-primary outline-none"
                        >
                          <option value="Backlog">Backlog</option>
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Done">Done</option>
                        </select>
                      )}

                      {act.type === 'change_priority' && (
                        <select
                          value={act.params?.priority || 'high'}
                          onChange={(e) => handleActionParamChange(index, 'priority', e.target.value)}
                          className="w-full text-xs p-1.5 rounded-md bg-surface-low border border-border/60 text-text-primary outline-none"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      )}

                      {act.type === 'add_label' && (
                        <Input
                          value={act.params?.label || ''}
                          onChange={(e) => handleActionParamChange(index, 'label', e.target.value)}
                          placeholder="Label name (e.g., needs-qa)"
                          className="text-xs py-1"
                        />
                      )}

                      {act.type === 'send_notification' && (
                        <Input
                          value={act.params?.message || ''}
                          onChange={(e) => handleActionParamChange(index, 'message', e.target.value)}
                          placeholder="Notification message alert"
                          className="text-xs py-1"
                        />
                      )}

                      {act.type === 'assign_user' && (
                        <Input
                          value={act.params?.userId || ''}
                          onChange={(e) => handleActionParamChange(index, 'userId', e.target.value)}
                          placeholder="User ID"
                          className="text-xs py-1"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="rounded-lg text-xs gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save Automation</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateRuleModal;
