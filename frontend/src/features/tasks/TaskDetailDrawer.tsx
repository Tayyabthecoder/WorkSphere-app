import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Trash2,
  Plus,
  AlertCircle,
  Play,
  Pause,
  MessageSquare,
  Send,
  AtSign,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastContext';
import apiClient from '../../api/client';
import { useComments, useCreateComment, useDeleteComment } from '../../hooks/useComments';
import { useTeam } from '../../hooks/useTeam';
import { useAuthStore } from '../../store/auth';
import { getSocket } from '../../lib/socket';
import { useQueryClient } from '@tanstack/react-query';

interface TaskDetailDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted?: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { toast } = useToast();
  const [task, setTask] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('medium');
  const [storyPoints, setStoryPoints] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Comments state and mutations
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { data: comments = [], isLoading: isLoadingComments } = useComments(taskId);
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();
  const { data: teamMembers = [] } = useTeam();

  const [commentText, setCommentText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    if (!taskId || !isOpen) return;
    const socket = getSocket();

    const handleNewComment = (payload: any) => {
      if (payload?.comment?.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      }
    };

    const handleDeletedComment = (payload: any) => {
      if (payload?.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      }
    };

    socket.on('comment:new', handleNewComment);
    socket.on('comment:deleted', handleDeletedComment);
    socket.on('comment:updated', handleNewComment);

    return () => {
      socket.off('comment:new', handleNewComment);
      socket.off('comment:deleted', handleDeletedComment);
      socket.off('comment:updated', handleNewComment);
    };
  }, [taskId, isOpen, queryClient]);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !task) return;
    setIsPostingComment(true);
    try {
      await createCommentMutation.mutateAsync({
        taskId: task.taskId,
        projectId: task.projectId,
        content: commentText.trim(),
        mentions: selectedMentions,
      });
      setCommentText('');
      setSelectedMentions([]);
      setShowMentions(false);
      toast.success('Comment posted');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!taskId || !confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteCommentMutation.mutateAsync({ commentId, taskId });
      toast.info('Comment removed');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleSelectMention = (member: any) => {
    setCommentText((prev) => `${prev}@${member.name} `);
    if (!selectedMentions.includes(member.userId)) {
      setSelectedMentions((prev) => [...prev, member.userId]);
    }
    setShowMentions(false);
  };

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (taskId && isOpen) {
      setIsLoading(true);
      setError('');
      apiClient
        .get(`/v1/tasks/${taskId}`)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const t = res.data.data;
            setTask(t);
            setTitle(t.title || '');
            setDescription(t.description || '');
            setStatus(t.status || 'To Do');
            setPriority(t.priority || 'medium');
            setStoryPoints(t.storyPoints || 0);
            setDueDate(t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '');
            setSubtasks(t.subtasks || []);
          } else {
            setError(res.data?.error?.message || 'Failed to fetch task');
          }
        })
        .catch(() => setError('Error loading task details'))
        .finally(() => setIsLoading(false));
    }
  }, [taskId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!taskId) return;
    setIsSaving(true);
    try {
      const res = await apiClient.put(`/v1/tasks/${taskId}`, {
        title,
        description,
        status,
        priority,
        storyPoints: Number(storyPoints) || 0,
        dueDate: dueDate || undefined,
      });

      if (res.data?.success) {
        toast.success('Task updated', {
          message: `Saved changes to ${task?.taskId || 'task'}.`,
        });
        onTaskUpdated();
      }
    } catch {
      setError('Failed to update task');
      toast.error('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId || !confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await apiClient.delete(`/v1/tasks/${taskId}`);
      if (res.data?.success) {
        toast.info('Task deleted', {
          message: `Task ${task?.taskId || ''} was removed.`,
        });
        onTaskDeleted?.();
        onClose();
      }
    } catch {
      setError('Failed to delete task');
      toast.error('Failed to delete task');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;

    try {
      const res = await apiClient.post('/v1/tasks', {
        projectId: task.projectId,
        parentTaskId: task.taskId,
        title: newSubtaskTitle.trim(),
        status: 'To Do',
        priority: 'medium',
      });

      if (res.data?.success) {
        setSubtasks([...subtasks, res.data.data]);
        setNewSubtaskTitle('');
        onTaskUpdated();
      }
    } catch {
      setError('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Done' ? 'To Do' : 'Done';
    try {
      const res = await apiClient.patch(`/v1/tasks/${subtaskId}/status`, { status: nextStatus });
      if (res.data?.success) {
        setSubtasks(
          subtasks.map((st) => (st.taskId === subtaskId ? { ...st, status: nextStatus } : st))
        );
        onTaskUpdated();
      }
    } catch {
      setError('Failed to toggle subtask');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
    >
      <div className="w-full sm:max-w-[520px] bg-white h-screen shadow-2xl flex flex-col justify-between border-l border-border/80 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-text-muted">
              {task?.taskId || 'TASK'}
            </span>
            <Badge
              variant={
                status === 'Done' ? 'completed' : status === 'In Progress' ? 'progress' : 'pending'
              }
              size="sm"
            >
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              title="Delete Task"
              className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-status-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-4 animate-pulse pt-2">
              <Skeleton className="h-7 w-3/4" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {/* Task Title */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Task title..."
                  className="w-full text-lg font-bold text-text-primary border-none focus:outline-none focus:ring-0 p-0 placeholder:text-text-muted"
                />
              </div>

              {/* Task Timer Banner */}
              <div className="p-3.5 rounded-xl bg-brand-evergreen text-white flex items-center justify-between shadow-subtle border border-emerald-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-mint">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-brand-mint tracking-wider block">
                      Task Timer
                    </span>
                    <span className="font-mono tabular-nums text-sm font-bold">{formatTimer(timerSeconds)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isTimerRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-2xs'
                      : 'bg-brand-mint text-brand-primary hover:bg-brand-mint-light shadow-2xs'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3 h-3" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" /> Start
                    </>
                  )}
                </button>
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-low/60 border border-border/80">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">Status</span>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setTimeout(handleSave, 50);
                    }}
                    className="h-8 text-xs font-semibold rounded-lg bg-white border border-border/80 px-2 focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">Priority</span>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      setTimeout(handleSave, 50);
                    }}
                    className="h-8 text-xs font-semibold rounded-lg bg-white border border-border/80 px-2 focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">Story Points</span>
                  <input
                    type="number"
                    min="0"
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(Number(e.target.value))}
                    onBlur={handleSave}
                    className="h-8 text-xs font-mono font-semibold rounded-lg bg-white border border-border/80 px-2 focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">Due Date</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setTimeout(handleSave, 50);
                    }}
                    className="h-8 text-xs rounded-lg bg-white border border-border/80 px-2 focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">Description</span>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Add details, checklists, or acceptance criteria..."
                  className="w-full p-3 rounded-lg bg-white border border-border/80 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15"
                />
              </div>

              {/* Subtasks Checklist */}
              <div className="flex flex-col gap-3 pt-3 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">
                    Subtasks ({subtasks.filter((s) => s.status === 'Done').length}/{subtasks.length})
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.taskId}
                      className="flex items-center gap-2 p-2 rounded-lg bg-surface-low/50 hover:bg-surface-low border border-border/60 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={st.status === 'Done'}
                        onChange={() => handleToggleSubtask(st.taskId, st.status)}
                        className="rounded border-border text-brand-emerald focus:ring-brand-emerald w-4 h-4 cursor-pointer"
                      />
                      <span
                        className={`text-xs flex-1 ${
                          st.status === 'Done' ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Add a new subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded-lg border border-border/80 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald"
                  />
                  <Button type="submit" variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add
                  </Button>
                </form>
              </div>

              {/* Comments & Discussion */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-brand-emerald" />
                    <span className="text-xs font-bold text-text-primary">
                      Comments ({comments.length})
                    </span>
                  </div>
                </div>

                {/* Comment Thread */}
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {isLoadingComments ? (
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-3 rounded-xl bg-surface-low/40 border border-dashed border-border/80 text-center">
                      <p className="text-xs text-text-muted">No comments yet. Start the conversation!</p>
                    </div>
                  ) : (
                    comments.map((c) => {
                      const canDelete =
                        currentUser?.userId === c.authorId ||
                        ['superAdmin', 'orgAdmin', 'manager'].includes(currentUser?.role || '');
                      return (
                        <div
                          key={c.commentId}
                          className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-low/50 border border-border/60 hover:border-border transition-colors text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {c.authorAvatarUrl ? (
                                <img
                                  src={c.authorAvatarUrl}
                                  alt={c.authorName || 'Avatar'}
                                  className="w-5 h-5 rounded-full object-cover border border-border/80"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-[10px]">
                                  {(c.authorName || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-semibold text-text-primary">{c.authorName || 'Teammate'}</span>
                              <span className="text-[10px] text-text-muted">
                                {formatRelativeTime(c.createdAt)}
                                {c.editedAt && ' (edited)'}
                              </span>
                            </div>
                            {!c.isDeleted && canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.commentId)}
                                title="Delete comment"
                                className="text-text-muted hover:text-status-error p-1 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p
                            className={`mt-0.5 whitespace-pre-wrap leading-relaxed ${
                              c.isDeleted ? 'italic text-text-muted text-[11px]' : 'text-text-primary'
                            }`}
                          >
                            {c.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Input Form */}
                <form onSubmit={handlePostComment} className="flex flex-col gap-1.5 mt-1 relative">
                  {/* Mention picker dropdown */}
                  {showMentions && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-border/80 rounded-xl shadow-lg z-20 overflow-hidden">
                      <div className="p-2 border-b border-border/60 text-[11px] font-semibold text-text-secondary bg-surface-low/60 flex items-center gap-1">
                        <AtSign className="w-3 h-3 text-brand-emerald" /> Mention teammate
                      </div>
                      <div className="max-h-36 overflow-y-auto">
                        {teamMembers
                          .filter((m) => m.isActive !== false)
                          .map((m) => (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleSelectMention(m)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-low flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <div className="w-5 h-5 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-[10px]">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-text-primary font-medium">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-white border border-border/80 rounded-lg px-2 py-1 focus-within:border-brand-emerald focus-within:ring-1 focus-within:ring-brand-emerald/20">
                    <button
                      type="button"
                      title="Mention someone"
                      onClick={() => setShowMentions(!showMentions)}
                      className="p-1 rounded text-text-muted hover:text-brand-emerald transition-colors cursor-pointer"
                    >
                      <AtSign className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      placeholder="Add a comment... (use @ to mention)"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 text-xs border-none focus:outline-none focus:ring-0 p-1 text-text-primary placeholder:text-text-muted bg-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isPostingComment}
                      className="p-1.5 rounded-lg bg-brand-emerald text-white hover:bg-brand-emerald-dark disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-surface-low/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-text-muted">
            {isSaving ? 'Saving changes...' : 'Changes auto-save on blur'}
          </span>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailDrawer;
