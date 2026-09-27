import { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const correlationId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  req.correlationId = correlationId;

  res.setHeader('X-Correlation-ID', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `[${new Date().toISOString()}] ${logColor}${req.method} ${req.originalUrl} ${statusCode}${resetColor} - ${duration}ms [${correlationId}]`
    );
  });

  next();
}
