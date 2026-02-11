import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Scribe API',
    version: '1.0.0',
    description: 'API for managing drafts in Scribe collaborative writing app',
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'scribe_...',
      },
    },
    schemas: {
      Draft: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          title: {
            type: 'string',
          },
          content: {
            type: 'object',
            description: 'TipTap JSON content',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
          },
        },
      },
    },
  },
  paths: {
    '/drafts': {
      get: {
        summary: 'List all drafts',
        description: 'Get all drafts for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of drafts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Draft',
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new draft',
        description: 'Create a new draft for the authenticated user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    default: 'Untitled',
                  },
                  content: {
                    type: 'object',
                    description: 'TipTap JSON content',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Draft created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Draft',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}': {
      get: {
        summary: 'Get a draft',
        description: 'Get a specific draft by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Draft details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Draft',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update a draft',
        description: 'Update a specific draft by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                  content: {
                    type: 'object',
                    description: 'TipTap JSON content',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Draft updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Draft',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a draft',
        description: 'Delete a specific draft by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '204': {
            description: 'Draft deleted',
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
