export type RoleId =
  | 'customer'
  | 'restaurant_partner'
  | 'shop_partner'
  | 'rider'
  | 'support_staff'
  | 'finance_staff'
  | 'manager'
  | 'admin'
  | 'super_admin';

export interface Permission {
  id: string; // e.g. "orders:create", "merchants:read", "audit_logs:read"
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  roles: RoleId[];
  isPhoneVerified: boolean;
  avatarUrl?: string;
  merchantId?: string; // If merchant partner/staff
  riderId?: string; // If rider
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorPhone?: string;
  actorRole?: string;
  action: string;
  resource: string;
  targetId?: string;
  diff?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
    correlationId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    statusCode: number;
    timestamp: string;
  };
}
