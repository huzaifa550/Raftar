import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  const statusCode = (err as { status?: number; statusCode?: number })?.statusCode || 500;

  console.error(`[Unhandled Error] [${req.correlationId || 'no-id'}]`, errorObj.stack || errorObj.message);

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR',
      message: errorObj.message || 'An unexpected error occurred',
      statusCode,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    },
  });
}
