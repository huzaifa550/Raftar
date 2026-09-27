export interface DeliveryZone {
  areaName: string;
  baseFee: number;
  perKmFee: number;
  minEstimatedMinutes: number;
  maxEstimatedMinutes: number;
}

export interface Merchant {
  id: string;
  name: string;
  slug: string;
  type: 'restaurant' | 'shop';
  rating: number;
  reviewCount: number;
  area: string;
  cuisines: string[];
  isOpen: boolean;
  hasFreeDelivery: boolean;
  logoUrl: string;
  bannerUrl: string;
  commissionRate: number;
  minOrderAmount?: number;
  deliveryZones: DeliveryZone[];
}

export interface OptionChoice {
  id: string;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  choices: OptionChoice[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  image: string;
  isAvailable: boolean;
  optionGroups?: OptionGroup[];
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  customizations?: Array<{
    groupName: string;
    choiceName: string;
    additionalPrice: number;
  }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  merchantType: 'restaurant' | 'shop';
  fulfillmentMode: 'delivery' | 'pickup';
  status: string;
  items?: any[];
  pricing: {
    subtotal: number;
    couponDiscount: number;
    deliveryFee: number;
    serviceFee: number;
    tip: number;
    total: number;
  };
  deliveryOtp: string;
  deliveryAddress?: {
    streetAddress: string;
    area: string;
    city: string;
    landmark?: string;
  };
  payment: {
    method: string;
    status: string;
  };
  statusHistory: Array<{
    toStatus: string;
    timestamp: string;
    reason?: string;
  }>;
  createdAt: string;
  rider?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    rating: number;
    lat?: number;
    lng?: number;
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  description: string;
  merchantId?: string;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  area: string;
  city: string;
  landmark?: string;
  deliveryInstructions?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface CustomerNotification {
  id: string;
  title: string;
  titleUr?: string;
  body: string;
  bodyUr?: string;
  type: 'order' | 'promo' | 'system';
  read: boolean;
  timestamp: string;
  orderId?: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'customer' | 'support';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodRecord {
  id: string;
  type: 'cod' | 'jazzcash' | 'easypaisa' | 'raast' | 'card';
  title: string;
  subtitle: string;
  isDefault: boolean;
  details?: Record<string, any>;
}

export type ClientNavTab =
  | 'dashboard'
  | 'browse_food'
  | 'restaurants'
  | 'grocery'
  | 'orders'
  | 'favorites'
  | 'coupons'
  | 'addresses'
  | 'payments'
  | 'notifications'
  | 'support'
  | 'profile'
  | 'settings';
