import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openApiSpec } from './server/src/config/swagger.ts';
import { errorHandler } from './server/src/middleware/error.middleware.ts';
import { requestLogger } from './server/src/middleware/logging.middleware.ts';
import { authRouter } from './server/src/modules/auth/auth.router.ts';
import { catalogRouter } from './server/src/modules/catalog/catalog.router.ts';
import { dispatchRouter } from './server/src/modules/dispatch/dispatch.router.ts';
import { financeRouter } from './server/src/modules/finance/finance.router.ts';
import { orderRouter } from './server/src/modules/orders/order.router.ts';
import { rbacRouter } from './server/src/modules/rbac/rbac.router.ts';
import { customerRouter } from './server/src/modules/customer/customer.router.ts';
import { claudeRouter } from './server/src/modules/claude/claude.router.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // AI Studio preview proxy strictly forwards to port 3000
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(
    cors({
      origin: (origin, callback) => {
        // Echo origin dynamically so credentials & authorization work in all environments
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'Accept', 'Origin'],
    })
  );
  app.use(express.json());
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'Raftaar Marketplace API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // OpenAPI Specification endpoint
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Mount API Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/catalog', catalogRouter);
  app.use('/api/v1/dispatch', dispatchRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/rbac', rbacRouter);
  app.use('/api/v1/customer', customerRouter);
  app.use('/api/v1/claude', claudeRouter);

  // Catch unhandled API routes so they return JSON 404 instead of falling through to Vite's HTML index
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `API endpoint ${req.method} ${req.originalUrl} not found`,
        statusCode: 404,
      },
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Frontend integration: Vite dev middlewares or static production serving
  if (!isProd) {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Raftaar (رفتار) Marketplace Platform Live!`);
    console.log(`📡 Server Address: http://localhost:${PORT}`);
    console.log(`📖 OpenAPI Spec:   http://localhost:${PORT}/api/docs/openapi.json`);
    console.log(`🔒 Environment:    ${process.env.NODE_ENV || 'development'}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Raftaar server:', err);
  process.exit(1);
});
