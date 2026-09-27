export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'RIDER_AT_MERCHANT'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'RIDER_ARRIVED'
  | 'DELIVERED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type FulfillmentMode = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'card' | 'jazzcash' | 'easypaisa' | 'raast';
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refund_pending'
  | 'refunded';

export interface SelectedOptionSnapshot {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number; // in paisas
}

export interface CartItemInput {
  itemId: string; // MenuItem or Product ID
  quantity: number;
  selectedOptionIds?: string[]; // list of option IDs
  specialInstructions?: string;
}

export interface OrderItemSnapshot {
  id: string;
  itemId: string;
  name: string;
  nameUrdu?: string;
  unitPrice: number; // in paisas
  optionsTotalPrice: number; // in paisas
  finalUnitPrice: number; // unitPrice + optionsTotalPrice
  quantity: number;
  totalPrice: number; // finalUnitPrice * quantity
  selectedOptions: SelectedOptionSnapshot[];
  specialInstructions?: string;
}

export interface PriceBreakdown {
  subtotal: number; // items + options in paisas
  itemDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  serviceFee: number; // e.g. Rs. 20 platform tech fee
  tax: number; // Sindh / Punjab Sales Tax (GST)
  tip: number;
  total: number; // final payable amount in paisas
  couponCode?: string;
  currency: 'PKR';
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionRef?: string;
  provider: string;
  cashCollected?: number; // For COD on delivery
  paidAt?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorId?: string;
  actorRole: string;
  reason?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "RFT-78601"
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  merchantType: 'restaurant' | 'shop';
  merchantPhone: string;
  fulfillmentMode: FulfillmentMode;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  pricing: PriceBreakdown;
  deliveryAddress?: {
    streetAddress: string;
    area: string;
    city: string;
    landmark?: string;
    instructions?: string;
    latitude: number;
    longitude: number;
  };
  deliveryOtp: string; // 6-digit confirmation PIN
  pickupPin?: string; // 4-digit code for counter pickup
  scheduledFor?: string; // ISO date if scheduled
  payment: PaymentRecord;
  statusHistory: OrderStatusHistoryItem[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  discountValue: number; // percentage (e.g. 20) or fixed amount in paisas (e.g. 10000 = Rs. 100)
  minOrderAmount: number; // in paisas
  maxDiscountAmount?: number; // cap in paisas
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  merchantId?: string; // specific merchant or platform-wide
  description: string;
  isDemo?: boolean;
}
