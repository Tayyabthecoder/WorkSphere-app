import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Sun,
  Palmtree,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  useAvailability,
  useRecordAvailability,
  useDeleteAvailability,
  AvailabilityItem,
  AvailabilityType,
} from '../../../hooks/useCapacity';
import apiClient from '../../../api/client';

interface TeamMember {
  userId: string;
  name: string;
  role: string;
}

export const AvailabilityCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>('');
  const [modalUserId, setModalUserId] = useState<string>('');
  const [modalType, setModalType] = useState<AvailabilityType>('pto');
  const [modalHours, setModalHours] = useState<number>(0);
  const [modalNote, setModalNote] = useState<string>('');
  const [error, setError] = useState('');

  const recordMutation = useRecordAvailability();
  const deleteMutation = useDeleteAvailability();

  // Fetch team members
  useEffect(() => {
    apiClient.get('/v1/team')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setTeamMembers(res.data.data);
          if (res.data.data.length > 0 && !modalUserId) {
            setModalUserId(res.data.data[0].userId);
          }
        }
      })
      .catch((err) => console.error('Failed to load team members:', err));
  }, []);

  // Compute month range for query
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { from, to, daysInMonth, startDayOfWeek } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const fromStr = new Date(year, month, 1 - firstDay.getDay()).toISOString().slice(0, 10);
    const toStr = new Date(year, month + 1, 7 - lastDay.getDay()).toISOString().slice(0, 10);

    return {
      from: fromStr,
      to: toStr,
      daysInMonth: lastDay.getDate(),
      startDayOfWeek: firstDay.getDay(),
    };
  }, [year, month]);

  const { data: availabilityList = [], isLoading } = useAvailability(
    selectedUserId,
    from,
    to
  );

  // Group availability records by Date string (YYYY-MM-DD)
  const availabilityByDate = useMemo(() => {
    const map: Record<string, AvailabilityItem[]> = {};
    availabilityList.forEach((item) => {
      const dateKey = new Date(item.date).toISOString().slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });
    return map;
  }, [availabilityList]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenModal = (dateStr: string) => {
    setModalDate(dateStr);
    setModalType('pto');
    setModalHours(0);
    setModalNote('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDate) {
      setError('Date is required');
      return;
    }
    if (!modalUserId) {
      setError('Please select a team member');
      return;
    }

    try {
      await recordMutation.mutateAsync({
        userId: modalUserId,
        date: modalDate,
        type: modalType,
        hoursAvailable: modalType === 'partial' ? modalHours : 0,
        note: modalNote,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to record availability');
    }
  };

  const handleDelete = async (availabilityId: string) => {
    try {
      await deleteMutation.mutateAsync(availabilityId);
    } catch (err: any) {
      console.error('Delete failed:', err);
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map userId to Member Name
  const memberNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamMembers.forEach((m) => {
      map[m.userId] = m.name;
    });
    return map;
  }, [teamMembers]);

  return (
    <Card className="rounded-xl border border-border/80 shadow-card p-6 flex flex-col gap-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-brand-emerald" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Availability & Time Off</h3>
            <p className="text-xs text-text-secondary">
              Track team member PTO, scheduled holidays, and adjusted capacity.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Member Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-muted">Member:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-surface-low border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-emerald"
            >
              <option value="all">All Members</option>
              {teamMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center gap-1.5 bg-surface-low border border-border rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-surface-card rounded text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-text-primary px-2 min-w-[110px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-surface-card rounded text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-col border border-border/80 rounded-xl overflow-hidden shadow-2xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-surface-low/80 border-b border-border/80 text-center py-2.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr bg-border/40 gap-px">
          {Array.from({ length: 42 }).map((_, index) => {
            const dayNum = index - startDayOfWeek + 1;
            const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;

            const cellDate = new Date(year, month, dayNum);
            const dateStr = cellDate.toISOString().slice(0, 10);
            const records = isCurrentMonth ? availabilityByDate[dateStr] || [] : [];

            const isToday =
              isCurrentMonth &&
              new Date().toISOString().slice(0, 10) === dateStr;

            return (
              <div
                key={index}
                className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                  isCurrentMonth
                    ? 'bg-surface-card hover:bg-surface-low/40'
                    : 'bg-surface-ground/60 text-text-muted opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-brand-emerald text-white flex items-center justify-center font-bold'
                        : isCurrentMonth
                        ? 'text-text-primary'
                        : 'text-text-muted'
                    }`}
                  >
                    {isCurrentMonth ? dayNum : ''}
                  </span>

                  {isCurrentMonth && (
                    <button
                      onClick={() => handleOpenModal(dateStr)}
                      className="opacity-0 hover:opacity-100 focus:opacity-100 p-1 text-text-muted hover:text-brand-emerald rounded transition-opacity"
                      title="Add Time Off"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Availability Pills */}
                <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[70px]">
                  {records.map((rec) => {
                    const isPto = rec.type === 'pto';
                    const isHoliday = rec.type === 'holiday';
                    const isPartial = rec.type === 'partial';

                    const memberName = memberNameMap[rec.userId] || 'Member';

                    return (
                      <div
                        key={rec.availabilityId}
                        className={`group flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          isPto
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : isHoliday
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          {isPto && <Palmtree className="w-2.5 h-2.5 shrink-0" />}
                          {isHoliday && <Sun className="w-2.5 h-2.5 shrink-0" />}
                          {isPartial && <Clock className="w-2.5 h-2.5 shrink-0" />}
                          <span className="truncate">
                            {memberName}: {isPartial ? `${rec.hoursAvailable}h` : rec.type.toUpperCase()}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDelete(rec.availabilityId)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 ml-1 transition-opacity shrink-0"
                          title="Remove Record"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Record Availability Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-card border border-border/80 rounded-2xl w-full max-w-md shadow-modal overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-brand-emerald" />
                <h4 className="text-sm font-bold text-text-primary">Record Availability / Time Off</h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 flex flex-col gap-4">
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">Team Member</label>
                <select
                  value={modalUserId}
                  onChange={(e) => setModalUserId(e.target.value)}
                  className="w-full bg-surface-low border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-emerald"
                >
                  {teamMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">Date</label>
                <Input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pto', 'holiday', 'partial'] as AvailabilityType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setModalType(t)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                        modalType === t
                          ? 'bg-brand-emerald text-white border-brand-emerald'
                          : 'bg-surface-low text-text-secondary border-border hover:bg-surface-card'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {modalType === 'partial' && (
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1 block">
                    Hours Available (1-7)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={modalHours}
                    onChange={(e) => setModalHours(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">
                  Note / Reason (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Doctor appointment, public holiday"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/60 pt-4">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={recordMutation.isPending}>
                  {recordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Time Off'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AvailabilityCalendar;
