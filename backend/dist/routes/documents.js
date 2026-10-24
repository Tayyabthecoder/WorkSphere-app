"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Document_js_1 = require("../models/Document.js");
const Project_js_1 = require("../models/Project.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const User_js_1 = require("../models/User.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateDocSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    folderId: zod_1.z.string().nullable().optional(),
    content: zod_1.z.string().optional().default(''),
});
// GET /api/v1/documents
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId, folderId, search } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId)
            query.projectId = projectId;
        if (folderId !== undefined) {
            query.folderId = folderId === 'null' ? null : folderId;
        }
        if (search && typeof search === 'string' && search.trim().length > 0) {
            query.$text = { $search: search.trim() };
        }
        const docs = await Document_js_1.DocumentModel.find(query).sort({ updatedAt: -1 }).lean();
        const projectIds = [...new Set(docs.map((d) => d.projectId).filter(Boolean))];
        const projects = await Project_js_1.ProjectModel.find({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, enriched);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/documents
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'document:create');
        const parseResult = CreateDocSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid document data', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        const documentId = (0, id_js_1.generateId)('doc');
        const initialVersion = {
            version: 1,
            content: data.content,
            savedBy: user.userId,
            createdAt: new Date(),
        };
        const doc = await Document_js_1.DocumentModel.create({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, doc, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/documents/:documentId
router.get('/:documentId', async (req, res) => {
    try {
        const user = req.user;
        const doc = await Document_js_1.DocumentModel.findOne({
            tenantId: user.tenantId,
            documentId: req.params.documentId,
        }).lean();
        if (!doc) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Document not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, doc);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PUT /api/v1/documents/:documentId
router.put('/:documentId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'document:update');
        const doc = await Document_js_1.DocumentModel.findOne({
            tenantId: user.tenantId,
            documentId: req.params.documentId,
        });
        if (!doc) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Document not found'), 404);
        }
        if (req.body.title)
            doc.title = req.body.title;
        if (req.body.folderId !== undefined)
            doc.folderId = req.body.folderId;
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
        return (0, apiResponse_js_1.sendApiResponse)(res, doc);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/documents/:documentId/versions
router.get('/:documentId/versions', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'document:read');
        const doc = (await Document_js_1.DocumentModel.findOne({
            tenantId: user.tenantId,
            documentId: req.params.documentId,
        }).lean());
        if (!doc) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Document not found'), 404);
        }
        const versions = doc.versionHistory || [];
        const userIds = [...new Set(versions.map((v) => v.savedBy).filter(Boolean))];
        const users = (await User_js_1.UserModel.find({
            tenantId: user.tenantId,
            userId: { $in: userIds },
        })
            .select('userId name email avatarUrl')
            .lean());
        const userMap = new Map((users || []).map((u) => [u.userId, u]));
        const enriched = versions
            .map((v) => ({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, enriched);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/documents/:documentId/restore/:version
router.post('/:documentId/restore/:version', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'document:update');
        const targetVersionNum = parseInt(req.params.version, 10);
        if (isNaN(targetVersionNum)) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid version number'), 400);
        }
        const doc = await Document_js_1.DocumentModel.findOne({
            tenantId: user.tenantId,
            documentId: req.params.documentId,
        });
        if (!doc) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Document not found'), 404);
        }
        const targetVersion = (doc.versionHistory || []).find((v) => v.version === targetVersionNum);
        if (!targetVersion) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError(`Version ${targetVersionNum} not found`), 404);
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
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            message: `Document successfully restored to version ${targetVersionNum}`,
            document: doc,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/documents/:documentId
router.delete('/:documentId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'document:delete');
        const doc = await Document_js_1.DocumentModel.findOneAndDelete({
            tenantId: user.tenantId,
            documentId: req.params.documentId,
        }).lean();
        if (!doc) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Document not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Document deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
