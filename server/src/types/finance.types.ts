import { PaymentMethod, PaymentStatus } from './order.types.ts';

export type { PaymentMethod, PaymentStatus };

export interface ProcessPaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number; // in paisas
  method: PaymentMethod;
  customerPhone: string;
  walletAccount?: string; // JazzCash / Easypaisa phone number
  raastId?: string; // Raast phone alias or IBAN
  cardDetails?: {
    cardNumber: string;
    cardHolder: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  notes?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionRef: string;
  provider: 'cod' | 'jazzcash' | 'easypaisa' | 'raast' | 'card';
  status: PaymentStatus;
  amount: number;
  metadata?: Record<string, any>;
  message: string;
}

export interface RiderRemittance {
  id: string;
  riderId: string;
  riderName: string;
  amount: number; // in paisas
  remittanceMethod: 'hub_cash_deposit' | 'jazzcash_transfer' | 'easypaisa_transfer' | 'bank_transfer';
  referenceNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface MerchantSettlement {
  id: string;
  merchantId: string;
  merchantName: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  grossSales: number; // in paisas
  commissionRate: number; // percentage e.g. 15
  commissionAmount: number; // in paisas
  refundDeductions: number; // in paisas
  netPayout: number; // in paisas (grossSales - commissionAmount - refundDeductions)
  payoutMethod: 'raast_instant' | 'bank_transfer' | 'jazzcash' | 'easypaisa';
  beneficiaryIbanOrRaast: string;
  status: 'draft' | 'processing' | 'settled';
  transferReference?: string;
  settledAt?: string;
  settledBy?: string;
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  amount: number; // in paisas
  reason:
    | 'damaged_item'
    | 'spilled_food'
    | 'wrong_item'
    | 'missing_item'
    | 'excessive_delay'
    | 'order_cancelled'
    | 'other';
  description: string;
  requestedBy: string; // actorId
  requestedByRole: string;
  status: 'pending' | 'approved' | 'rejected';
  refundChannel: 'wallet_credit' | 'original_payment_method';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface PlatformFinancialMetrics {
  totalGmv: number; // in paisas
  totalPlatformRevenue: number; // commission + tech service fees
  totalCommissionsEarned: number;
  totalServiceFeesEarned: number;
  totalCodCashInCirculation: number;
  totalMerchantPayoutsSettled: number;
  totalMerchantPayoutsPending: number;
  totalRefundsDisbursed: number;
  activeRiderCount: number;
  activeMerchantCount: number;
  totalCompletedOrders: number;
}
