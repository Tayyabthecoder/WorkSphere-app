import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Play,
  Pause,
  Square,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Receipt,
  Send,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ManualTimeModal } from '../ManualTimeModal';
import { ClientInvoiceModal } from '../ClientInvoiceModal';
import { useAuthStore } from '../../../store/auth';
import { hasPermission } from '../../../lib/rbac';
import apiClient from '../../../api/client';

interface TimeLogItem {
  entryId: string;
  taskId: string;
  projectId: string;
  taskTitle: string;
  projectName: string;
  startTime: string;
  duration: number; // in minutes
  isBillable: boolean;
  description?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejectionNote?: string;
}

interface PendingApprovalItem {
  entryId: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  projectName: string;
  taskTitle: string;
  startTime: string;
  duration: number;
  isBillable: boolean;
  description?: string;
  status: string;
}

interface TimeSummary {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercentage: number;
}

export const WeeklyTimesheetView: React.FC = () => {
  const { user } = useAuthStore();
  const canApprove = hasPermission(user?.role, 'time:approve');

  const [activeTab, setActiveTab] = useState<'timesheet' | 'approvals'>('timesheet');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isSubmittingWeek, setIsSubmittingWeek] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; entryId: string; note: string }>({
    isOpen: false,
    entryId: '',
    note: '',
  });
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Current week state (anchor date)
  const [currentWeekAnchor, setCurrentWeekAnchor] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [entries, setEntries] = useState<TimeLogItem[]>([]);
  const [summary, setSummary] = useState<TimeSummary>({
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    billablePercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Active Timer Banner state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTaskId, setTimerTaskId] = useState('');
  const [timerProjectId, setTimerProjectId] = useState('');
  const [availableTasks, setAvailableTasks] = useState<
    Array<{ taskId: string; projectId: string; title: string; projectName?: string }>
  >([]);

  // 7 Days of current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days = [];
    const mon = new Date(currentWeekAnchor);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return days;
  }, [currentWeekAnchor]);

  // Week range string
  const weekRangeStr = useMemo(() => {
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} – ${endStr}`;
  }, [weekDays]);

  // Fetch entries for this week
  const fetchWeekEntries = async () => {
    try {
      setIsLoading(true);
      const start = weekDays[0].dateStr;
      const end = `${weekDays[6].dateStr}T23:59:59`;

      const res = await apiClient.get(`/v1/time?startDate=${start}&endDate=${end}`);
      if (res.data?.success && res.data.data) {
        setEntries(res.data.data.entries || []);
        setSummary(res.data.data.summary || {
          totalHours: 0,
          billableHours: 0,
          nonBillableHours: 0,
          billablePercentage: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch timesheet entries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tasks for the active timer dropdown
  useEffect(() => {
    apiClient
      .get('/v1/tasks')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setAvailableTasks(res.data.data);
          if (res.data.data.length > 0) {
            setTimerTaskId(res.data.data[0].taskId);
            setTimerProjectId(res.data.data[0].projectId);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchWeekEntries();
  }, [currentWeekAnchor]);

  // Timer interval tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Fetch pending approvals for managers/admins
  const fetchPendingApprovals = async () => {
    if (!canApprove) return;
    try {
      setIsLoadingPending(true);
      const res = await apiClient.get('/v1/time/pending');
      if (res.data?.success && res.data.data) {
        setPendingApprovals(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    if (canApprove) {
      fetchPendingApprovals();
    }
  }, [canApprove]);

  // Derived Timesheet Status
  const timesheetStatus = useMemo<'Draft' | 'Submitted' | 'Approved' | 'Rejected'>(() => {
    if (entries.length === 0) return 'Draft';
    if (entries.some((e) => e.status === 'rejected')) return 'Rejected';
    if (entries.every((e) => e.status === 'approved')) return 'Approved';
    if (entries.some((e) => e.status === 'submitted')) return 'Submitted';
    return 'Draft';
  }, [entries]);

  const rejectedEntry = useMemo(() => entries.find((e) => e.status === 'rejected'), [entries]);

  // Submit entire week
  const handleSubmitWeek = async () => {
    try {
      setIsSubmittingWeek(true);
      setActionFeedback(null);
      const start = weekDays[0].dateStr;
      const end = `${weekDays[6].dateStr}T23:59:59`;
      const res = await apiClient.post('/v1/time/submit-week', {
        startDate: start,
        endDate: end,
      });
      if (res.data?.success) {
        setActionFeedback({
          type: 'success',
          message: res.data.data.message || 'Timesheet submitted for review!',
        });
        fetchWeekEntries();
        if (canApprove) fetchPendingApprovals();
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.error?.message || 'Failed to submit timesheet',
      });
    } finally {
      setIsSubmittingWeek(false);
    }
  };

  // Review single entry
  const handleApproveEntry = async (entryId: string) => {
    try {
      const res = await apiClient.patch(`/v1/time/${entryId}/approve`);
      if (res.data?.success) {
        setPendingApprovals((prev) => prev.filter((p) => p.entryId !== entryId));
        fetchWeekEntries();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to approve time entry');
    }
  };

  const handleApproveAll = async () => {
    try {
      for (const item of pendingApprovals) {
        await apiClient.patch(`/v1/time/${item.entryId}/approve`);
      }
      fetchPendingApprovals();
      fetchWeekEntries();
    } catch (err: any) {
      alert('Error approving some entries');
    }
  };

  const handleRejectEntry = async () => {
    if (!rejectModal.note.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      const res = await apiClient.patch(`/v1/time/${rejectModal.entryId}/reject`, {
        rejectionNote: rejectModal.note,
      });
      if (res.data?.success) {
        setPendingApprovals((prev) => prev.filter((p) => p.entryId !== rejectModal.entryId));
        setRejectModal({ isOpen: false, entryId: '', note: '' });
        fetchWeekEntries();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to reject time entry');
    }
  };

  // Week Navigation
  const prevWeek = () => {
    const d = new Date(currentWeekAnchor);
    d.setDate(d.getDate() - 7);
    setCurrentWeekAnchor(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekAnchor);
    d.setDate(d.getDate() + 7);
    setCurrentWeekAnchor(d);
  };

  const goToCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekAnchor(monday);
  };

  // Matrix construction: unique tasks logged during this week
  const matrixRows = useMemo(() => {
    const taskMap = new Map<
      string,
      {
        taskId: string;
        projectId: string;
        taskTitle: string;
        projectName: string;
        days: Record<string, { minutes: number; isBillable: boolean }>;
        totalMinutes: number;
      }
    >();

    entries.forEach((e) => {
      const dayKey = e.startTime.split('T')[0];
      let row = taskMap.get(e.taskId);
      if (!row) {
        row = {
          taskId: e.taskId,
          projectId: e.projectId,
          taskTitle: e.taskTitle,
          projectName: e.projectName,
          days: {},
          totalMinutes: 0,
        };
        taskMap.set(e.taskId, row);
      }

      const existingDay = row.days[dayKey] || { minutes: 0, isBillable: e.isBillable };
      existingDay.minutes += e.duration;
      if (e.isBillable) existingDay.isBillable = true;
      row.days[dayKey] = existingDay;
      row.totalMinutes += e.duration;
    });

    return Array.from(taskMap.values());
  }, [entries]);

  // Day totals calculation
  const dayTotals = useMemo(() => {
    return weekDays.map((day) => {
      let mins = 0;
      let billableMins = 0;
      entries.forEach((e) => {
        if (e.startTime.split('T')[0] === day.dateStr) {
          mins += e.duration;
          if (e.isBillable) billableMins += e.duration;
        }
      });
      return {
        dateStr: day.dateStr,
        hours: +(mins / 60).toFixed(1),
        billablePercentage: mins > 0 ? Math.round((billableMins / mins) * 100) : 0,
      };
    });
  }, [weekDays, entries]);

  // Handle Stop Timer
  const handleStopTimer = async () => {
    if (!timerTaskId || timerSeconds < 60) {
      setIsTimerRunning(false);
      setTimerSeconds(0);
      return;
    }

    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60));
    try {
      await apiClient.post('/v1/time', {
        taskId: timerTaskId,
        projectId: timerProjectId,
        duration: durationMinutes,
        isBillable: true,
        description: 'Timer session from weekly timesheet',
      });

      setIsTimerRunning(false);
      setTimerSeconds(0);
      fetchWeekEntries();
    } catch (err) {
      console.error('Failed to save timer entry:', err);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6 pb-12">
      {/* Tab Switcher for Approvers */}
      {canApprove && (
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <button
            onClick={() => setActiveTab('timesheet')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'timesheet'
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
            }`}
          >
            My Timesheet
          </button>
          <button
            onClick={() => {
              setActiveTab('approvals');
              fetchPendingApprovals();
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            {pendingApprovals.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'approvals'
                    ? 'bg-white text-brand-emerald'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Action feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-text-muted hover:text-text-primary ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Rejection Alert */}
      {rejectedEntry && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex flex-wrap items-center justify-between gap-3 text-red-400 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-bold">Timesheet Changes Requested:</span>{' '}
              {rejectedEntry.rejectionNote || 'Manager requested review and revisions.'}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmitWeek}
            disabled={isSubmittingWeek}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            {isSubmittingWeek ? 'Submitting...' : 'Re-submit Timesheet'}
          </Button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            {activeTab === 'timesheet' ? 'Weekly Timesheet' : 'Pending Approvals'}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {activeTab === 'timesheet'
              ? 'Log billable client hours, review capacity, and submit time entries'
              : 'Review submitted time logs from your team members before client invoicing'}
          </p>
        </div>

        {activeTab === 'timesheet' ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Approval Workflow Controls */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-low border border-border/80 text-xs">
              <span className="text-text-muted">Status:</span>
              <span
                className={`font-semibold ${
                  timesheetStatus === 'Approved'
                    ? 'text-brand-emerald'
                    : timesheetStatus === 'Submitted'
                    ? 'text-amber-400'
                    : timesheetStatus === 'Rejected'
                    ? 'text-red-400'
                    : 'text-text-secondary'
                }`}
              >
                {timesheetStatus}
              </span>
            </div>

            {timesheetStatus === 'Draft' || timesheetStatus === 'Rejected' ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-3.5 h-3.5" />}
                onClick={handleSubmitWeek}
                disabled={isSubmittingWeek || entries.length === 0}
              >
                {isSubmittingWeek
                  ? 'Submitting...'
                  : timesheetStatus === 'Rejected'
                  ? 'Re-submit Timesheet'
                  : 'Submit Timesheet'}
              </Button>
            ) : timesheetStatus === 'Submitted' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" /> Pending Review
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Receipt className="w-4 h-4 text-brand-emerald" />}
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              Invoice Generator
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsManualModalOpen(true)}
            >
              Log Time
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingPending ? 'animate-spin' : ''}`} />}
              onClick={fetchPendingApprovals}
            >
              Refresh
            </Button>
            {pendingApprovals.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check className="w-3.5 h-3.5" />}
                onClick={handleApproveAll}
              >
                Approve All ({pendingApprovals.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'approvals' ? (
        /* Approvals Queue Table */
        <div className="border border-border/80 rounded-xl bg-surface-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-low border-b border-border/80 text-text-muted font-semibold">
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Project &amp; Task</th>
                  <th className="py-3 px-3 text-center">Date</th>
                  <th className="py-3 px-3 text-center">Duration</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingPending ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      Loading pending approval queue...
                    </td>
                  </tr>
                ) : pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-brand-emerald" />
                        <span className="font-semibold text-text-primary">All caught up!</span>
                        <span className="text-xs text-text-muted">
                          No pending timesheet entries awaiting review.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((item) => (
                    <tr key={item.entryId} className="hover:bg-surface-low/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-emerald/15 text-brand-emerald flex items-center justify-center font-bold text-xs uppercase">
                            {item.userName ? item.userName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{item.userName}</div>
                            <div className="text-[11px] text-text-secondary">{item.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-primary">{item.taskTitle}</div>
                        <div className="text-[11px] text-text-secondary">{item.projectName}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-text-secondary">
                        {item.startTime ? item.startTime.split('T')[0] : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">
                        {+(item.duration / 60).toFixed(1)}h
                        {item.isBillable && (
                          <span className="ml-1 text-[10px] text-brand-emerald font-normal">($)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-text-secondary">
                        {item.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveEntry(item.entryId)}
                            className="px-2.5 py-1 rounded bg-brand-emerald/15 hover:bg-brand-emerald/25 text-brand-emerald font-semibold text-xs flex items-center gap-1 transition-colors"
                            title="Approve entry"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({ isOpen: true, entryId: item.entryId, note: '' })
                            }
                            className="px-2.5 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-xs flex items-center gap-1 transition-colors"
                            title="Reject entry"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>

      {/* Active Focus Timer Banner */}
      <div className="p-4 rounded-xl bg-surface-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isTimerRunning
                ? 'bg-brand-emerald text-white animate-pulse'
                : 'bg-surface-low text-text-muted'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Live Focus Session
              </span>
              {isTimerRunning && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald"></span>
                </span>
              )}
            </div>
            <div className="text-xl font-mono font-bold text-text-primary tracking-wider mt-0.5">
              {formatTimer(timerSeconds)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timerTaskId}
            onChange={(e) => {
              const selected = availableTasks.find((t) => t.taskId === e.target.value);
              if (selected) {
                setTimerTaskId(selected.taskId);
                setTimerProjectId(selected.projectId);
              }
            }}
            disabled={isTimerRunning}
            className="text-xs p-2 rounded-lg bg-surface-low border border-border text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald max-w-xs"
          >
            {availableTasks.map((t) => (
              <option key={t.taskId} value={t.taskId}>
                {t.title} {t.projectName ? `(${t.projectName})` : ''}
              </option>
            ))}
            {availableTasks.length === 0 && (
              <option value="">No tasks available to track</option>
            )}
          </select>

          {isTimerRunning ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTimerRunning(false)}
                leftIcon={<Pause className="w-3.5 h-3.5" />}
              >
                Pause
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStopTimer}
                leftIcon={<Square className="w-3.5 h-3.5" />}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Stop &amp; Save
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTimerRunning(true)}
              leftIcon={<Play className="w-3.5 h-3.5" />}
              disabled={availableTasks.length === 0}
            >
              Start Timer
            </Button>
          )}
        </div>
      </div>

      {/* Week Navigator & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Week Navigator */}
        <div className="md:col-span-1 p-4 rounded-xl bg-surface-card border border-border/80 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Timesheet Week
            </span>
            <button
              onClick={goToCurrentWeek}
              className="text-[11px] font-semibold text-brand-emerald hover:underline"
            >
              Current Week
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={prevWeek}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-text-primary text-center">
              {weekRangeStr}
            </div>
            <button
              onClick={nextWeek}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Total Logged
            </span>
            <div className="text-xl font-bold font-mono text-text-primary mt-1">
              {summary.totalHours.toFixed(1)} hrs
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-low text-text-muted flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Billable Hours
            </span>
            <div className="text-xl font-bold font-mono text-brand-emerald mt-1">
              {summary.billableHours.toFixed(1)} hrs
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Billable %
            </span>
            <div className="text-xl font-bold font-mono text-text-primary mt-1">
              {summary.billablePercentage}%
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-low text-text-muted flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Timesheet Matrix Table */}
      <div className="border border-border/80 rounded-xl bg-surface-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-low border-b border-border/80 text-text-muted font-semibold">
                <th className="py-3 px-4 w-72">Task Deliverable</th>
                {weekDays.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`py-3 px-3 text-center w-24 ${
                      d.isToday ? 'bg-brand-emerald/10 text-brand-emerald font-bold' : ''
                    }`}
                  >
                    <div>{d.dayName}</div>
                    <div className="text-[10px] text-text-muted font-mono">{d.dayNumber}</div>
                  </th>
                ))}
                <th className="py-3 px-4 text-right w-24 font-bold text-text-primary">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    Loading weekly timesheet entries...
                  </td>
                </tr>
              ) : matrixRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    No time entries logged for this week. Use &quot;Start Timer&quot; or &quot;Log Time&quot; above.
                  </td>
                </tr>
              ) : (
                matrixRows.map((row) => (
                  <tr key={row.taskId} className="hover:bg-surface-low/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{row.taskTitle}</div>
                      <div className="text-[11px] text-text-secondary">{row.projectName}</div>
                    </td>
                    {weekDays.map((d) => {
                      const dayData = row.days[d.dateStr];
                      const hours = dayData ? +(dayData.minutes / 60).toFixed(1) : 0;
                      return (
                        <td
                          key={d.dateStr}
                          className={`py-3 px-3 text-center font-mono ${
                            d.isToday ? 'bg-brand-emerald/5' : ''
                          }`}
                        >
                          {hours > 0 ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                dayData?.isBillable
                                  ? 'bg-brand-emerald/15 text-brand-emerald font-bold'
                                  : 'bg-surface-low text-text-secondary'
                              }`}
                            >
                              {hours}h
                            </span>
                          ) : (
                            <span className="text-text-muted/40">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">
                      {+(row.totalMinutes / 60).toFixed(1)}h
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Daily Totals Footer */}
            {!isLoading && matrixRows.length > 0 && (
              <tfoot>
                <tr className="bg-surface-low/80 border-t border-border font-bold text-text-primary">
                  <td className="py-3 px-4 text-xs">Total Hours / Day</td>
                  {dayTotals.map((tot) => (
                    <td
                      key={tot.dateStr}
                      className="py-3 px-3 text-center font-mono text-xs"
                    >
                      <div>{tot.hours}h</div>
                      {tot.hours > 0 && (
                        <div className="text-[10px] text-brand-emerald font-normal">
                          {tot.billablePercentage}% billable
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-mono text-sm text-brand-emerald">
                    {summary.totalHours.toFixed(1)}h
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-card border border-border rounded-xl shadow-xl w-full max-w-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Reject Time Entry
              </h3>
              <button
                onClick={() => setRejectModal({ isOpen: false, entryId: '', note: '' })}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Please provide a reason for rejecting this time entry so the team member can make adjustments.
            </p>
            <textarea
              value={rejectModal.note}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="e.g., Task duration exceeds estimate, or missing client work description..."
              className="w-full h-24 p-2.5 rounded-lg bg-surface-low border border-border text-xs text-text-primary outline-none focus:ring-1 focus:ring-red-400 resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModal({ isOpen: false, entryId: '', note: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRejectEntry}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ManualTimeModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onTimeLogged={fetchWeekEntries}
      />

      <ClientInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        entries={entries}
        tenantName={user?.tenantId || 'NovaTech Labs'}
        weekRangeStr={weekRangeStr}
      />
    </div>
  );
};

export default WeeklyTimesheetView;
