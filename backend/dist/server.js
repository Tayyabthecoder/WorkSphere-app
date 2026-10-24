"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const Sentry = __importStar(require("@sentry/node"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_js_1 = require("./config/swagger.js");
const db_js_1 = require("./config/db.js");
const apiResponse_js_1 = require("./utils/apiResponse.js");
const index_js_1 = require("./socket/index.js");
const env_js_1 = require("./config/env.js");
// Import routers
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const tenant_js_1 = __importDefault(require("./routes/tenant.js"));
const projects_js_1 = __importDefault(require("./routes/projects.js"));
const tasks_js_1 = __importDefault(require("./routes/tasks.js"));
const sprints_js_1 = __importDefault(require("./routes/sprints.js"));
const team_js_1 = __importDefault(require("./routes/team.js"));
const teams_js_1 = __importDefault(require("./routes/teams.js"));
const time_js_1 = __importDefault(require("./routes/time.js"));
const budget_js_1 = __importDefault(require("./routes/budget.js"));
const expenses_js_1 = __importDefault(require("./routes/expenses.js"));
const documents_js_1 = __importDefault(require("./routes/documents.js"));
const folders_js_1 = __importDefault(require("./routes/folders.js"));
const files_js_1 = __importDefault(require("./routes/files.js"));
const notifications_js_1 = __importDefault(require("./routes/notifications.js"));
const announcements_js_1 = __importDefault(require("./routes/announcements.js"));
const reports_js_1 = __importDefault(require("./routes/reports.js"));
const dashboard_js_1 = __importDefault(require("./routes/dashboard.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
const clients_js_1 = __importDefault(require("./routes/clients.js"));
const organization_js_1 = __importDefault(require("./routes/organization.js"));
const portal_js_1 = __importDefault(require("./routes/portal.js"));
const capacity_js_1 = __importDefault(require("./routes/capacity.js"));
const comments_js_1 = __importDefault(require("./routes/comments.js"));
const activity_js_1 = __importDefault(require("./routes/activity.js"));
const automation_js_1 = __importDefault(require("./routes/automation.js"));
const blog_js_1 = __importDefault(require("./routes/blog.js"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = env_js_1.ENV.PORT;
const CORS_ORIGIN = env_js_1.ENV.CORS_ORIGIN;
// Initialize Sentry error observability if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 0.2,
    });
    console.log('📡 [Sentry] Error monitoring initialized');
}
// Initialize real-time WebSocket Gateway (Only in non-serverless environments)
if (!process.env.VERCEL) {
    (0, index_js_1.initSocketServer)(server, CORS_ORIGIN);
}
// Security and parser middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (process.env.NODE_ENV !== 'production' ||
            process.env.VERCEL ||
            CORS_ORIGIN === '*' ||
            origin === CORS_ORIGIN ||
            origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoints (Placed BEFORE DB middleware so health status is always accessible)
const healthHandler = (_req, res) => {
    res.json({
        status: 'ok',
        service: 'worksphere-mern-backend',
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV || 'production',
            hasJwtSecret: Boolean(process.env.JWT_SECRET),
            hasMongoUri: Boolean(process.env.MONGODB_URI),
        },
    });
};
app.get(['/api', '/api/health', '/health'], healthHandler);
// Ensure MongoDB is connected in serverless environments (e.g. Vercel)
app.use(async (req, res, next) => {
    if (req.path === '/health' || req.path === '/api/health' || req.path === '/api' || req.path === '/favicon.ico') {
        return next();
    }
    try {
        await (0, db_js_1.connectDB)();
        next();
    }
    catch (err) {
        console.error('[MERN Serverless DB Error]', err);
        return (0, apiResponse_js_1.sendApiError)(res, {
            code: 'DB_CONNECTION_ERROR',
            message: 'Database connection failed. Please ensure MongoDB Atlas IP Access allows access (0.0.0.0/0) and credentials are valid.',
            details: err?.message || String(err),
        }, 503);
    }
});
// Rate limiter for authentication endpoints to prevent brute-force attacks
const authRateLimiter = (0, express_rate_limit_1.default)({
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
const apiRouter = express_1.default.Router();
// Apply rate limiting to sensitive authentication endpoints
apiRouter.use('/auth/login', authRateLimiter);
apiRouter.use('/auth/register', authRateLimiter);
apiRouter.use('/auth/signup', authRateLimiter);
// Mount modular sub-routers
apiRouter.use('/auth', auth_js_1.default);
apiRouter.use('/tenant', tenant_js_1.default);
apiRouter.use('/projects', projects_js_1.default);
apiRouter.use('/tasks', tasks_js_1.default);
apiRouter.use('/sprints', sprints_js_1.default);
apiRouter.use('/team', team_js_1.default);
apiRouter.use('/teams', teams_js_1.default);
apiRouter.use('/time', time_js_1.default);
apiRouter.use('/budget', budget_js_1.default);
apiRouter.use('/expenses', expenses_js_1.default);
apiRouter.use('/documents', documents_js_1.default);
apiRouter.use('/folders', folders_js_1.default);
apiRouter.use('/files', files_js_1.default);
apiRouter.use('/notifications', notifications_js_1.default);
apiRouter.use('/announcements', announcements_js_1.default);
apiRouter.use('/reports', reports_js_1.default);
apiRouter.use('/dashboard', dashboard_js_1.default);
apiRouter.use('/admin', admin_js_1.default);
apiRouter.use('/clients', clients_js_1.default);
apiRouter.use('/organization', organization_js_1.default);
apiRouter.use('/portal', portal_js_1.default);
apiRouter.use('/capacity', capacity_js_1.default);
apiRouter.use('/availability', capacity_js_1.default);
apiRouter.use('/comments', comments_js_1.default);
apiRouter.use('/activity', activity_js_1.default);
apiRouter.use('/automation', automation_js_1.default);
apiRouter.use('/blog', blog_js_1.default);
// Canonical versioned mount (/api/v1/*) and legacy alias mount (/api/*)
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);
// Interactive OpenAPI / Swagger Documentation
app.use('/api/docs', ...swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
app.use('/docs', ...swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerSpec));
app.get('/api/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_js_1.swaggerSpec);
});
// Root Landing & API Status Route
app.get('/', (_req, res) => {
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
// 404 handler for unmatched API routes
app.use(['/api/*', '/api'], (req, res) => {
    (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` }, 404);
});
// Global error handler
app.use((err, _req, res, _next) => {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }
    console.error('[MERN Backend Error]', err);
    const status = err.statusCode || 500;
    (0, apiResponse_js_1.sendApiError)(res, err, status);
});
// Connect to MongoDB and start server
async function startServer() {
    try {
        await (0, db_js_1.connectDB)();
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already in use by another application!`);
                console.error(`👉 Either stop the process using port ${PORT}, or change PORT in backend/.env to another port (e.g. 5001).\n`);
            }
            else {
                console.error('Server error:', err);
            }
        });
        server.listen(PORT, () => {
            console.log(`🚀 WorkSphere MERN Backend running on http://localhost:${PORT}`);
            console.log(`⚡ Real-Time WebSocket Gateway ready on ws://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
// Only start standalone HTTP server when not in serverless environments (e.g. Vercel)
if (!process.env.VERCEL) {
    startServer();
}
// Assign to module.exports for CommonJS / Vercel serverless bridge compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
    module.exports.default = app;
}
exports.default = app;
