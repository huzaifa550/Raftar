import { PaymentMethod, PaymentRecord } from '../../types/order.types.ts';

export interface PaymentProcessInput {
  orderId: string;
  orderNumber: string;
  amount: number; // in paisas
  method: PaymentMethod;
  customerPhone: string;
  customerEmail?: string;
}

export interface PaymentProcessResult {
  success: boolean;
  status: 'authorized' | 'paid' | 'pending' | 'failed';
  transactionRef: string;
  provider: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaymentRefundResult {
  success: boolean;
  refundRef: string;
  amountRefunded: number;
  provider: string;
  message: string;
}

export interface PaymentProvider {
  name: string;
  processPayment(input: PaymentProcessInput): Promise<PaymentProcessResult>;
  refundPayment(orderId: string, amount: number, reason: string): Promise<PaymentRefundResult>;
}
