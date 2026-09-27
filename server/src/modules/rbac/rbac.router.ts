import { Request, Response, Router } from 'express';
import { ALL_PERMISSIONS, hasPermission, ROLE_DEFINITIONS } from '../../config/rbac.ts';
import { dataStore } from '../../db/datastore.ts';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.ts';

const router = Router();

// 1. Get all roles definition
router.get('/roles', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: Object.values(ROLE_DEFINITIONS),
  });
});

// 2. Get all system permissions
router.get('/permissions', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: ALL_PERMISSIONS,
  });
});

// 3. Test RBAC permissions & IDOR protection for authenticated user
router.post('/test-access', requireAuth, (req: Request, res: Response) => {
  const { resource, action, targetOwnerId } = req.body as {
    resource: string;
    action: string;
    targetOwnerId?: string;
  };

  if (!resource || !action) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'Both resource and action are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const userRoles = req.user!.roles;
  const isPermitted = hasPermission(userRoles, resource, action);

  // Object-level tenant check test (IDOR simulation)
  let idorViolation = false;
  if (targetOwnerId && targetOwnerId !== req.user!.sub && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
    idorViolation = true;
  }

  const allowed = isPermitted && !idorViolation;

  // Log this test to audit logs for verification
  dataStore.addAuditLog({
    actorId: req.user!.sub,
    actorPhone: req.user!.phone,
    actorRole: userRoles[0],
    action: `rbac:test:${resource}:${action}`,
    resource,
    targetId: targetOwnerId || 'system',
    diff: {
      userRoles,
      isPermitted,
      targetOwnerId,
      idorViolation,
      allowed,
    },
  });

  return res.status(allowed ? 200 : 403).json({
    success: allowed,
    data: {
      resource,
      action,
      userRoles,
      isPermitted,
      idorProtectionChecked: Boolean(targetOwnerId),
      targetOwnerId,
      currentUserId: req.user!.sub,
      idorViolation,
      allowed,
      verdict: allowed
        ? `ALLOWED: User roles [${userRoles.join(', ')}] have '${resource}:${action}' and pass object ownership.`
        : idorViolation
        ? `DENIED (IDOR): User cannot access resource belonging to another owner (${targetOwnerId}) without elevated permissions.`
        : `DENIED: Roles [${userRoles.join(', ')}] lack '${resource}:${action}' permission.`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    },
  });
});

// 4. View Audit Logs (Protected by 'audit_logs:read')
router.get('/audit-logs', requireAuth, requirePermission('audit_logs', 'read'), (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const logs = dataStore.listAuditLogs(limit);

  return res.status(200).json({
    success: true,
    data: logs,
    meta: {
      total: logs.length,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    },
  });
});

// 5. Seed Reset Endpoint (for test teardown and demonstration)
router.post('/seed/reset', requireAuth, requirePermission('settings', 'edit'), (req: Request, res: Response) => {
  dataStore.seedPhase1Data();

  dataStore.addAuditLog({
    actorId: req.user!.sub,
    actorPhone: req.user!.phone,
    actorRole: req.user!.roles[0],
    action: 'database:seed:reset',
    resource: 'system',
    targetId: 'dataStore',
  });

  return res.status(200).json({
    success: true,
    message: 'Phase 1 demo data successfully reset to clean baseline',
    data: {
      usersCount: dataStore.listUsers().length,
      auditLogsCount: dataStore.listAuditLogs().length,
    },
  });
});

// 6. List Users for Admin User Management
router.get('/users', requireAuth, requirePermission('audit_logs', 'read'), (_req: Request, res: Response) => {
  const users = dataStore.listUsers();
  return res.status(200).json({
    success: true,
    data: users.map((u) => ({
      id: u.id,
      phone: u.phone,
      fullName: u.fullName,
      email: u.email,
      roles: u.roles,
      status: u.status,
      merchantId: u.merchantId,
      riderId: u.riderId,
      createdAt: u.createdAt,
    })),
  });
});

// 7. Admin Update User Roles
router.patch('/users/:id/roles', requireAuth, requirePermission('settings', 'edit'), (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = dataStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `User '${userId}' not found.` },
    });
  }

  const { roles } = req.body;
  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROLES', message: 'roles must be a non-empty array of valid roles' },
    });
  }

  const previousRoles = [...user.roles];
  user.roles = roles;
  const updated = dataStore.updateUser(user.id, { roles });

  dataStore.addAuditLog({
    actorId: req.user!.sub,
    actorPhone: req.user!.phone,
    actorRole: req.user!.roles[0],
    action: 'user:roles:updated',
    resource: 'users',
    targetId: user.id,
    diff: { previousRoles, newRoles: roles },
  });

  return res.status(200).json({
    success: true,
    message: `Roles updated for ${user.fullName}`,
    data: updated,
  });
});

export const rbacRouter = router;
