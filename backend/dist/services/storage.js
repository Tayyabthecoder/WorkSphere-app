"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadMiddleware = void 0;
exports.getUploadFilePath = getUploadFilePath;
exports.deleteLocalFile = deleteLocalFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
// Base directory for local file storage
const UPLOADS_DIR = path_1.default.resolve(process.cwd(), 'uploads');
// Ensure base uploads directory exists
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Custom multer disk storage with tenant and project directory isolation
const diskStorage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        const tenantId = req.user?.tenantId || 'global';
        const projectId = (req.body?.projectId || req.query?.projectId || 'general');
        // Sanitize path components to prevent directory traversal
        const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
        const safeProject = String(projectId).replace(/[^a-zA-Z0-9_-]/g, '');
        const targetDir = path_1.default.join(UPLOADS_DIR, safeTenant, safeProject);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
        const randomHex = crypto_1.default.randomBytes(8).toString('hex');
        const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${randomHex}-${safeOriginal}`);
    },
});
const DANGEROUS_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin', '.js', '.mjs', '.vbs', '.msi',
    '.com', '.scr', '.pif', '.application', '.gadget', '.hta', '.cpl', '.msc', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.cgi', '.py', '.pl'
]);
exports.fileUploadMiddleware = (0, multer_1.default)({
    storage: diskStorage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max file size
    },
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (DANGEROUS_EXTENSIONS.has(ext)) {
            const err = new Error(`File type ${ext} is not allowed for security reasons.`);
            err.statusCode = 400;
            return cb(err);
        }
        cb(null, true);
    },
});
function getUploadFilePath(tenantId, projectId, filename) {
    const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeProject = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = path_1.default.basename(filename);
    return path_1.default.join(UPLOADS_DIR, safeTenant, safeProject, safeFilename);
}
function deleteLocalFile(filePath) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (err) {
        console.warn(`Failed to delete local file at ${filePath}:`, err);
        return false;
    }
}
