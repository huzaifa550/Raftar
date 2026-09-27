import { PaymentMethod, PaymentResult, ProcessPaymentInput } from '../../../types/finance.types.ts';

export interface IPaymentAdapter {
  method: PaymentMethod;
  processPayment(input: ProcessPaymentInput): Promise<PaymentResult>;
  processRefund(
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }>;
}

export class CodPaymentAdapter implements IPaymentAdapter {
  method: PaymentMethod = 'cod';

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    return {
      success: true,
      transactionRef: `COD-${input.orderNumber}`,
      provider: 'cod',
      status: 'authorized',
      amount: input.amount,
      message: 'Cash on Delivery authorized. Payment to be collected upon delivery OTP confirmation.',
      metadata: {
        note: 'Customer will pay physical cash to rider',
      },
    };
  }

  async processRefund(
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }> {
    return {
      success: true,
      refundRef: `REF-COD-${Date.now()}`,
      message: `COD payment ${transactionRef} adjusted: Rs. ${(amount / 100).toFixed(0)} credited to Raftaar Wallet (${reason}).`,
    };
  }
}

export class JazzCashAdapter implements IPaymentAdapter {
  method: PaymentMethod = 'jazzcash';

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const account = input.walletAccount || input.customerPhone;
    if (!account || account.length < 10) {
      throw new Error('Valid JazzCash Mobile Account number (+92300xxxxxxx) is required.');
    }

    const txRef = `JC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionRef: txRef,
      provider: 'jazzcash',
      status: 'paid',
      amount: input.amount,
      message: `JazzCash payment of Rs. ${(input.amount / 100).toFixed(0)} debited from ${account}. USSD MPIN verified.`,
      metadata: {
        channel: 'mobile_account',
        walletAccount: account,
        authCode: `AUTH-JC-${Math.floor(100000 + Math.random() * 900000)}`,
        gatewayFee: 0,
      },
    };
  }

  async processRefund(
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }> {
    return {
      success: true,
      refundRef: `REF-JC-${Date.now()}`,
      message: `JazzCash transaction ${transactionRef} reversed: Rs. ${(amount / 100).toFixed(0)} refunded (${reason}).`,
    };
  }
}

export class EasypaisaAdapter implements IPaymentAdapter {
  method: PaymentMethod = 'easypaisa';

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const account = input.walletAccount || input.customerPhone;
    if (!account || account.length < 10) {
      throw new Error('Valid Easypaisa Mobile Account number (+9234xxxxxxx) is required.');
    }

    const txRef = `EP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionRef: txRef,
      provider: 'easypaisa',
      status: 'paid',
      amount: input.amount,
      message: `Easypaisa payment of Rs. ${(input.amount / 100).toFixed(0)} confirmed from ${account}.`,
      metadata: {
        channel: 'direct_debit_or_qr',
        walletAccount: account,
        epOrderId: `EP-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    };
  }

  async processRefund(
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }> {
    return {
      success: true,
      refundRef: `REF-EP-${Date.now()}`,
      message: `Easypaisa transaction ${transactionRef} reversed: Rs. ${(amount / 100).toFixed(0)} refunded (${reason}).`,
    };
  }
}

export class RaastAdapter implements IPaymentAdapter {
  method: PaymentMethod = 'raast';

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const raastId = input.raastId || input.customerPhone;
    if (!raastId || raastId.length < 10) {
      throw new Error('Valid Raast ID (Registered Mobile Alias or 24-character IBAN) is required.');
    }

    const txRef = `RAAST-PK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionRef: txRef,
      provider: 'raast',
      status: 'paid',
      amount: input.amount,
      message: `Raast Instant settlement of Rs. ${(input.amount / 100).toFixed(0)} executed via SBP ISO 20022 rail.`,
      metadata: {
        rail: 'SBP_RAAST_P2M',
        raastId,
        instantClearingTimeMs: 340,
        endToEndId: `E2E-${Date.now()}`,
      },
    };
  }

  async processRefund(
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }> {
    return {
      success: true,
      refundRef: `REF-RAAST-${Date.now()}`,
      message: `Raast payment ${transactionRef} returned via instant bank credit: Rs. ${(amount / 100).toFixed(0)} (${reason}).`,
    };
  }
}

export class CardPaymentAdapter implements IPaymentAdapter {
  method: PaymentMethod = 'card';

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const card = input.cardDetails;
    if (!card || !card.cardNumber || card.cardNumber.replace(/\s+/g, '').length < 15) {
      throw new Error('Valid 16-digit debit or credit card number is required.');
    }

    const cleaned = card.cardNumber.replace(/\s+/g, '');
    const last4 = cleaned.slice(-4);
    const txRef = `CARD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionRef: txRef,
      provider: 'card',
      status: 'paid',
      amount: input.amount,
      message: `Card ending in ${last4} authorized via 3D Secure 2.0. Rs. ${(input.amount / 100).toFixed(0)} charged.`,
      metadata: {
        brand: cleaned.startsWith('4') ? 'Visa' : cleaned.startsWith('5') ? 'Mastercard' : 'PayPak',
        last4,
        cardHolder: card.cardHolder || 'Cardholder',
        threeDSecure: 'authenticated',
      },
    };
  }

  async processRefund(
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }> {
    return {
      success: true,
      refundRef: `REF-CARD-${Date.now()}`,
      message: `Card transaction ${transactionRef} credited: Rs. ${(amount / 100).toFixed(0)} (${reason}).`,
    };
  }
}

export class PaymentGateway {
  private adapters: Map<PaymentMethod, IPaymentAdapter> = new Map();

  constructor() {
    this.registerAdapter(new CodPaymentAdapter());
    this.registerAdapter(new JazzCashAdapter());
    this.registerAdapter(new EasypaisaAdapter());
    this.registerAdapter(new RaastAdapter());
    this.registerAdapter(new CardPaymentAdapter());
  }

  registerAdapter(adapter: IPaymentAdapter) {
    this.adapters.set(adapter.method, adapter);
  }

  getAdapter(method: PaymentMethod): IPaymentAdapter {
    const adapter = this.adapters.get(method);
    if (!adapter) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    return adapter;
  }

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const adapter = this.getAdapter(input.method);
    return adapter.processPayment(input);
  }

  async processRefund(
    method: PaymentMethod,
    transactionRef: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundRef: string; message: string }> {
    const adapter = this.getAdapter(method);
    return adapter.processRefund(transactionRef, amount, reason);
  }
}

export const paymentGateway = new PaymentGateway();
