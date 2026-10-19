import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { FolderModel } from '../models/Folder.js';
import { DocumentModel } from '../models/Document.js';
import { FileModel } from '../models/File.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100),
  projectId: z.string().min(1, 'Project ID is required'),
  parentFolderId: z.string().nullable().optional(),
});

// GET /api/v1/folders
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, parentFolderId } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId) query.projectId = projectId;
    if (parentFolderId !== undefined) {
      query.parentFolderId = parentFolderId === 'null' ? null : parentFolderId;
    }

    const folders = await FolderModel.find(query).sort({ name: 1 }).lean();
    return sendApiResponse(res, folders);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/folders
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'folder:create');

    const parseResult = CreateFolderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid folder data', parseResult.error.flatten().fieldErrors), 422);
    }

    const validated = parseResult.data;
    const folderId = generateId('folder');
    const folder = await FolderModel.create({
      folderId,
      tenantId: user.tenantId,
      projectId: validated.projectId,
      name: validated.name.trim(),
      parentFolderId: validated.parentFolderId || null,
    });

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId: validated.projectId,
      userId: user.userId,
      action: 'created_folder',
      entityType: 'folder',
      entityId: folder.folderId,
      metadata: { name: folder.name },
    });

    return sendApiResponse(res, folder, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PATCH /api/v1/folders/:folderId
router.patch('/:folderId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'folder:create');

    const folder = await FolderModel.findOneAndUpdate(
      { tenantId: user.tenantId, folderId: req.params.folderId },
      { $set: { name: req.body.name } },
      { new: true }
    ).lean();

    if (!folder) {
      return sendApiError(res, new NotFoundError('Folder not found'), 404);
    }

    return sendApiResponse(res, folder);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/folders/:folderId
router.delete('/:folderId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'folder:delete');

    const folder = await FolderModel.findOneAndDelete({
      tenantId: user.tenantId,
      folderId: req.params.folderId,
    }).lean();

    if (!folder) {
      return sendApiError(res, new NotFoundError('Folder not found'), 404);
    }

    // Move contained documents, files, and child folders to root/parent
    await Promise.all([
      DocumentModel.updateMany(
        { tenantId: user.tenantId, folderId: req.params.folderId },
        { $set: { folderId: null } }
      ),
      FileModel.updateMany(
        { tenantId: user.tenantId, folderId: req.params.folderId },
        { $set: { folderId: null } }
      ),
      FolderModel.updateMany(
        { tenantId: user.tenantId, parentFolderId: req.params.folderId },
        { $set: { parentFolderId: null } }
      ),
    ]);

    return sendApiResponse(res, { message: 'Folder deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
