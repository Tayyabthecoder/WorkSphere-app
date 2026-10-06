import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useAuthStore } from '../store/auth';
import { Bell, CheckCircle2, Info, X } from 'lucide-react';

export interface UserPresence {
  userId: string;
  socketId?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  activeTaskId?: string;
  joinedAt?: string;
}

export interface RealtimeToast {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'alert';
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  addToast: (toast: Omit<RealtimeToast, 'id'>) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  addToast: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);

  const addToast = useCallback((toastData: Omit<RealtimeToast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: RealtimeToast = { ...toastData, id };
    setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = getSocket();
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // Global listener for new personal notifications
    const onNotificationNew = (data: { notification: any }) => {
      if (data?.notification) {
        addToast({
          title: data.notification.title || 'New Notification',
          message: data.notification.message || '',
          type: 'info',
        });
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('notification:new', onNotificationNew);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('notification:new', onNotificationNew);
    };
  }, [isAuthenticated, accessToken, addToast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, addToast }}>
      {children}

      {/* Floating Real-Time Mini-Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 bg-surface-card border border-border/80 shadow-2xl rounded-xl text-xs animate-slide-up backdrop-blur-md bg-opacity-95 text-text-primary transition-all duration-200"
          >
            <div className="mt-0.5 p-1 rounded-full bg-brand-emerald/15 text-brand-emerald shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : toast.type === 'alert' ? (
                <Bell className="w-3.5 h-3.5 text-status-warning" />
              ) : (
                <Info className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex-1 pr-1">
              <p className="font-semibold text-text-primary">{toast.title}</p>
              <p className="text-text-secondary mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary p-0.5 transition-colors"
              aria-label="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Hook to manage project presence (who is currently viewing the project board)
 * and active task focus indicators.
 */
export function useProjectPresence(projectId?: string) {
  const { socket, isConnected } = useSocket();
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [focusedCards, setFocusedCards] = useState<Record<string, UserPresence>>({});
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  useEffect(() => {
    if (!socket || !isConnected || !projectId) return;

    socket.emit('project:join', { projectId });

    const handlePresenceSync = (data: { users: UserPresence[] }) => {
      setActiveUsers(data.users || []);
    };

    const handleUserJoined = (data: { user: UserPresence }) => {
      setActiveUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== data.user.userId);
        return [...filtered, data.user];
      });
    };

    const handleUserLeft = (data: { userId: string; socketId: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      setFocusedCards((prev) => {
        const next = { ...prev };
        for (const [taskId, user] of Object.entries(next)) {
          if (user.userId === data.userId) {
            delete next[taskId];
          }
        }
        return next;
      });
    };

    const handleCardFocused = (data: { taskId: string; user: UserPresence }) => {
      setFocusedCards((prev) => ({
        ...prev,
        [data.taskId]: data.user,
      }));
    };

    const handleCardBlurred = (data: { taskId: string; userId: string }) => {
      setFocusedCards((prev) => {
        const next = { ...prev };
        if (next[data.taskId]?.userId === data.userId) {
          delete next[data.taskId];
        }
        return next;
      });
    };

    socket.on('presence:sync', handlePresenceSync);
    socket.on('presence:user_joined', handleUserJoined);
    socket.on('presence:user_left', handleUserLeft);
    socket.on('presence:card_focused', handleCardFocused);
    socket.on('presence:card_blurred', handleCardBlurred);

    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('presence:sync', handlePresenceSync);
      socket.off('presence:user_joined', handleUserJoined);
      socket.off('presence:user_left', handleUserLeft);
      socket.off('presence:card_focused', handleCardFocused);
      socket.off('presence:card_blurred', handleCardBlurred);
    };
  }, [socket, isConnected, projectId]);

  const setCardFocus = useCallback(
    (taskId: string) => {
      if (socket && isConnected && projectIdRef.current) {
        socket.emit('presence:card_focus', { projectId: projectIdRef.current, taskId });
      }
    },
    [socket, isConnected]
  );

  const clearCardFocus = useCallback(
    (taskId: string) => {
      if (socket && isConnected && projectIdRef.current) {
        socket.emit('presence:card_blur', { projectId: projectIdRef.current, taskId });
      }
    },
    [socket, isConnected]
  );

  return {
    activeUsers,
    focusedCards,
    setCardFocus,
    clearCardFocus,
    isConnected,
  };
}
