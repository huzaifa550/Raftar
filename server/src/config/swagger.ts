export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Raftaar (رفتار) API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for Raftaar multi-vendor food, grocery and essentials delivery marketplace in Pakistan.',
    contact: {
      name: 'Raftaar Engineering Team',
      email: 'engineering@raftaar.pk',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide short-lived access JWT token obtained from OTP verification',
      },
    },
    schemas: {
      RequestOtpRequest: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: {
            type: 'string',
            example: '+923001234567',
            description: 'Pakistani mobile number (+923XXXXXXXXX or 03XXXXXXXXX)',
          },
        },
      },
      VerifyOtpRequest: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string', example: '+923001234567' },
          code: { type: 'string', example: '123456' },
          fullName: { type: 'string', example: 'Hamza Tariq' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed' },
          data: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/auth/otp/request': {
      post: {
        summary: 'Request 6-digit SMS OTP',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RequestOtpRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'OTP dispatched via configured SMS adapter' },
          '400': { description: 'Invalid phone format' },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        summary: 'Verify OTP and obtain JWT tokens',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyOtpRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated successfully with Access and Refresh tokens' },
          '400': { description: 'Invalid or expired OTP code' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate Refresh Token to get fresh Access Token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Tokens successfully rotated' },
          '401': { description: 'Revoked or expired token' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get active profile and granted permissions',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'User profile with calculated permission bundle' },
          '401': { description: 'Missing or expired token' },
        },
      },
    },
    '/rbac/roles': {
      get: {
        summary: 'List all system roles and bundled permissions',
        tags: ['Access Control (RBAC)'],
        responses: {
          '200': { description: 'List of roles' },
        },
      },
    },
    '/rbac/test-access': {
      post: {
        summary: 'Test granular resource:action permission and IDOR protection',
        tags: ['Access Control (RBAC)'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Access Granted' },
          '403': { description: 'Access Denied / IDOR Violation' },
        },
      },
    },
    '/rbac/audit-logs': {
      get: {
        summary: 'Query immutable system audit logs',
        tags: ['Audit Logs'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'List of audit logs' },
          '403': { description: 'Requires audit_logs:read permission' },
        },
      },
    },
  },
};
