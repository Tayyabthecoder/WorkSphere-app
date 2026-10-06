import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (socketInstance) {
    // If auth token has changed or was set, update handshake auth
    const currentToken = useAuthStore.getState().accessToken;
    if (currentToken && socketInstance.auth) {
      (socketInstance.auth as any).token = currentToken;
    }
    return socketInstance;
  }

  const token = useAuthStore.getState().accessToken;

  // In development Vite proxies /socket.io to localhost:5000 with ws: true
  // In production it points to the window origin or backend origin
  socketInstance = io(window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: {
      token,
    },
  });

  socketInstance.on('connect', () => {
    console.log('⚡ [WorkSphere Socket] Connected:', socketInstance?.id);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('⚠️ [WorkSphere Socket] Connection error:', err.message);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('🔌 [WorkSphere Socket] Disconnected:', reason);
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
