"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WorkSphere REST API',
            version: '1.0.0',
            description: 'Enterprise multi-tenant project management, task collaboration, time tracking, and analytics platform.',
            contact: {
                name: 'WorkSphere Platform Team',
            },
        },
        servers: [
            {
                url: '/api/v1',
                description: 'Production / Development v1 API endpoint',
            },
            {
                url: '/api',
                description: 'Legacy alias endpoint',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Provide JWT authorization token: Bearer <token>',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};
let spec = {
    openapi: '3.0.0',
    info: {
        title: 'WorkSphere REST API',
        version: '1.0.0',
        description: 'Enterprise multi-tenant project management REST API.',
    },
    paths: {},
};
try {
    spec = (0, swagger_jsdoc_1.default)(options);
}
catch (err) {
    console.warn('[Swagger] JSDoc parsing deferred or unavailable in this environment:', err);
}
exports.swaggerSpec = spec;
exports.default = exports.swaggerSpec;
