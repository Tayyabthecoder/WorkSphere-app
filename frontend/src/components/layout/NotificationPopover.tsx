import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import apiClient from '../../api/client';
import { useSocket } from '../../context/SocketContext';

export const NotificationPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/v1/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {
      // Ignore initial background notification fetch error
    }
  };

  // Initial fetch on mount and real-time push listener (zero polling interval)
  useEffect(() => {
    fetchNotifications();

    if (!socket || !isConnected) return;

    const handleNewNotification = (data: { notification: any }) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleMarkedRead = (data: { notificationId?: string }) => {
      if (data?.notificationId) {
        setNotifications((prev) =>
          prev.map((n) => (n.notificationId === data.notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:marked_read', handleMarkedRead);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:marked_read', handleMarkedRead);
    };
  }, [socket, isConnected]);

  const markAllRead = async () => {
    try {
      await apiClient.patch('/v1/notifications', {});
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-low transition-colors relative cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-error animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface-card border border-border/80 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-3 border-b border-border/80 flex items-center justify-between bg-surface-low/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">Notifications</span>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-brand-emerald hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item._id || item.notificationId}
                  className={`p-3 text-xs flex flex-col gap-1 transition-colors ${
                    !item.isRead ? 'bg-brand-emerald/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">{item.title}</span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                No notifications right now
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPopover;
