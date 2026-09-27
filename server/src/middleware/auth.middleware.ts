import { NextFunction, Request, Response } from 'express';
import { hasPermission } from '../config/rbac.ts';
import { authService, TokenPayload } from '../modules/auth/auth.service.ts';
import { RoleId } from '../types/index.ts';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      correlationId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required in Authorization header (Bearer <token>)',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid access token';
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message,
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required prior to permission evaluation',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const permitted = hasPermission(req.user.roles, resource, action);
    if (!permitted) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Missing permission '${resource}:${action}' for assigned roles: [${req.user.roles.join(', ')}]`,
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
}

export function requireRole(...allowedRoles: RoleId[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r) || r === 'super_admin');
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Required one of roles: [${allowedRoles.join(', ')}]. Current roles: [${req.user.roles.join(', ')}]`,
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
}
