import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

// Base directory for local file storage
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure base uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Custom multer disk storage with tenant and project directory isolation
const diskStorage = multer.diskStorage({
  destination: (req: any, _file: any, cb: any) => {
    const tenantId = req.user?.tenantId || 'global';
    const projectId = (req.body?.projectId || req.query?.projectId || 'general') as string;

    // Sanitize path components to prevent directory traversal
    const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeProject = String(projectId).replace(/[^a-zA-Z0-9_-]/g, '');

    const targetDir = path.join(UPLOADS_DIR, safeTenant, safeProject);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${randomHex}-${safeOriginal}`);
  },
});

export const fileUploadMiddleware = multer({
  storage: diskStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
});

export function getUploadFilePath(tenantId: string, projectId: string, filename: string): string {
  const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeProject = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, safeTenant, safeProject, safeFilename);
}

export function deleteLocalFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`Failed to delete local file at ${filePath}:`, err);
    return false;
  }
}
