import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DocumentModel } from '../models/Document.js';
import { ProjectModel } from '../models/Project.js';
import { generateId } from '../utils/id.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth, verifyTenantActive } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { UserModel } from '../models/User.js';

const router = Router();
router.use(verifyAuth);
router.use(verifyTenantActive);

const CreateDocSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  projectId: z.string().min(1, 'Project ID is required'),
  folderId: z.string().nullable().optional(),
  content: z.string().optional().default(''),
});

// GET /api/v1/documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, folderId, search } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId) query.projectId = projectId;
    if (folderId !== undefined) {
      query.folderId = folderId === 'null' ? null : folderId;
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      query.$text = { $search: search.trim() };
    }

    const docs = await DocumentModel.find(query).sort({ updatedAt: -1 }).lean();

    const projectIds = [...new Set(docs.map((d) => d.projectId).filter(Boolean))];
    const projects = await ProjectModel.find({
      tenantId: user.tenantId,
      projectId: { $in: projectIds },
    })
      .select('projectId name')
      .lean();

    const projectMap = new Map(projects.map((p) => [p.projectId, p.name]));

    const enriched = docs.map((doc) => ({
      ...doc,
      projectName: projectMap.get(doc.projectId) || 'Unknown Project',
      versionCount: doc.versionHistory?.length || 1,
    }));

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/documents
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'document:create');

    const parseResult = CreateDocSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid document data', parseResult.error.flatten().fieldErrors), 422);
    }

    const data = parseResult.data;
    const documentId = generateId('doc');

    const initialVersion = {
      version: 1,
      content: data.content,
      savedBy: user.userId,
      createdAt: new Date(),
    };

    const doc = await DocumentModel.create({
      documentId,
      tenantId: user.tenantId,
      projectId: data.projectId,
      folderId: data.folderId || null,
      title: data.title,
      content: data.content,
      versionHistory: [initialVersion],
      createdBy: user.userId,
      updatedBy: user.userId,
    });

    return sendApiResponse(res, doc, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/documents/:documentId
router.get('/:documentId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const doc = await DocumentModel.findOne({
      tenantId: user.tenantId,
      documentId: req.params.documentId,
    }).lean();

    if (!doc) {
      return sendApiError(res, new NotFoundError('Document not found'), 404);
    }

    return sendApiResponse(res, doc);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// PUT /api/v1/documents/:documentId
router.put('/:documentId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'document:update');

    const doc = await DocumentModel.findOne({
      tenantId: user.tenantId,
      documentId: req.params.documentId,
    });

    if (!doc) {
      return sendApiError(res, new NotFoundError('Document not found'), 404);
    }

    if (req.body.title) doc.title = req.body.title;
    if (req.body.folderId !== undefined) doc.folderId = req.body.folderId;
    if (req.body.content !== undefined && req.body.content !== doc.content) {
      doc.content = req.body.content;
      const nextVersion = (doc.versionHistory?.length || 0) + 1;
      doc.versionHistory.push({
        version: nextVersion,
        content: req.body.content,
        savedBy: user.userId,
        createdAt: new Date(),
      });
      // Cap versionHistory at 50 to prevent unbounded document bloat
      if (doc.versionHistory.length > 50) {
        doc.versionHistory = doc.versionHistory.slice(-50);
      }
    }
    doc.updatedBy = user.userId;
    await doc.save();

    return sendApiResponse(res, doc);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// GET /api/v1/documents/:documentId/versions
router.get('/:documentId/versions', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'document:read');

    const doc = (await DocumentModel.findOne({
      tenantId: user.tenantId,
      documentId: req.params.documentId,
    }).lean()) as any;

    if (!doc) {
      return sendApiError(res, new NotFoundError('Document not found'), 404);
    }

    const versions = doc.versionHistory || [];
    const userIds = [...new Set(versions.map((v: any) => v.savedBy).filter(Boolean))];
    const users = (await UserModel.find({
      tenantId: user.tenantId,
      userId: { $in: userIds },
    })
      .select('userId name email avatarUrl')
      .lean()) as any[];
    const userMap = new Map((users || []).map((u: any) => [u.userId, u]));

    const enriched = versions
      .map((v: any) => ({
        version: v.version,
        content: v.content,
        createdAt: v.createdAt,
        savedBy: v.savedBy,
        user: userMap.get(v.savedBy) || {
          name: 'Workspace Member',
          email: '',
          avatarUrl: '',
        },
      }))
      .reverse(); // Latest version first

    return sendApiResponse(res, enriched);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/documents/:documentId/restore/:version
router.post('/:documentId/restore/:version', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'document:update');

    const targetVersionNum = parseInt(req.params.version, 10);
    if (isNaN(targetVersionNum)) {
      return sendApiError(res, new ValidationError('Invalid version number'), 400);
    }

    const doc = await DocumentModel.findOne({
      tenantId: user.tenantId,
      documentId: req.params.documentId,
    });

    if (!doc) {
      return sendApiError(res, new NotFoundError('Document not found'), 404);
    }

    const targetVersion = (doc.versionHistory || []).find(
      (v: any) => v.version === targetVersionNum
    );
    if (!targetVersion) {
      return sendApiError(res, new NotFoundError(`Version ${targetVersionNum} not found`), 404);
    }

    doc.content = targetVersion.content;
    doc.updatedBy = user.userId;

    const nextVersion = (doc.versionHistory?.length || 0) + 1;
    doc.versionHistory.push({
      version: nextVersion,
      content: targetVersion.content,
      savedBy: user.userId,
      createdAt: new Date(),
    });

    if (doc.versionHistory.length > 50) {
      doc.versionHistory = doc.versionHistory.slice(-50);
    }

    await doc.save();

    return sendApiResponse(res, {
      message: `Document successfully restored to version ${targetVersionNum}`,
      document: doc,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/documents/:documentId
router.delete('/:documentId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'document:delete');

    const doc = await DocumentModel.findOneAndDelete({
      tenantId: user.tenantId,
      documentId: req.params.documentId,
    }).lean();

    if (!doc) {
      return sendApiError(res, new NotFoundError('Document not found'), 404);
    }

    return sendApiResponse(res, { message: 'Document deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
