"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const express_1 = require("express");
const zod_1 = require("zod");
const File_js_1 = require("../models/File.js");
const Project_js_1 = require("../models/Project.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const storage_js_1 = require("../services/storage.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateFileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'File name is required'),
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    folderId: zod_1.z.string().nullable().optional(),
    taskId: zod_1.z.string().nullable().optional(),
    mimeType: zod_1.z.string().default('application/octet-stream'),
    size: zod_1.z.number().min(1),
    storageUrl: zod_1.z.string().optional(),
});
// GET /api/v1/files
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { projectId, folderId, taskId } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId)
            query.projectId = projectId;
        if (folderId !== null && folderId !== undefined) {
            query.folderId = folderId === 'null' ? null : folderId;
        }
        if (taskId)
            query.taskId = taskId;
        const files = await File_js_1.FileModel.find(query).sort({ createdAt: -1 }).lean();
        const projectIds = Array.from(new Set(files.map((f) => f.projectId)));
        const projects = await Project_js_1.ProjectModel.find({
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
        return (0, apiResponse_js_1.sendApiResponse)(res, enriched);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/files/upload (Multipart binary file upload)
router.post('/upload', storage_js_1.fileUploadMiddleware.single('file'), async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'file:upload');
        if (!req.file) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('No file was uploaded'), 400);
        }
        const projectId = req.body.projectId;
        if (!projectId) {
            (0, storage_js_1.deleteLocalFile)(req.file.path);
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Project ID is required'), 422);
        }
        const fileId = (0, id_js_1.generateId)('file');
        const fileName = req.body.name?.trim() || req.file.originalname;
        const storageUrl = `/api/v1/files/${fileId}/download`;
        const file = await File_js_1.FileModel.create({
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
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId,
            userId: user.userId,
            action: 'uploaded_file',
            entityType: 'file',
            entityId: file.fileId,
            metadata: { name: file.name, size: file.size },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, file, 201);
    }
    catch (error) {
        if (req.file) {
            (0, storage_js_1.deleteLocalFile)(req.file.path);
        }
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/files/:fileId/download
router.get('/:fileId/download', async (req, res) => {
    try {
        const user = req.user;
        const file = await File_js_1.FileModel.findOne({
            tenantId: user.tenantId,
            fileId: req.params.fileId,
        }).lean();
        if (!file) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('File not found'), 404);
        }
        if (!file.filePath || !fs_1.default.existsSync(file.filePath)) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Physical file asset not found on server'), 404);
        }
        return res.download(file.filePath, file.name);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/files (Metadata file record creation)
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'project:update');
        const parseResult = CreateFileSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid file data', parseResult.error.flatten().fieldErrors), 422);
        }
        const validated = parseResult.data;
        const fileId = (0, id_js_1.generateId)('file');
        const storageUrl = validated.storageUrl || `/uploads/${user.tenantId}/${validated.projectId}/${validated.name}`;
        const file = await File_js_1.FileModel.create({
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
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId: validated.projectId,
            userId: user.userId,
            action: 'uploaded_file',
            entityType: 'file',
            entityId: file.fileId,
            metadata: { name: file.name, size: file.size },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, file, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/files/:fileId
router.delete('/:fileId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'file:delete');
        const file = await File_js_1.FileModel.findOneAndDelete({
            tenantId: user.tenantId,
            fileId: req.params.fileId,
        }).lean();
        if (!file) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('File not found'), 404);
        }
        if (file.filePath) {
            (0, storage_js_1.deleteLocalFile)(file.filePath);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'File deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
