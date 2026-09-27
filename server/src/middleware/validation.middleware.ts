import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed on request body',
            details: err.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
            statusCode: 400,
            timestamp: new Date().toISOString(),
          },
        });
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as Record<string, any>;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: err.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
            statusCode: 400,
            timestamp: new Date().toISOString(),
          },
        });
      }
      next(err);
    }
  };
}
