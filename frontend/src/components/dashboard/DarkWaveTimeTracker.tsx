import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Check, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';

export interface AvailableTaskItem {
  taskId: string;
  title: string;
  projectId: string;
  projectName?: string;
  status?: string;
}

interface DarkWaveTimeTrackerProps {
  initialTaskName?: string;
  availableTasks?: AvailableTaskItem[];
  sprintName?: string;
  onTimeLogged?: () => void;
}

export const DarkWaveTimeTracker: React.FC<DarkWaveTimeTrackerProps> = ({
  initialTaskName,
  availableTasks = [],
  sprintName,
  onTimeLogged,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');

  // Synchronize initial selection when availableTasks load
  useEffect(() => {
    if (availableTasks.length > 0 && !selectedTaskId) {
      // Prefer an In Progress task, otherwise first available
      const inProgress = availableTasks.find((t) => t.status === 'In Progress') || availableTasks[0];
      setSelectedTaskId(inProgress.taskId);
      setSelectedProjectId(inProgress.projectId);
      setSelectedTaskTitle(inProgress.title);
    } else if (availableTasks.length === 0 && initialTaskName) {
      setSelectedTaskTitle(initialTaskName);
    }
  }, [availableTasks, selectedTaskId, initialTaskName]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;
    const task = availableTasks.find((t) => t.taskId === taskId);
    if (task) {
      setSelectedTaskId(task.taskId);
      setSelectedProjectId(task.projectId);
      setSelectedTaskTitle(task.title);
      setErrorMessage(null);
    }
  };

  const handleStop = async () => {
    setIsRunning(false);
    setErrorMessage(null);

    if (!selectedTaskId || !selectedProjectId) {
      setErrorMessage('Please select an active task before logging time');
      return;
    }

    if (seconds < 30) {
      setErrorMessage('Track for at least 30 seconds to log time');
      setTimeout(() => setErrorMessage(null), 3000);
      setSeconds(0);
      return;
    }

    try {
      const minutesToLog = Math.max(1, Math.round(seconds / 60));
      await apiClient.post('/v1/time', {
        taskId: selectedTaskId,
        projectId: selectedProjectId,
        duration: minutesToLog,
        isBillable: true,
        description: `Logged from Dashboard DarkWave Focus Timer (${minutesToLog} min)`,
      });

      setIsSaved(true);
      setSeconds(0);
      onTimeLogged?.();
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to log time entry';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div className="relative p-5 rounded-xl bg-brand-evergreen text-white border border-emerald-950/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_12px_32px_-8px_rgba(13,34,24,0.45)] flex flex-col justify-between h-[280px] overflow-hidden">
      {/* Background Topographical Wave SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg
          viewBox="0 0 500 300"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 C150,180 350,20 500,100 L500,300 L0,300 Z"
            fill="url(#emeraldGradient)"
          />
          <path
            d="M0,150 C180,240 320,60 500,160 L500,300 L0,300 Z"
            fill="#1B4D3E"
            opacity="0.4"
          />
          <defs>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#003629" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isSaved
                ? 'bg-brand-mint'
                : isRunning
                ? 'bg-brand-mint animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-semibold tracking-wider text-brand-emerald-light uppercase font-mono">
            {isSaved ? 'Logged & Saved!' : isRunning ? 'Focus Timer Active' : 'Focus Timer'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-brand-mint bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/40 truncate max-w-[120px]">
          {sprintName || 'Active Sprint'}
        </span>
      </div>

      {/* Time Digits & Task Selection */}
      <div className="relative z-10 my-auto flex flex-col items-center">
        <div className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-white drop-shadow-md select-none tabular-nums">
          {formatTime(seconds)}
        </div>

        {errorMessage ? (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-700/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-xs">{errorMessage}</span>
          </div>
        ) : availableTasks.length > 0 ? (
          <div className="mt-2 w-full max-w-[260px]">
            <select
              value={selectedTaskId}
              onChange={handleTaskChange}
              disabled={isRunning}
              className="w-full text-xs bg-emerald-950/80 text-brand-emerald-light border border-emerald-700/50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-mint truncate cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {availableTasks.map((task) => (
                <option key={task.taskId} value={task.taskId} className="bg-emerald-950 text-white">
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-brand-emerald-light/90 mt-2 font-medium truncate max-w-xs text-center">
            {selectedTaskTitle || 'No active deliverable'}
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div className="relative z-10 flex items-center justify-center gap-3">
        {isRunning ? (
          <button
            type="button"
            onClick={() => setIsRunning(false)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700/80 text-white text-xs font-semibold backdrop-blur-xs transition-all border border-emerald-600/40 shadow-xs cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!selectedTaskId && availableTasks.length > 0) {
                setSelectedTaskId(availableTasks[0].taskId);
                setSelectedProjectId(availableTasks[0].projectId);
                setSelectedTaskTitle(availableTasks[0].title);
              }
              setIsRunning(true);
            }}
            disabled={availableTasks.length === 0 && !selectedTaskId}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{seconds > 0 ? 'Resume' : 'Start Focus'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleStop}
          disabled={seconds === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-all border border-white/10 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Save Log</span>
        </button>
      </div>
    </div>
  );
};

export default DarkWaveTimeTracker;
