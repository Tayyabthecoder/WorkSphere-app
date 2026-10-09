import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { connectDB } from './config/db.js';
import { sendApiError } from './utils/apiResponse.js';
import { initSocketServer } from './socket/index.js';
import { ENV } from './config/env.js';

// Import routers
import authRouter from './routes/auth.js';
import tenantRouter from './routes/tenant.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import sprintsRouter from './routes/sprints.js';
import teamRouter from './routes/team.js';
import teamsRouter from './routes/teams.js';
import timeRouter from './routes/time.js';
import budgetRouter from './routes/budget.js';
import expensesRouter from './routes/expenses.js';
import documentsRouter from './routes/documents.js';
import foldersRouter from './routes/folders.js';
import filesRouter from './routes/files.js';
import notificationsRouter from './routes/notifications.js';
import announcementsRouter from './routes/announcements.js';
import reportsRouter from './routes/reports.js';
import dashboardRouter from './routes/dashboard.js';
import adminRouter from './routes/admin.js';
import clientsRouter from './routes/clients.js';
import organizationRouter from './routes/organization.js';
import portalRouter from './routes/portal.js';
import capacityRouter from './routes/capacity.js';
import commentsRouter from './routes/comments.js';
import activityRouter from './routes/activity.js';
import automationRouter from './routes/automation.js';

const app = express();
const server = http.createServer(app);
const PORT = ENV.PORT;
const CORS_ORIGIN = ENV.CORS_ORIGIN;

// Initialize Sentry error observability if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
  console.log('📡 [Sentry] Error monitoring initialized');
}

// Initialize real-time WebSocket Gateway
initSocketServer(server, CORS_ORIGIN);

// Security and parser middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'worksphere-mern-backend',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiter for authentication endpoints to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

// Create consolidated API v1 router
const apiRouter = express.Router();

// Apply rate limiting to sensitive authentication endpoints
apiRouter.use('/auth/login', authRateLimiter as any);
apiRouter.use('/auth/register', authRateLimiter as any);
apiRouter.use('/auth/signup', authRateLimiter as any);

// Mount modular sub-routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/tenant', tenantRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/sprints', sprintsRouter);
apiRouter.use('/team', teamRouter);
apiRouter.use('/teams', teamsRouter);
apiRouter.use('/time', timeRouter);
apiRouter.use('/budget', budgetRouter);
apiRouter.use('/expenses', expensesRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/folders', foldersRouter);
apiRouter.use('/files', filesRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/announcements', announcementsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/clients', clientsRouter);
apiRouter.use('/organization', organizationRouter);
apiRouter.use('/portal', portalRouter);
apiRouter.use('/capacity', capacityRouter);
apiRouter.use('/availability', capacityRouter);
apiRouter.use('/comments', commentsRouter);
apiRouter.use('/activity', activityRouter);
apiRouter.use('/automation', automationRouter);

// Canonical versioned mount (/api/v1/*) and legacy alias mount (/api/*)
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Interactive OpenAPI / Swagger Documentation
app.use('/api/docs', ...(swaggerUi.serve as any), swaggerUi.setup(swaggerSpec) as any);
app.use('/docs', ...(swaggerUi.serve as any), swaggerUi.setup(swaggerSpec) as any);
app.get('/api/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root Landing & API Status Route
app.get('/', (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WorkSphere API Gateway</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #090d16;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      .card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 1rem;
        padding: 2.5rem;
        max-width: 520px;
        width: 90%;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        font-size: 0.75rem;
        font-weight: 600;
        margin-bottom: 1.25rem;
      }
      .pulse-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: #10b981;
      }
      h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 700; color: #ffffff; }
      p { margin: 0 0 2rem 0; font-size: 0.875rem; color: #9ca3af; line-height: 1.5; }
      .actions { display: flex; flex-direction: column; gap: 0.75rem; }
      .btn {
        display: block;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 600;
        transition: opacity 0.15s ease;
      }
      .btn:hover { opacity: 0.9; }
      .btn-primary { background: #10b981; color: #022c22; }
      .btn-secondary { background: #1f2937; color: #e5e7eb; border: 1px solid #374151; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">
        <span class="pulse-dot"></span>
        REST API & WebSocket Server Online
      </div>
      <h1>WorkSphere Enterprise Hub</h1>
      <p>The backend services are healthy and running on port ${PORT}. Access the web application or browse interactive API documentation below.</p>
      <div class="actions">
        <a href="http://localhost:5173" class="btn btn-primary">Open Web Application (http://localhost:5173) &rarr;</a>
        <a href="/api/docs" class="btn btn-secondary">Open Swagger OpenAPI Docs (/api/docs) &rarr;</a>
      </div>
    </div>
  </body>
</html>
  `);
});

// 404 handler for unmatched routes
app.use('/api/*', (req: Request, res: Response) => {
  sendApiError(res, { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` }, 404);
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  console.error('[MERN Backend Error]', err);
  const status = err.statusCode || 500;
  sendApiError(res, err, status);
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already in use by another application!`);
        console.error(`👉 Either stop the process using port ${PORT}, or change PORT in backend/.env to another port (e.g. 5001).\n`);
      } else {
        console.error('Server error:', err);
      }
    });
    server.listen(PORT, () => {
      console.log(`🚀 WorkSphere MERN Backend running on http://localhost:${PORT}`);
      console.log(`⚡ Real-Time WebSocket Gateway ready on ws://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export { app, server };
export default app;
