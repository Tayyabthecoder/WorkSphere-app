import http from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.js';
import { ENV } from '../config/env.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export interface SocketUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  tenantId: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface UserPresence {
  userId: string;
  socketId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  activeTaskId?: string;
  joinedAt: string;
}

let ioInstance: SocketServer | null = null;

// Map: projectId -> Map<socketId, UserPresence>
const projectPresenceMap = new Map<string, Map<string, UserPresence>>();

export function initSocketServer(httpServer: http.Server, corsOrigin: string): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Enable Redis adapter for horizontal scaling across instances when REDIS_URL is configured
  if (process.env.REDIS_URL) {
    try {
      const pubClient = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });
      const subClient = pubClient.duplicate();
      pubClient.connect().then(() => subClient.connect()).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log(`⚡ [Socket.IO] Redis adapter enabled on ${process.env.REDIS_URL}`);
      }).catch((redisErr) => {
        console.warn('⚠️ [Socket.IO] Could not connect to Redis, running with in-memory adapter:', redisErr.message);
      });
    } catch (err: any) {
      console.warn('⚠️ [Socket.IO] Redis adapter initialization error:', err.message);
    }
  }

  // JWT Authentication Middleware for WebSocket handshakes
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const secret = ENV.JWT_SECRET;
      const decoded = jwt.verify(token, secret) as any;

      const user: SocketUser = {
        id: decoded.id || decoded.userId,
        userId: decoded.userId || decoded.id,
        name: decoded.name || 'Anonymous User',
        email: decoded.email,
        tenantId: decoded.tenantId,
        role: decoded.role,
        avatarUrl: decoded.avatarUrl,
      };

      socket.data.user = user;
      next();
    } catch (err: any) {
      return next(new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    if (!user) {
      socket.disconnect();
      return;
    }

    // Automatically join tenant and personal user rooms
    const tenantRoom = `tenant:${user.tenantId}`;
    const userRoom = `user:${user.tenantId}:${user.userId}`;
    socket.join(tenantRoom);
    socket.join(userRoom);

    // Track projects this socket joined
    const joinedProjects = new Set<string>();

    // Client joins a project board/view
    socket.on('project:join', ({ projectId }: { projectId: string }) => {
      if (!projectId) return;

      const projectRoom = `project:${user.tenantId}:${projectId}`;
      socket.join(projectRoom);
      joinedProjects.add(projectId);

      if (!projectPresenceMap.has(projectId)) {
        projectPresenceMap.set(projectId, new Map());
      }
      const roomPresence = projectPresenceMap.get(projectId)!;

      const presence: UserPresence = {
        userId: user.userId,
        socketId: socket.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        joinedAt: new Date().toISOString(),
      };

      roomPresence.set(socket.id, presence);

      // Return current presence snapshot to joining user
      const activeUsers = Array.from(roomPresence.values());
      socket.emit('presence:sync', { users: activeUsers });

      // Broadcast to other peers that user joined
      socket.to(projectRoom).emit('presence:user_joined', { user: presence });
    });

    // Client leaves a project
    socket.on('project:leave', ({ projectId }: { projectId: string }) => {
      if (!projectId) return;

      const projectRoom = `project:${user.tenantId}:${projectId}`;
      socket.leave(projectRoom);
      joinedProjects.delete(projectId);

      const roomPresence = projectPresenceMap.get(projectId);
      if (roomPresence) {
        roomPresence.delete(socket.id);
        if (roomPresence.size === 0) {
          projectPresenceMap.delete(projectId);
        }
      }

      socket.to(projectRoom).emit('presence:user_left', { userId: user.userId, socketId: socket.id });
    });

    // Card Focus (active viewing / inspecting task drawer)
    socket.on('presence:card_focus', ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      if (!projectId || !taskId) return;
      const roomPresence = projectPresenceMap.get(projectId);
      if (roomPresence && roomPresence.has(socket.id)) {
        const p = roomPresence.get(socket.id)!;
        p.activeTaskId = taskId;
      }
      const projectRoom = `project:${user.tenantId}:${projectId}`;
      socket.to(projectRoom).emit('presence:card_focused', {
        taskId,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    });

    // Card Blur (closed task drawer)
    socket.on('presence:card_blur', ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      if (!projectId || !taskId) return;
      const roomPresence = projectPresenceMap.get(projectId);
      if (roomPresence && roomPresence.has(socket.id)) {
        const p = roomPresence.get(socket.id)!;
        p.activeTaskId = undefined;
      }
      const projectRoom = `project:${user.tenantId}:${projectId}`;
      socket.to(projectRoom).emit('presence:card_blurred', {
        taskId,
        userId: user.userId,
      });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      for (const projectId of joinedProjects) {
        const roomPresence = projectPresenceMap.get(projectId);
        if (roomPresence) {
          roomPresence.delete(socket.id);
          if (roomPresence.size === 0) {
            projectPresenceMap.delete(projectId);
          }
        }
        const projectRoom = `project:${user.tenantId}:${projectId}`;
        socket.to(projectRoom).emit('presence:user_left', { userId: user.userId, socketId: socket.id });
      }
      joinedProjects.clear();
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketServer(): SocketServer | null {
  return ioInstance;
}

export function emitToProject(tenantId: string, projectId: string, event: string, payload: any): void {
  if (!ioInstance) return;
  const projectRoom = `project:${tenantId}:${projectId}`;
  ioInstance.to(projectRoom).emit(event, payload);
}

export function emitToUser(tenantId: string, userId: string, event: string, payload: any): void {
  if (!ioInstance) return;
  const userRoom = `user:${tenantId}:${userId}`;
  ioInstance.to(userRoom).emit(event, payload);
}

export function emitToTenant(tenantId: string, event: string, payload: any): void {
  if (!ioInstance) return;
  const tenantRoom = `tenant:${tenantId}`;
  ioInstance.to(tenantRoom).emit(event, payload);
}
