import { Role, RoleId } from '../types/index.ts';

export const ALL_PERMISSIONS = [
  // Catalog
  { id: 'catalog:read', resource: 'catalog', action: 'read', description: 'View categories, menus, and items' },
  { id: 'catalog:write', resource: 'catalog', action: 'write', description: 'Create and update menus and items' },
  { id: 'catalog:delete', resource: 'catalog', action: 'delete', description: 'Delete catalog items' },

  // Orders
  { id: 'orders:create', resource: 'orders', action: 'create', description: 'Place and checkout orders' },
  { id: 'orders:read_own', resource: 'orders', action: 'read_own', description: 'Read own placed/handled orders' },
  { id: 'orders:read_all', resource: 'orders', action: 'read_all', description: 'Read all orders in platform' },
  { id: 'orders:accept', resource: 'orders', action: 'accept', description: 'Merchant accept or reject orders' },
  { id: 'orders:update_prep', resource: 'orders', action: 'update_prep', description: 'Update preparation status' },
  { id: 'orders:override_status', resource: 'orders', action: 'override_status', description: 'Admin override order state' },
  { id: 'orders:cancel', resource: 'orders', action: 'cancel', description: 'Cancel order' },

  // Dispatch & Rider
  { id: 'dispatch:view', resource: 'dispatch', action: 'view', description: 'View dispatch queues' },
  { id: 'dispatch:assign', resource: 'dispatch', action: 'assign', description: 'Assign or reassign rider' },
  { id: 'dispatch:accept_offer', resource: 'dispatch', action: 'accept_offer', description: 'Rider accept offer' },
  { id: 'rider:stream_location', resource: 'rider', action: 'stream_location', description: 'Send real-time GPS coordinates' },

  // Payments & Finance
  { id: 'payments:read', resource: 'payments', action: 'read', description: 'View transaction logs' },
  { id: 'payments:reconcile_cod', resource: 'payments', action: 'reconcile_cod', description: 'Reconcile rider cash in hand' },
  { id: 'refunds:create', resource: 'refunds', action: 'create', description: 'Request customer refund' },
  { id: 'refunds:approve', resource: 'refunds', action: 'approve', description: 'Approve refund transaction' },
  { id: 'settlements:manage', resource: 'settlements', action: 'manage', description: 'Manage merchant payouts' },

  // Coupons & Promotions
  { id: 'coupons:redeem', resource: 'coupons', action: 'redeem', description: 'Apply coupon code at checkout' },
  { id: 'coupons:manage', resource: 'coupons', action: 'manage', description: 'Create and edit promotional coupons' },

  // Partner Approvals & Governance
  { id: 'merchants:approve', resource: 'merchants', action: 'approve', description: 'Review and approve restaurant/shop partners' },
  { id: 'riders:approve', resource: 'riders', action: 'approve', description: 'Review and approve rider documents' },

  // Support & Tickets
  { id: 'support:chat', resource: 'support', action: 'chat', description: 'Participate in support conversations' },
  { id: 'support:manage_tickets', resource: 'support', action: 'manage_tickets', description: 'Triage and close tickets' },

  // System & Audits
  { id: 'audit_logs:read', resource: 'audit_logs', action: 'read', description: 'View immutable system audit logs' },
  { id: 'settings:edit', resource: 'settings', action: 'edit', description: 'Modify global platform configuration' },
];

export const ROLE_DEFINITIONS: Record<RoleId, Role> = {
  customer: {
    id: 'customer',
    name: 'Customer',
    description: 'Orders food, groceries, tracks deliveries, manages saved addresses',
    permissions: [
      'catalog:read',
      'orders:create',
      'orders:read_own',
      'orders:cancel',
      'coupons:redeem',
      'support:chat',
    ],
  },
  restaurant_partner: {
    id: 'restaurant_partner',
    name: 'Restaurant Partner',
    description: 'Manages menus, receives live kitchen orders, sets preparation times and operating hours',
    permissions: [
      'catalog:read',
      'catalog:write',
      'orders:read_own',
      'orders:accept',
      'orders:update_prep',
      'support:chat',
    ],
  },
  shop_partner: {
    id: 'shop_partner',
    name: 'Shop & Grocery Partner',
    description: 'Manages inventory, accepts grocery orders, tracks stock levels and store hours',
    permissions: [
      'catalog:read',
      'catalog:write',
      'orders:read_own',
      'orders:accept',
      'orders:update_prep',
      'support:chat',
    ],
  },
  rider: {
    id: 'rider',
    name: 'Delivery Rider',
    description: 'Receives delivery offers, navigates to merchant/customer, confirms OTP and collects COD cash',
    permissions: [
      'orders:read_own',
      'dispatch:accept_offer',
      'rider:stream_location',
      'support:chat',
    ],
  },
  support_staff: {
    id: 'support_staff',
    name: 'Customer Support Agent',
    description: 'Resolves customer & rider tickets, views order statuses, initiates low-tier refunds',
    permissions: [
      'catalog:read',
      'orders:read_all',
      'support:chat',
      'support:manage_tickets',
      'refunds:create',
    ],
  },
  finance_staff: {
    id: 'finance_staff',
    name: 'Finance & Accounts',
    description: 'Reconciles COD cash, processes merchant payout settlements, and approves refunds',
    permissions: [
      'payments:read',
      'payments:reconcile_cod',
      'refunds:approve',
      'settlements:manage',
      'audit_logs:read',
    ],
  },
  manager: {
    id: 'manager',
    name: 'Operations Manager',
    description: 'Supervises active city dispatch, oversees partner onboarding and live operations',
    permissions: [
      'catalog:read',
      'catalog:write',
      'orders:read_all',
      'orders:override_status',
      'dispatch:view',
      'dispatch:assign',
      'merchants:approve',
      'riders:approve',
      'coupons:manage',
      'support:manage_tickets',
      'audit_logs:read',
    ],
  },
  admin: {
    id: 'admin',
    name: 'Platform Administrator',
    description: 'Manages all marketplace modules, commissions, fee tiers, and dispute resolutions',
    permissions: [
      'catalog:read',
      'catalog:write',
      'catalog:delete',
      'orders:read_all',
      'orders:override_status',
      'dispatch:view',
      'dispatch:assign',
      'payments:read',
      'payments:reconcile_cod',
      'refunds:create',
      'refunds:approve',
      'settlements:manage',
      'coupons:manage',
      'merchants:approve',
      'riders:approve',
      'support:chat',
      'support:manage_tickets',
      'audit_logs:read',
      'settings:edit',
    ],
  },
  super_admin: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Root access to the entire platform, roles, security settings, and database configurations',
    permissions: ALL_PERMISSIONS.map((p) => p.id),
  },
};

export function hasPermission(userRoles: RoleId[], resource: string, action: string): boolean {
  if (userRoles.includes('super_admin')) return true;
  for (const roleId of userRoles) {
    const role = ROLE_DEFINITIONS[roleId];
    if (!role) continue;
    const targetPermId = `${resource}:${action}`;
    if (role.permissions.includes(targetPermId)) {
      return true;
    }
  }
  return false;
}
