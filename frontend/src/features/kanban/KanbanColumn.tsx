import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, AlertTriangle } from 'lucide-react';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
  wipLimit?: number;
  focusedCards?: Record<string, any>;
  onCardClick: (taskId: string) => void;
  onAddTask: (status: string, title: string) => Promise<void>;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  wipLimit,
  focusedCards,
  onCardClick,
  onAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask(title, taskTitle.trim());
      setTaskTitle('');
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const taskIds = tasks.map((t) => t.taskId);
  const isWipExceeded = wipLimit ? tasks.length > wipLimit : false;

  return (
    <div
      ref={setNodeRef}
      className={`w-[85vw] sm:w-[300px] shrink-0 snap-center bg-surface-low/60 rounded-xl border flex flex-col max-h-[calc(100vh-210px)] transition-all ${
        isOver
          ? 'border-brand-emerald bg-brand-emerald/5 ring-1 ring-brand-emerald/20'
          : 'border-border/80'
      }`}
    >
      <div className="p-3.5 border-b border-border/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-text-primary tracking-tight">{title}</h3>
          <span className="text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md bg-surface-container text-text-secondary border border-border/60">
            {tasks.length}
          </span>
          {isWipExceeded && (
            <span
              title={`WIP Limit (${wipLimit}) exceeded!`}
              className="text-status-error flex items-center"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <button
          onClick={() => setIsAdding((prev) => !prev)}
          title={`Add task to ${title}`}
          className="p-1 rounded-lg text-text-muted hover:text-brand-emerald hover:bg-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex flex-col gap-2.5 flex-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.taskId}
              task={task}
              onClick={onCardClick}
              activeViewer={focusedCards?.[task.taskId]}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="h-20 flex items-center justify-center border border-dashed border-border/80 rounded-lg text-xs font-mono text-text-muted">
            Drop tasks here
          </div>
        )}

        {isAdding ? (
          <form
            onSubmit={handleSubmit}
            className="p-2.5 bg-surface rounded-xl border border-brand-emerald shadow-sm flex flex-col gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="What needs to be done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setTaskTitle('');
                }
              }}
              className="w-full text-xs bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting || !taskTitle.trim()}
                  className="px-2.5 py-1 rounded-lg bg-brand-emerald text-white text-[11px] font-semibold hover:bg-brand-emerald/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setTaskTitle('');
                  }}
                  className="px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary text-[11px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <span className="text-[10px] text-text-muted font-mono">Esc to cancel</span>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-1.5 px-3 rounded-lg border border-dashed border-border/80 text-text-secondary hover:text-brand-emerald hover:border-brand-emerald/40 hover:bg-surface-container/50 text-xs font-medium flex items-center justify-center gap-1.5 transition-all mt-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
