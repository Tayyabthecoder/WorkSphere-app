import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';
import { Skeleton, SkeletonKanbanCard } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';
import { useSocket, useProjectPresence } from '../../context/SocketContext';
import { useAuthStore } from '../../store/auth';
import apiClient from '../../api/client';
import { Radio, Users } from 'lucide-react';

interface KanbanBoardProps {
  projectId?: string;
}

const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId: propProjectId }) => {
  const routeParams = useParams<{ projectId: string }>();
  const projectId = propProjectId || routeParams.projectId || '';
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { socket, isConnected, addToast } = useSocket();
  const {
    activeUsers,
    focusedCards,
    setCardFocus,
    clearCardFocus,
  } = useProjectPresence(projectId);

  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get(`/v1/tasks?projectId=${projectId}&limit=500`);
      if (res.data?.success) {
        const fetchedTasks = res.data.data || [];
        setTasks(fetchedTasks);
        qc.setQueryData(['tasks', { projectId }], fetchedTasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Real-Time Socket Event Listeners for live multiplayer synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    // 1. Peer moved a task card
    const handleTaskMoved = (data: {
      taskId: string;
      status: string;
      order?: number;
      modifiedBy: { userId: string; name: string };
    }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === data.taskId
            ? { ...t, status: data.status, order: data.order !== undefined ? data.order : t.order }
            : t
        )
      );

      if (data.modifiedBy?.userId !== user?.userId) {
        addToast({
          title: 'Card Moved',
          message: `${data.modifiedBy?.name || 'A teammate'} moved a task to "${data.status}"`,
          type: 'info',
        });
      }
    };

    // 2. Peer created a task
    const handleTaskCreated = (data: {
      task: any;
      author: { userId: string; name: string };
    }) => {
      if (!data?.task) return;
      setTasks((prev) => {
        if (prev.some((t) => t.taskId === data.task.taskId)) return prev;
        return [data.task, ...prev];
      });

      if (data.author?.userId !== user?.userId) {
        addToast({
          title: 'New Task Added',
          message: `${data.author?.name || 'A teammate'} added "${data.task.title}"`,
          type: 'success',
        });
      }
    };

    // 3. Peer updated task details
    const handleTaskUpdated = (data: {
      task: any;
      modifiedBy: { userId: string; name: string };
    }) => {
      if (!data?.task) return;
      setTasks((prev) =>
        prev.map((t) => (t.taskId === data.task.taskId ? { ...t, ...data.task } : t))
      );
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    };

    // 4. Peer deleted a task
    const handleTaskDeleted = (data: {
      taskId: string;
      modifiedBy: { userId: string; name: string };
    }) => {
      setTasks((prev) => prev.filter((t) => t.taskId !== data.taskId));
      if (selectedTaskId === data.taskId) {
        setIsDrawerOpen(false);
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['sprints'] });
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, isConnected, user?.userId, selectedTaskId, addToast, qc]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.taskId === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = String(active.id);
    let targetStatus = String(over.id);

    if (!COLUMNS.includes(targetStatus)) {
      const overTask = tasks.find((t) => t.taskId === targetStatus);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    const currentTask = tasks.find((t) => t.taskId === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      const res = await apiClient.patch(`/v1/tasks/${taskId}/status`, { status: targetStatus });
      if (!res.data?.success) {
        setTasks(previousTasks);
      } else {
        qc.invalidateQueries({ queryKey: ['tasks'] });
        qc.invalidateQueries({ queryKey: ['sprints'] });
      }
    } catch {
      setTasks(previousTasks);
    }
  };

  const handleCardClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDrawerOpen(true);
    setCardFocus(taskId);
  };

  const handleDrawerClose = () => {
    if (selectedTaskId) {
      clearCardFocus(selectedTaskId);
    }
    setIsDrawerOpen(false);
  };

  const handleQuickAddTask = async (columnStatus: string, title: string) => {
    if (!title?.trim()) return;

    try {
      const res = await apiClient.post('/v1/tasks', {
        projectId,
        title: title.trim(),
        status: columnStatus,
        priority: 'medium',
      });

      if (res.data?.success && res.data.data) {
        // Optimistically add to local state if socket hasn't delivered yet
        setTasks((prev) => {
          if (prev.some((t) => t.taskId === res.data.data.taskId)) return prev;
          return [res.data.data, ...prev];
        });
        qc.invalidateQueries({ queryKey: ['tasks'] });
        qc.invalidateQueries({ queryKey: ['sprints'] });
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3.5 sm:gap-5 overflow-x-auto pb-4 px-2 sm:px-4 items-start">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="w-[85vw] sm:w-[300px] shrink-0 bg-surface-low/40 rounded-xl border border-border/60 p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6 rounded-md" />
            </div>
            <SkeletonKanbanCard />
            <SkeletonKanbanCard />
            <SkeletonKanbanCard className="hidden sm:flex" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Real-Time Multiplayer Presence & Sync Status Header Bar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 bg-surface-card/60 backdrop-blur-sm border border-border/70 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-medium text-[11px]">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>Live Multiplayer</span>
          </div>
          <span className="text-text-muted hidden md:inline">•</span>
          <span className="text-text-secondary text-[11px] hidden md:inline">
            Changes synchronize instantly across active sessions
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[11px] font-medium text-text-secondary">
              {activeUsers.length} {activeUsers.length === 1 ? 'user online' : 'users online'}
            </span>
          </div>

          <div className="flex items-center -space-x-2 overflow-hidden pl-1">
            {activeUsers.slice(0, 6).map((u) => (
              <div
                key={u.userId}
                title={`${u.name} (${u.email}) - Viewing this board`}
                className="transition-transform hover:scale-110 hover:z-10 cursor-pointer"
              >
                <Avatar
                  name={u.name}
                  src={u.avatarUrl}
                  size="sm"
                  isOnline={true}
                  className="ring-2 ring-white"
                />
              </div>
            ))}
            {activeUsers.length > 6 && (
              <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-text-secondary border-2 border-white">
                +{activeUsers.length - 6}
              </div>
            )}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3.5 sm:gap-5 overflow-x-auto pb-4 px-2 sm:px-4 items-start snap-x snap-mandatory scroll-smooth flex-1">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column);
            return (
              <KanbanColumn
                key={column}
                id={column}
                title={column}
                tasks={columnTasks}
                focusedCards={focusedCards}
                wipLimit={column === 'In Progress' ? 6 : undefined}
                onCardClick={handleCardClick}
                onAddTask={handleQuickAddTask}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} onClick={() => {}} isDraggingOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onTaskUpdated={fetchTasks}
        onTaskDeleted={fetchTasks}
      />
    </div>
  );
};

export default KanbanBoard;
