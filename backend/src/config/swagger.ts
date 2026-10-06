import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
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

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
