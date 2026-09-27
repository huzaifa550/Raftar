import { ALL_PERMISSIONS, ROLE_DEFINITIONS } from '../config/rbac.ts';
import {
  SEED_CATEGORIES,
  SEED_CUSTOMER_ADDRESSES,
  SEED_MENU_ITEMS,
  SEED_MERCHANTS,
  SEED_PRODUCTS,
} from './catalog.data.ts';
import { SEED_COUPONS } from './coupon.data.ts';
import {
  SEED_MERCHANT_SETTLEMENTS,
  SEED_REFUND_REQUESTS,
  SEED_RIDER_REMITTANCES,
} from './finance.data.ts';
import { SEED_RIDERS } from './rider.data.ts';
import { Category, CustomerAddress, MenuItem, Merchant, Product } from '../types/catalog.types.ts';
import { DispatchOffer, Rider } from '../types/dispatch.types.ts';
import {
  MerchantSettlement,
  RefundRequest,
  RiderRemittance,
} from '../types/finance.types.ts';
import { Coupon, Order, OrderStatus, OrderStatusHistoryItem } from '../types/order.types.ts';
import { AuditLogEntry, RefreshTokenRecord, RoleId, User } from '../types/index.ts';

export interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number; // timestamp ms
  attempts: number;
  verified: boolean;
}

export class MemoryDataStore {
  public users: Map<string, User> = new Map();
  public refreshTokens: Map<string, RefreshTokenRecord> = new Map();
  public auditLogs: AuditLogEntry[] = [];
  public otps: Map<string, OtpRecord> = new Map();

  // Phase 2: Catalog & Discovery
  public categories: Map<string, Category> = new Map();
  public merchants: Map<string, Merchant> = new Map();
  public menuItems: Map<string, MenuItem> = new Map();
  public products: Map<string, Product> = new Map();
  public addresses: Map<string, CustomerAddress> = new Map();

  // Phase 3: Orders & Coupons
  public orders: Map<string, Order> = new Map();
  public coupons: Map<string, Coupon> = new Map();

  // Phase 4: Dispatch, Riders & Operations
  public riders: Map<string, Rider> = new Map();
  public dispatchOffers: Map<string, DispatchOffer> = new Map();

  // Phase 5: Financial Operations, Multi-Channel Payments, Settlements & Refunds
  public riderRemittances: Map<string, RiderRemittance> = new Map();
  public merchantSettlements: Map<string, MerchantSettlement> = new Map();
  public refundRequests: Map<string, RefundRequest> = new Map();

  // Phase 6: Client Dashboard & Customer Experience Stores
  public userFavorites: Map<string, { merchantIds: string[]; itemIds: string[] }> = new Map();
  public userNotifications: Map<string, Array<{
    id: string;
    title: string;
    titleUr?: string;
    body: string;
    bodyUr?: string;
    type: 'order' | 'promo' | 'system';
    read: boolean;
    timestamp: string;
    orderId?: string;
  }>> = new Map();
  public supportTickets: Map<string, Array<{
    id: string;
    userId: string;
    orderId?: string;
    subject: string;
    category: string;
    status: 'open' | 'in_progress' | 'resolved';
    messages: Array<{
      id: string;
      sender: 'customer' | 'support';
      senderName: string;
      message: string;
      timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> = new Map();
  public orderReviews: Map<string, {
    id: string;
    orderId: string;
    orderNumber: string;
    userId: string;
    userName: string;
    merchantId: string;
    merchantName: string;
    rating: number;
    comment: string;
    deliveryRating?: number;
    foodRating?: number;
    createdAt: string;
  }> = new Map();
  public userPaymentMethods: Map<string, Array<{
    id: string;
    type: 'cod' | 'jazzcash' | 'easypaisa' | 'raast' | 'card';
    title: string;
    subtitle: string;
    isDefault: boolean;
    details?: Record<string, any>;
  }>> = new Map();

  constructor() {
    this.seedPhase1Data();
    this.seedCatalogData();
    this.seedCoupons();
    this.seedRiders();
    this.seedFinanceData();
    this.seedCustomerData();
  }

  // --- OTP Operations ---
  setOtp(phone: string, code: string, ttlSeconds = 180): OtpRecord {
    const record: OtpRecord = {
      phone,
      code,
      expiresAt: Date.now() + ttlSeconds * 1000,
      attempts: 0,
      verified: false,
    };
    this.otps.set(phone, record);
    return record;
  }

  getOtp(phone: string): OtpRecord | undefined {
    return this.otps.get(phone);
  }

  verifyOtp(phone: string, code: string): { success: boolean; error?: string } {
    const record = this.otps.get(phone);
    if (!record) {
      return { success: false, error: 'No OTP requested for this phone number' };
    }
    if (Date.now() > record.expiresAt) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }
    if (record.attempts >= 5) {
      return { success: false, error: 'Too many invalid attempts. Please request a new OTP.' };
    }
    if (record.code !== code && code !== '123456') { // Allow 123456 as deterministic dev bypass
      record.attempts += 1;
      return { success: false, error: 'Invalid verification code' };
    }
    record.verified = true;
    return { success: true };
  }

  // --- User Operations ---
  findUserByPhone(phone: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.phone === phone) return user;
    }
    return undefined;
  }

  findUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email && user.email.trim().toLowerCase() === clean) return user;
    }
    return undefined;
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = `usr_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  listUsers(): User[] {
    return Array.from(this.users.values());
  }

  // --- Refresh Tokens ---
  saveRefreshToken(token: Omit<RefreshTokenRecord, 'id' | 'createdAt'>): RefreshTokenRecord {
    const id = `rf_${Math.random().toString(36).substring(2, 11)}`;
    const record: RefreshTokenRecord = {
      id,
      ...token,
      createdAt: new Date().toISOString(),
    };
    this.refreshTokens.set(token.tokenHash, record);
    return record;
  }

  findRefreshToken(tokenHash: string): RefreshTokenRecord | undefined {
    return this.refreshTokens.get(tokenHash);
  }

  revokeRefreshToken(tokenHash: string): boolean {
    const record = this.refreshTokens.get(tokenHash);
    if (record) {
      record.revokedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): AuditLogEntry {
    const log: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log); // Most recent first
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop(); // Keep manageable memory bounds
    }
    return log;
  }

  listAuditLogs(limit = 50): AuditLogEntry[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- Seed Demo Users for Phase 1 ---
  seedPhase1Data() {
    this.users.clear();
    this.auditLogs = [];

    const demoUsers: Array<{
      phone: string;
      fullName: string;
      email: string;
      roles: RoleId[];
      merchantId?: string;
      riderId?: string;
    }> = [
      {
        phone: '+923001111111',
        fullName: 'Hamza Tariq (Customer)',
        email: 'customer@raftaar.pk',
        roles: ['customer'],
      },
      {
        phone: '+923002222222',
        fullName: 'Chef Aslam (Kolachi Restaurant)',
        email: 'kolachi@raftaar.pk',
        roles: ['restaurant_partner'],
        merchantId: 'merch_kolachi_001',
      },
      {
        phone: '+923003333333',
        fullName: 'Nasir Iqbal (Al-Madina Mart)',
        email: 'almadina@raftaar.pk',
        roles: ['shop_partner'],
        merchantId: 'merch_almadina_002',
      },
      {
        phone: '+923004444444',
        fullName: 'Bilal Khan (Express Rider)',
        email: 'rider.bilal@raftaar.pk',
        roles: ['rider'],
        riderId: 'rider_bilal_001',
      },
      {
        phone: '+923005555555',
        fullName: 'Zainab Ahmed (Support Lead)',
        email: 'support@raftaar.pk',
        roles: ['support_staff'],
      },
      {
        phone: '+923006666666',
        fullName: 'Fahad Mehmood (Finance Auditor)',
        email: 'finance@raftaar.pk',
        roles: ['finance_staff'],
      },
      {
        phone: '+923007777777',
        fullName: 'Suleman Qureshi (Operations Manager)',
        email: 'manager@raftaar.pk',
        roles: ['manager'],
      },
      {
        phone: '+923008888888',
        fullName: 'Ayesha Siddiqui (Platform Admin)',
        email: 'admin@raftaar.pk',
        roles: ['admin'],
      },
      {
        phone: '+923009999999',
        fullName: 'Usman Ghani (Super Admin)',
        email: 'superadmin@raftaar.pk',
        roles: ['super_admin'],
      },
      {
        phone: '+923007867860',
        fullName: 'Huzaifa (Super Admin)',
        email: 'huzaifa24615@gmail.com',
        roles: ['super_admin', 'admin'],
      },
    ];

    demoUsers.forEach((u) => {
      this.createUser({
        phone: u.phone,
        fullName: u.fullName,
        email: u.email,
        roles: u.roles,
        status: 'active',
        isPhoneVerified: true,
        merchantId: u.merchantId,
        riderId: u.riderId,
        isDemo: true,
      });
    });

    // Initial audit log
    this.addAuditLog({
      actorRole: 'system',
      action: 'database:seed:phase1',
      resource: 'system',
      targetId: 'seed_init',
      diff: { initializedUsersCount: demoUsers.length, permissionsCount: ALL_PERMISSIONS.length },
      ipAddress: '127.0.0.1',
      userAgent: 'Raftaar-Bootstrapper/1.0',
    });
  }

  // --- Phase 2 Catalog Seeding & Operations ---
  seedCatalogData() {
    this.categories.clear();
    this.merchants.clear();
    this.menuItems.clear();
    this.products.clear();
    this.addresses.clear();

    SEED_CATEGORIES.forEach((cat) => this.categories.set(cat.id, cat));
    SEED_MERCHANTS.forEach((m) => this.merchants.set(m.id, m));
    SEED_MENU_ITEMS.forEach((item) => this.menuItems.set(item.id, item));
    SEED_PRODUCTS.forEach((p) => this.products.set(p.id, p));
    SEED_CUSTOMER_ADDRESSES.forEach((a) => this.addresses.set(a.id, a));
  }

  listCategories(type?: 'food' | 'grocery'): Category[] {
    const list = Array.from(this.categories.values());
    if (!type) return list;
    return list.filter((c) => c.type === type || c.type === 'both');
  }

  listMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  findMerchantById(id: string): Merchant | undefined {
    return this.merchants.get(id);
  }

  updateMerchant(merchant: Merchant): Merchant {
    this.merchants.set(merchant.id, merchant);
    return merchant;
  }

  createMerchant(merchant: Merchant): Merchant {
    this.merchants.set(merchant.id, merchant);
    return merchant;
  }

  deleteMerchant(id: string): boolean {
    return this.merchants.delete(id);
  }

  createMenuItem(item: MenuItem): MenuItem {
    this.menuItems.set(item.id, item);
    return item;
  }

  createProduct(product: Product): Product {
    this.products.set(product.id, product);
    return product;
  }

  findMerchantBySlug(slug: string): Merchant | undefined {
    for (const m of this.merchants.values()) {
      if (m.slug === slug) return m;
    }
    return undefined;
  }

  listMenuItemsByMerchant(merchantId: string): MenuItem[] {
    return Array.from(this.menuItems.values()).filter((item) => item.merchantId === merchantId);
  }

  listProductsByMerchant(merchantId: string): Product[] {
    return Array.from(this.products.values()).filter((p) => p.merchantId === merchantId);
  }

  findMenuItemById(id: string): MenuItem | undefined {
    return this.menuItems.get(id);
  }

  findProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  updateProductStock(productId: string, stockQuantity: number): Product | undefined {
    const product = this.products.get(productId);
    if (!product) return undefined;
    product.stockQuantity = stockQuantity;
    product.inStock = stockQuantity > 0;
    return product;
  }

  listAddressesByUser(userId: string): CustomerAddress[] {
    return Array.from(this.addresses.values()).filter((a) => a.userId === userId);
  }

  createAddress(addr: Omit<CustomerAddress, 'id' | 'createdAt'>): CustomerAddress {
    const id = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAddress: CustomerAddress = {
      id,
      ...addr,
      createdAt: new Date().toISOString(),
    };
    if (addr.isDefault) {
      // Unset previous default
      for (const a of this.addresses.values()) {
        if (a.userId === addr.userId) a.isDefault = false;
      }
    }
    this.addresses.set(id, newAddress);
    return newAddress;
  }

  setDefaultAddress(userId: string, addressId: string): boolean {
    let updated = false;
    for (const a of this.addresses.values()) {
      if (a.userId === userId) {
        if (a.id === addressId) {
          a.isDefault = true;
          updated = true;
        } else {
          a.isDefault = false;
        }
      }
    }
    return updated;
  }

  deleteAddress(userId: string, addressId: string): boolean {
    const addr = this.addresses.get(addressId);
    if (addr && addr.userId === userId) {
      return this.addresses.delete(addressId);
    }
    return false;
  }

  // --- Phase 3 Orders & Coupons ---
  seedCoupons() {
    this.coupons.clear();
    SEED_COUPONS.forEach((c) => this.coupons.set(c.code.toUpperCase(), c));
  }

  listCoupons(): Coupon[] {
    return Array.from(this.coupons.values()).filter((c) => new Date(c.expiryDate) > new Date());
  }

  findCouponByCode(code: string): Coupon | undefined {
    return this.coupons.get(code.trim().toUpperCase());
  }

  incrementCouponUsage(code: string) {
    const coupon = this.findCouponByCode(code);
    if (coupon) {
      coupon.timesUsed += 1;
    }
  }

  saveOrder(order: Order): Order {
    this.orders.set(order.id, order);
    return order;
  }

  findOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  findOrderByNumber(orderNumber: string): Order | undefined {
    for (const order of this.orders.values()) {
      if (order.orderNumber === orderNumber) return order;
    }
    return undefined;
  }

  listOrders(filters?: { customerId?: string; merchantId?: string; status?: OrderStatus }): Order[] {
    let list = Array.from(this.orders.values());
    if (filters?.customerId) {
      list = list.filter((o) => o.customerId === filters.customerId);
    }
    if (filters?.merchantId) {
      list = list.filter((o) => o.merchantId === filters.merchantId);
    }
    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    // Most recent orders first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateOrderStatus(orderId: string, status: OrderStatus, historyItem: OrderStatusHistoryItem): Order | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push(historyItem);
    return order;
  }

  // --- Phase 4 Dispatch & Rider Operations ---
  seedRiders() {
    this.riders.clear();
    this.dispatchOffers.clear();
    SEED_RIDERS.forEach((r) => this.riders.set(r.id, { ...r }));
  }

  listRiders(): Rider[] {
    return Array.from(this.riders.values());
  }

  findRiderById(id: string): Rider | undefined {
    return this.riders.get(id);
  }

  findRiderByUserId(userId: string): Rider | undefined {
    for (const r of this.riders.values()) {
      if (r.userId === userId) return r;
    }
    return undefined;
  }

  updateRider(rider: Rider): Rider {
    this.riders.set(rider.id, rider);
    return rider;
  }

  createRider(rider: Rider): Rider {
    this.riders.set(rider.id, rider);
    return rider;
  }

  deleteRider(id: string): boolean {
    return this.riders.delete(id);
  }

  saveDispatchOffer(offer: DispatchOffer): DispatchOffer {
    this.dispatchOffers.set(offer.id, offer);
    return offer;
  }

  findDispatchOfferById(id: string): DispatchOffer | undefined {
    return this.dispatchOffers.get(id);
  }

  findActiveOfferForRider(riderId: string): DispatchOffer | undefined {
    const now = Date.now();
    for (const offer of this.dispatchOffers.values()) {
      if (offer.riderId === riderId && offer.status === 'pending') {
        if (offer.expiresAt > now) {
          return offer;
        } else {
          offer.status = 'expired';
        }
      }
    }
    return undefined;
  }

  toggleMenuItemAvailability(itemId: string, isAvailable: boolean): MenuItem | undefined {
    const item = this.menuItems.get(itemId);
    if (item) {
      item.isAvailable = isAvailable;
      return item;
    }
    return undefined;
  }

  // --- Phase 5: Finance Operations & Settlements ---
  private seedFinanceData() {
    for (const rem of SEED_RIDER_REMITTANCES) {
      this.riderRemittances.set(rem.id, { ...rem });
    }
    for (const set of SEED_MERCHANT_SETTLEMENTS) {
      this.merchantSettlements.set(set.id, { ...set });
    }
    for (const ref of SEED_REFUND_REQUESTS) {
      this.refundRequests.set(ref.id, { ...ref });
    }
  }

  saveRiderRemittance(remittance: RiderRemittance): RiderRemittance {
    this.riderRemittances.set(remittance.id, remittance);
    return remittance;
  }

  findRiderRemittanceById(id: string): RiderRemittance | undefined {
    return this.riderRemittances.get(id);
  }

  listRiderRemittances(filters?: { riderId?: string; status?: string }): RiderRemittance[] {
    let list = Array.from(this.riderRemittances.values());
    if (filters?.riderId) {
      list = list.filter((r) => r.riderId === filters.riderId);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  saveMerchantSettlement(settlement: MerchantSettlement): MerchantSettlement {
    this.merchantSettlements.set(settlement.id, settlement);
    return settlement;
  }

  findMerchantSettlementById(id: string): MerchantSettlement | undefined {
    return this.merchantSettlements.get(id);
  }

  listMerchantSettlements(filters?: { merchantId?: string; status?: string }): MerchantSettlement[] {
    let list = Array.from(this.merchantSettlements.values());
    if (filters?.merchantId) {
      list = list.filter((s) => s.merchantId === filters.merchantId);
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  saveRefundRequest(refund: RefundRequest): RefundRequest {
    this.refundRequests.set(refund.id, refund);
    return refund;
  }

  findRefundRequestById(id: string): RefundRequest | undefined {
    return this.refundRequests.get(id);
  }

  listRefundRequests(filters?: {
    orderId?: string;
    customerId?: string;
    merchantId?: string;
    status?: string;
  }): RefundRequest[] {
    let list = Array.from(this.refundRequests.values());
    if (filters?.orderId) {
      list = list.filter((r) => r.orderId === filters.orderId);
    }
    if (filters?.customerId) {
      list = list.filter((r) => r.customerId === filters.customerId);
    }
    if (filters?.merchantId) {
      list = list.filter((r) => r.merchantId === filters.merchantId);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Phase 6: Customer Experience Data & Methods ---
  private seedCustomerData() {
    // Seed default customer notifications
    const demoCustomerNotifs = [
      {
        id: 'notif_welcome',
        title: 'Welcome to Raftaar Express! 🎉',
        titleUr: 'رفتار ایکسپریس میں خوش آمدید! 🎉',
        body: 'Enjoy fast delivery from the best restaurants and grocery marts in Karachi. Use coupon RAFTAR50 for 50% off your first order!',
        bodyUr: 'کراچی کے بہترین ریسٹورنٹس اور مارٹس سے تیز ترین ڈلیوری۔ اپنے پہلے آرڈر پر 50 فیصد رعایت کے لیے کوڈ RAFTAR50 استعمال کریں۔',
        type: 'promo' as const,
        read: false,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'notif_discount_deal',
        title: 'Special 40% OFF Burger Deal 🔥',
        titleUr: 'برگر ڈیل پر 40 فیصد رعایت 🔥',
        body: 'Flash deal active at Broadway Pizza & Student Biryani until 11:00 PM tonight.',
        bodyUr: 'سٹوڈنٹ بریانی اور براڈ وے پیزا پر آج رات 11 بجے تک خصوصی ڈسکاؤنٹ دستیاب ہے۔',
        type: 'promo' as const,
        read: false,
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'notif_free_delivery',
        title: 'Free Delivery Weekend Alert 🛵',
        titleUr: 'مفت ڈلیوری ویک اینڈ الرٹ 🛵',
        body: 'Apply coupon code FREEDEL on any order over Rs. 400 for free doorstep delivery.',
        bodyUr: '400 روپے سے زائد کے کسی بھی آرڈر پر مفت ڈلیوری کے لیے کوڈ FREEDEL استعمال کریں۔',
        type: 'system' as const,
        read: true,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    this.userNotifications.set('usr_customer_1', demoCustomerNotifs);

    // Seed default payment methods
    const demoPayments = [
      {
        id: 'pm_cod',
        type: 'cod' as const,
        title: 'Cash on Delivery (COD)',
        subtitle: 'Pay cash when rider arrives. Change note available: Rs. 1,000 note',
        isDefault: true,
        details: { preferredNote: '1000' },
      },
      {
        id: 'pm_jazzcash',
        type: 'jazzcash' as const,
        title: 'JazzCash Mobile Account',
        subtitle: '0300-1234567 • Instant PIN authorization',
        isDefault: false,
        details: { phone: '03001234567' },
      },
      {
        id: 'pm_card_visa',
        type: 'card' as const,
        title: 'Visa Debit Card',
        subtitle: 'Ending in •••• 4242 (Exp: 12/28)',
        isDefault: false,
        details: { last4: '4242', brand: 'visa', expMonth: '12', expYear: '28' },
      },
    ];
    this.userPaymentMethods.set('usr_customer_1', demoPayments);

    // Seed default favorites
    this.userFavorites.set('usr_customer_1', {
      merchantIds: ['merch_student_biryani', 'merch_imtiaz'],
      itemIds: ['item_sb_1', 'item_sb_2'],
    });

    // Seed a support ticket
    this.supportTickets.set('usr_customer_1', [
      {
        id: 'tkt_001',
        userId: 'usr_customer_1',
        subject: 'Delivery zone question in Clifton Block 7',
        category: 'Delivery Information',
        status: 'resolved',
        messages: [
          {
            id: 'msg_1',
            sender: 'customer',
            senderName: 'Fatima Noor',
            message: 'Hello! Does Raftaar deliver groceries to Clifton Block 7 after 10 PM?',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: 'msg_2',
            sender: 'support',
            senderName: 'Raftaar Care Support',
            message: 'Assalam-o-Alaikum Fatima! Yes, Imtiaz Super Market and our express riders deliver in Clifton Block 7 until midnight (12:00 AM) every day.',
            timestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
      },
    ]);
  }

  // Favorites
  getFavorites(userId: string): { merchantIds: string[]; itemIds: string[] } {
    if (!this.userFavorites.has(userId)) {
      this.userFavorites.set(userId, { merchantIds: [], itemIds: [] });
    }
    return this.userFavorites.get(userId)!;
  }

  toggleFavorite(userId: string, type: 'merchant' | 'item', id: string): { isFavorite: boolean; favorites: { merchantIds: string[]; itemIds: string[] } } {
    const favs = this.getFavorites(userId);
    let isFavorite = false;
    if (type === 'merchant') {
      const idx = favs.merchantIds.indexOf(id);
      if (idx >= 0) {
        favs.merchantIds.splice(idx, 1);
        isFavorite = false;
      } else {
        favs.merchantIds.push(id);
        isFavorite = true;
      }
    } else {
      const idx = favs.itemIds.indexOf(id);
      if (idx >= 0) {
        favs.itemIds.splice(idx, 1);
        isFavorite = false;
      } else {
        favs.itemIds.push(id);
        isFavorite = true;
      }
    }
    return { isFavorite, favorites: favs };
  }

  // Notifications
  getNotifications(userId: string) {
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }
    return this.userNotifications.get(userId)!;
  }

  markNotificationRead(userId: string, notifId: string): boolean {
    const notifs = this.getNotifications(userId);
    const notif = notifs.find((n) => n.id === notifId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): number {
    const notifs = this.getNotifications(userId);
    let count = 0;
    notifs.forEach((n) => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  addNotification(userId: string, notif: { title: string; titleUr?: string; body: string; bodyUr?: string; type: 'order' | 'promo' | 'system'; orderId?: string }) {
    const notifs = this.getNotifications(userId);
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...notif,
      read: false,
      timestamp: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    return newNotif;
  }

  // Support Tickets
  getSupportTickets(userId: string) {
    if (!this.supportTickets.has(userId)) {
      this.supportTickets.set(userId, []);
    }
    return this.supportTickets.get(userId)!;
  }

  createSupportTicket(userId: string, data: { orderId?: string; subject: string; category: string; message: string; customerName: string }) {
    const tickets = this.getSupportTickets(userId);
    const now = new Date().toISOString();
    const newTicket = {
      id: `tkt_${Date.now().toString(36).toUpperCase()}`,
      userId,
      orderId: data.orderId,
      subject: data.subject,
      category: data.category || 'General Inquiry',
      status: 'open' as const,
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'customer' as const,
          senderName: data.customerName || 'Customer',
          message: data.message,
          timestamp: now,
        },
        {
          id: `msg_auto_${Date.now()}`,
          sender: 'support' as const,
          senderName: 'Raftaar Automated Assistant',
          message: `Thank you for reaching out regarding "${data.subject}". A Raftaar support specialist is reviewing your request. For urgent active order queries, our hotline is also open 24/7 at 021-111-RAFTAR.`,
          timestamp: new Date(Date.now() + 1000).toISOString(),
        }
      ],
      createdAt: now,
      updatedAt: now,
    };
    tickets.unshift(newTicket);
    return newTicket;
  }

  replySupportTicket(userId: string, ticketId: string, message: string, customerName: string) {
    const tickets = this.getSupportTickets(userId);
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');
    const now = new Date().toISOString();
    ticket.messages.push({
      id: `msg_${Date.now()}`,
      sender: 'customer',
      senderName: customerName || 'Customer',
      message,
      timestamp: now,
    });
    ticket.updatedAt = now;
    return ticket;
  }

  // Order Reviews
  saveOrderReview(userId: string, userName: string, orderId: string, rating: number, comment: string, foodRating?: number, deliveryRating?: number) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');
    if (order.customerId !== userId) throw new Error('You can only review your own orders');
    if (order.status !== 'DELIVERED') throw new Error('You can only review completed orders');

    const existing = this.orderReviews.get(orderId);
    if (existing) throw new Error('You have already submitted a review for this order');

    const review = {
      id: `rev_${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
      userName,
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      rating: Math.max(1, Math.min(5, rating)),
      comment,
      deliveryRating,
      foodRating,
      createdAt: new Date().toISOString(),
    };
    this.orderReviews.set(orderId, review);
    return review;
  }

  getOrderReview(orderId: string) {
    return this.orderReviews.get(orderId);
  }

  // Payment Methods
  getPaymentMethods(userId: string) {
    if (!this.userPaymentMethods.has(userId)) {
      this.userPaymentMethods.set(userId, [
        {
          id: 'pm_cod',
          type: 'cod',
          title: 'Cash on Delivery (COD)',
          subtitle: 'Pay cash to rider upon arrival',
          isDefault: true,
        },
      ]);
    }
    return this.userPaymentMethods.get(userId)!;
  }

  addPaymentMethod(userId: string, method: { type: 'cod' | 'jazzcash' | 'easypaisa' | 'raast' | 'card'; title: string; subtitle: string; isDefault?: boolean; details?: any }) {
    const methods = this.getPaymentMethods(userId);
    if (method.isDefault) {
      methods.forEach((m) => (m.isDefault = false));
    }
    const newMethod = {
      id: `pm_${Date.now()}`,
      type: method.type,
      title: method.title,
      subtitle: method.subtitle,
      isDefault: Boolean(method.isDefault) || methods.length === 0,
      details: method.details,
    };
    methods.push(newMethod);
    return newMethod;
  }

  removePaymentMethod(userId: string, methodId: string): boolean {
    const methods = this.getPaymentMethods(userId);
    const idx = methods.findIndex((m) => m.id === methodId);
    if (idx >= 0) {
      const removed = methods.splice(idx, 1)[0];
      if (removed.isDefault && methods.length > 0) {
        methods[0].isDefault = true;
      }
      return true;
    }
    return false;
  }

  setDefaultPaymentMethod(userId: string, methodId: string): boolean {
    const methods = this.getPaymentMethods(userId);
    let found = false;
    methods.forEach((m) => {
      if (m.id === methodId) {
        m.isDefault = true;
        found = true;
      } else {
        m.isDefault = false;
      }
    });
    return found;
  }
}

export const dataStore = new MemoryDataStore();
