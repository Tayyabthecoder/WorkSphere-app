import fs from 'fs';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { FileModel } from '../models/File.js';
import { ProjectModel } from '../models/Project.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { fileUploadMiddleware, deleteLocalFile } from '../services/storage.js';

const router = Router();
router.use(verifyAuth);

const CreateFileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  folderId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  mimeType: z.string().default('application/octet-stream'),
  size: z.number().min(1),
  storageUrl: z.string().optional(),
});

// GET /api/v1/files
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, folderId, taskId } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId) query.projectId = projectId;
    if (folderId !== null && folderId !== undefined) {
      query.folderId = folderId === 'null' ? null : folderId;
    }
    if (taskId) query.taskId = taskId;

    const files = await FileModel.find(query).sort({ createdAt: -1 }).lean();

    const projectIds = Array.from(new Set(files.map((f) => f.projectId)));
    const projects = await ProjectModel.find({
      tenantId: user.tenantId,
      projectId: { $in: projectIds },
    })
      .select('projectId name')
      .lean();

    const projectMap = new Map(projects.map((p) => [p.projectId, p.name]));
    const enriched = files.map((file) => ({
      ...file,
      projectName: projectMap.get(file.projectId) || 'Workspace Project',
    }));

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/files/upload (Multipart binary file upload)
router.post('/upload', fileUploadMiddleware.single('file') as any, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    if (!req.file) {
      return sendApiError(res, new ValidationError('No file was uploaded'), 400);
    }

    const projectId = req.body.projectId;
    if (!projectId) {
      deleteLocalFile(req.file.path);
      return sendApiError(res, new ValidationError('Project ID is required'), 422);
    }

    const fileId = generateId('file');
    const fileName = req.body.name?.trim() || req.file.originalname;
    const storageUrl = `/api/v1/files/${fileId}/download`;

    const file = await FileModel.create({
      fileId,
      tenantId: user.tenantId,
      projectId,
      folderId: req.body.folderId || null,
      taskId: req.body.taskId || null,
      name: fileName,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      filePath: req.file.path,
      storageUrl,
      version: 1,
      versionHistory: [
        {
          version: 1,
          storageUrl,
          size: req.file.size,
          uploadedBy: user.name || user.userId,
          createdAt: new Date(),
        },
      ],
      uploadedBy: user.name || user.userId,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId,
      userId: user.userId,
      action: 'uploaded_file',
      entityType: 'file',
      entityId: file.fileId,
      metadata: { name: file.name, size: file.size },
    });

    return sendApiResponse(res, file, 201);
  } catch (error: any) {
    if (req.file) {
      deleteLocalFile(req.file.path);
    }
    return sendApiError(res, error);
  }
});

// GET /api/v1/files/:fileId/download
router.get('/:fileId/download', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const file: any = await FileModel.findOne({
      tenantId: user.tenantId,
      fileId: req.params.fileId,
    }).lean();

    if (!file) {
      return sendApiError(res, new NotFoundError('File not found'), 404);
    }

    if (!file.filePath || !fs.existsSync(file.filePath)) {
      return sendApiError(res, new NotFoundError('Physical file asset not found on server'), 404);
    }

    return res.download(file.filePath, file.name);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/files (Metadata file record creation)
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const parseResult = CreateFileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid file data', parseResult.error.flatten().fieldErrors), 422);
    }

    const validated = parseResult.data;
    const fileId = generateId('file');
    const storageUrl =
      validated.storageUrl || `/uploads/${user.tenantId}/${validated.projectId}/${validated.name}`;

    const file = await FileModel.create({
      fileId,
      tenantId: user.tenantId,
      projectId: validated.projectId,
      folderId: validated.folderId || null,
      taskId: validated.taskId || null,
      name: validated.name.trim(),
      mimeType: validated.mimeType,
      size: validated.size,
      storageUrl,
      version: 1,
      versionHistory: [
        {
          version: 1,
          storageUrl,
          size: validated.size,
          uploadedBy: user.name || user.userId,
          createdAt: new Date(),
        },
      ],
      uploadedBy: user.name || user.userId,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId: validated.projectId,
      userId: user.userId,
      action: 'uploaded_file',
      entityType: 'file',
      entityId: file.fileId,
      metadata: { name: file.name, size: file.size },
    });

    return sendApiResponse(res, file, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/files/:fileId
router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'file:delete');

    const file: any = await FileModel.findOneAndDelete({
      tenantId: user.tenantId,
      fileId: req.params.fileId,
    }).lean();

    if (!file) {
      return sendApiError(res, new NotFoundError('File not found'), 404);
    }

    if (file.filePath) {
      deleteLocalFile(file.filePath);
    }

    return sendApiResponse(res, { message: 'File deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
