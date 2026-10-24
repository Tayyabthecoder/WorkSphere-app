"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Folder_js_1 = require("../models/Folder.js");
const Document_js_1 = require("../models/Document.js");
const File_js_1 = require("../models/File.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Folder name is required').max(100),
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    parentFolderId: zod_1.z.string().nullable().optional(),
});
// GET /api/v1/folders
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId, parentFolderId } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId)
            query.projectId = projectId;
        if (parentFolderId !== undefined) {
            query.parentFolderId = parentFolderId === 'null' ? null : parentFolderId;
        }
        const folders = await Folder_js_1.FolderModel.find(query).sort({ name: 1 }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, folders);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/folders
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'folder:create');
        const parseResult = CreateFolderSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid folder data', parseResult.error.flatten().fieldErrors), 422);
        }
        const validated = parseResult.data;
        const folderId = (0, id_js_1.generateId)('folder');
        const folder = await Folder_js_1.FolderModel.create({
            folderId,
            tenantId: user.tenantId,
            projectId: validated.projectId,
            name: validated.name.trim(),
            parentFolderId: validated.parentFolderId || null,
        });
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId: validated.projectId,
            userId: user.userId,
            action: 'created_folder',
            entityType: 'folder',
            entityId: folder.folderId,
            metadata: { name: folder.name },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, folder, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/folders/:folderId
router.patch('/:folderId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'folder:create');
        const folder = await Folder_js_1.FolderModel.findOneAndUpdate({ tenantId: user.tenantId, folderId: req.params.folderId }, { $set: { name: req.body.name } }, { new: true }).lean();
        if (!folder) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Folder not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, folder);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/folders/:folderId
router.delete('/:folderId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'folder:delete');
        const folder = await Folder_js_1.FolderModel.findOneAndDelete({
            tenantId: user.tenantId,
            folderId: req.params.folderId,
        }).lean();
        if (!folder) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Folder not found'), 404);
        }
        // Move contained documents, files, and child folders to root/parent
        await Promise.all([
            Document_js_1.DocumentModel.updateMany({ tenantId: user.tenantId, folderId: req.params.folderId }, { $set: { folderId: null } }),
            File_js_1.FileModel.updateMany({ tenantId: user.tenantId, folderId: req.params.folderId }, { $set: { folderId: null } }),
            Folder_js_1.FolderModel.updateMany({ tenantId: user.tenantId, parentFolderId: req.params.folderId }, { $set: { parentFolderId: null } }),
        ]);
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Folder deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
