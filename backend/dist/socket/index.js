"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.getSocketServer = getSocketServer;
exports.emitToProject = emitToProject;
exports.emitToUser = emitToUser;
exports.emitToTenant = emitToTenant;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = require("ioredis");
let ioInstance = null;
// Map: projectId -> Map<socketId, UserPresence>
const projectPresenceMap = new Map();
function initSocketServer(httpServer, corsOrigin) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: corsOrigin,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    // Enable Redis adapter for horizontal scaling across instances when REDIS_URL is configured
    if (process.env.REDIS_URL) {
        try {
            const pubClient = new ioredis_1.Redis(process.env.REDIS_URL, {
                lazyConnect: true,
                maxRetriesPerRequest: 3,
            });
            const subClient = pubClient.duplicate();
            pubClient.connect().then(() => subClient.connect()).then(() => {
                io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
                console.log(`⚡ [Socket.IO] Redis adapter enabled on ${process.env.REDIS_URL}`);
            }).catch((redisErr) => {
                console.warn('⚠️ [Socket.IO] Could not connect to Redis, running with in-memory adapter:', redisErr.message);
            });
        }
        catch (err) {
            console.warn('⚠️ [Socket.IO] Redis adapter initialization error:', err.message);
        }
    }
    // JWT Authentication Middleware for WebSocket handshakes
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const secret = env_js_1.ENV.JWT_SECRET;
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            const user = {
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
        }
        catch (err) {
            return next(new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
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
        const joinedProjects = new Set();
        // Client joins a project board/view
        socket.on('project:join', ({ projectId }) => {
            if (!projectId)
                return;
            const projectRoom = `project:${user.tenantId}:${projectId}`;
            socket.join(projectRoom);
            joinedProjects.add(projectId);
            if (!projectPresenceMap.has(projectId)) {
                projectPresenceMap.set(projectId, new Map());
            }
            const roomPresence = projectPresenceMap.get(projectId);
            const presence = {
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
        socket.on('project:leave', ({ projectId }) => {
            if (!projectId)
                return;
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
        socket.on('presence:card_focus', ({ projectId, taskId }) => {
            if (!projectId || !taskId)
                return;
            const roomPresence = projectPresenceMap.get(projectId);
            if (roomPresence && roomPresence.has(socket.id)) {
                const p = roomPresence.get(socket.id);
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
        socket.on('presence:card_blur', ({ projectId, taskId }) => {
            if (!projectId || !taskId)
                return;
            const roomPresence = projectPresenceMap.get(projectId);
            if (roomPresence && roomPresence.has(socket.id)) {
                const p = roomPresence.get(socket.id);
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
function getSocketServer() {
    return ioInstance;
}
function emitToProject(tenantId, projectId, event, payload) {
    if (!ioInstance)
        return;
    const projectRoom = `project:${tenantId}:${projectId}`;
    ioInstance.to(projectRoom).emit(event, payload);
}
function emitToUser(tenantId, userId, event, payload) {
    if (!ioInstance)
        return;
    const userRoom = `user:${tenantId}:${userId}`;
    ioInstance.to(userRoom).emit(event, payload);
}
function emitToTenant(tenantId, event, payload) {
    if (!ioInstance)
        return;
    const tenantRoom = `tenant:${tenantId}`;
    ioInstance.to(tenantRoom).emit(event, payload);
}
