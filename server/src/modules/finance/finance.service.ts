import { dataStore } from '../../db/datastore.ts';
import { TokenPayload } from '../auth/auth.service.ts';
import { orderStateMachine } from '../orders/order-state-machine.ts';
import { paymentGateway } from '../payments/adapters/payment.adapter.ts';
import {
  MerchantSettlement,
  PlatformFinancialMetrics,
  RefundRequest,
  RiderRemittance,
} from '../../types/finance.types.ts';

export interface GlobalPlatformSettings {
  defaultCommissionRate: number; // percentage (e.g. 15.0)
  platformServiceFee: number; // in paisas (e.g. 2000 = Rs. 20)
  riderMaxCashLimit: number; // in paisas (e.g. 1500000 = Rs. 15,000)
  autoSettlementCycleDays: number; // 7 days
}

export class FinanceService {
  private globalSettings: GlobalPlatformSettings = {
    defaultCommissionRate: 15.0,
    platformServiceFee: 2000,
    riderMaxCashLimit: 1500000,
    autoSettlementCycleDays: 7,
  };

  // --- 1. Rider COD Remittance & Float Reconciliation ---
  recordRiderRemittance(
    riderId: string,
    amount: number,
    remittanceMethod: 'hub_cash_deposit' | 'jazzcash_transfer' | 'easypaisa_transfer' | 'bank_transfer',
    referenceNumber: string,
    notes?: string
  ): RiderRemittance {
    const rider = dataStore.findRiderById(riderId);
    if (!rider) throw new Error(`Rider '${riderId}' not found.`);
    if (amount <= 0) throw new Error('Remittance deposit amount must be greater than zero.');

    const remittance: RiderRemittance = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      riderId: rider.id,
      riderName: rider.name,
      amount,
      remittanceMethod,
      referenceNumber,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString(),
    };

    return dataStore.saveRiderRemittance(remittance);
  }

  verifyRiderRemittance(
    remittanceId: string,
    approved: boolean,
    actor: TokenPayload,
    notes?: string
  ): RiderRemittance {
    const remittance = dataStore.findRiderRemittanceById(remittanceId);
    if (!remittance) throw new Error(`Remittance record '${remittanceId}' not found.`);
    if (remittance.status !== 'pending') {
      throw new Error(`Remittance is already ${remittance.status}. Cannot modify.`);
    }

    const rider = dataStore.findRiderById(remittance.riderId);
    if (!rider) throw new Error(`Associated rider '${remittance.riderId}' not found.`);

    if (approved) {
      remittance.status = 'verified';
      remittance.verifiedBy = actor.sub;
      remittance.verifiedAt = new Date().toISOString();
      if (notes) remittance.notes = (remittance.notes ? remittance.notes + ' | ' : '') + notes;

      // Deduct verified cash from rider cash-in-hand float
      rider.cashInHand = Math.max(0, rider.cashInHand - remittance.amount);
      dataStore.updateRider(rider);

      dataStore.addAuditLog({
        actorId: actor.sub,
        actorRole: actor.roles[0],
        action: 'REMITTANCE_VERIFIED',
        resource: 'payments',
        targetId: remittance.id,
        diff: {
          riderId: rider.id,
          amountPaisa: remittance.amount,
          newCashInHandPaisa: rider.cashInHand,
        },
      });
    } else {
      remittance.status = 'rejected';
      remittance.verifiedBy = actor.sub;
      remittance.verifiedAt = new Date().toISOString();
      if (notes) remittance.notes = (remittance.notes ? remittance.notes + ' | ' : '') + notes;

      dataStore.addAuditLog({
        actorId: actor.sub,
        actorRole: actor.roles[0],
        action: 'REMITTANCE_REJECTED',
        resource: 'payments',
        targetId: remittance.id,
        diff: {
          riderId: rider.id,
          amountPaisa: remittance.amount,
        },
      });
    }

    return dataStore.saveRiderRemittance(remittance);
  }

  getRiderFloatSummary(riderId: string) {
    const rider = dataStore.findRiderById(riderId);
    if (!rider) throw new Error(`Rider '${riderId}' not found.`);

    const maxLimit = rider.maxCashLimit || this.globalSettings.riderMaxCashLimit;
    const utilizationPct = Math.min(100, Math.round((rider.cashInHand / maxLimit) * 100));
    const pendingRemittances = dataStore
      .listRiderRemittances({ riderId: rider.id, status: 'pending' });

    return {
      riderId: rider.id,
      name: rider.name,
      cashInHand: rider.cashInHand,
      maxCashLimit: maxLimit,
      utilizationPercentage: utilizationPct,
      isNearLimit: utilizationPct >= 80,
      isOverLimit: rider.cashInHand >= maxLimit,
      canAcceptNewOrders: rider.cashInHand < maxLimit,
      pendingRemittanceCount: pendingRemittances.length,
      todayEarnings: rider.todayEarnings,
    };
  }

  // --- 2. Merchant Payout & Batch Settlement System ---
  calculateMerchantPayoutLedger(merchantId: string) {
    const merchant = dataStore.findMerchantById(merchantId);
    if (!merchant) throw new Error(`Merchant '${merchantId}' not found.`);

    const deliveredOrders = dataStore.listOrders({
      merchantId,
      status: 'DELIVERED',
    });

    const grossSales = deliveredOrders.reduce((sum, o) => sum + o.pricing.subtotal, 0);
    const commissionRate = merchant.commissionRate || this.globalSettings.defaultCommissionRate;
    const commissionAmount = Math.round(grossSales * (commissionRate / 100));

    // Calculate approved refund deductions for this merchant
    const refunds = dataStore.listRefundRequests({ merchantId, status: 'approved' });
    const refundDeductions = refunds.reduce((sum, r) => sum + r.amount, 0);

    const netPayout = Math.max(0, grossSales - commissionAmount - refundDeductions);

    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      orderCount: deliveredOrders.length,
      grossSales,
      commissionRate,
      commissionAmount,
      refundDeductions,
      netPayout,
      bankOrRaast: 'PK36MEZN0001234567890123',
    };
  }

  generateMerchantSettlement(
    merchantId: string,
    periodStart: string,
    periodEnd: string,
    beneficiaryIbanOrRaast: string,
    payoutMethod: 'raast_instant' | 'bank_transfer' | 'jazzcash' | 'easypaisa',
    actor: TokenPayload
  ): MerchantSettlement {
    const merchant = dataStore.findMerchantById(merchantId);
    if (!merchant) throw new Error(`Merchant '${merchantId}' not found.`);

    const ledger = this.calculateMerchantPayoutLedger(merchantId);

    const settlement: MerchantSettlement = {
      id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      periodStart,
      periodEnd,
      orderCount: ledger.orderCount,
      grossSales: ledger.grossSales,
      commissionRate: ledger.commissionRate,
      commissionAmount: ledger.commissionAmount,
      refundDeductions: ledger.refundDeductions,
      netPayout: ledger.netPayout,
      payoutMethod,
      beneficiaryIbanOrRaast: beneficiaryIbanOrRaast || ledger.bankOrRaast,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    dataStore.saveMerchantSettlement(settlement);

    dataStore.addAuditLog({
      actorId: actor.sub,
      actorRole: actor.roles[0],
      action: 'SETTLEMENT_BATCH_GENERATED',
      resource: 'settlements',
      targetId: settlement.id,
      diff: {
        merchantId,
        netPayoutPaisa: settlement.netPayout,
        orderCount: settlement.orderCount,
      },
    });

    return settlement;
  }

  disburseMerchantSettlement(
    settlementId: string,
    transferReference: string,
    actor: TokenPayload
  ): MerchantSettlement {
    const settlement = dataStore.findMerchantSettlementById(settlementId);
    if (!settlement) throw new Error(`Settlement '${settlementId}' not found.`);
    if (settlement.status === 'settled') {
      throw new Error(`Settlement '${settlementId}' is already disbursed.`);
    }

    settlement.status = 'settled';
    settlement.transferReference = transferReference || `RAAST-SET-${Date.now()}`;
    settlement.settledAt = new Date().toISOString();
    settlement.settledBy = actor.sub;

    dataStore.saveMerchantSettlement(settlement);

    dataStore.addAuditLog({
      actorId: actor.sub,
      actorRole: actor.roles[0],
      action: 'SETTLEMENT_DISBURSED',
      resource: 'settlements',
      targetId: settlement.id,
      diff: {
        merchantId: settlement.merchantId,
        amountPaisa: settlement.netPayout,
        transferReference: settlement.transferReference,
      },
    });

    return settlement;
  }

  // --- 3. Customer Refund & Dispute Lifecycle ---
  async requestRefund(
    orderId: string,
    amount: number,
    reason: any,
    description: string,
    actor: TokenPayload
  ): Promise<RefundRequest> {
    const order = dataStore.findOrderById(orderId);
    if (!order) throw new Error(`Order '${orderId}' not found.`);

    // Tenant check: Customer can only request refunds for their own order
    if (actor.roles.includes('customer') && order.customerId !== actor.sub) {
      throw new Error('Unauthorized: You can only request refunds for your own orders.');
    }

    if (amount <= 0 || amount > order.pricing.total) {
      throw new Error(
        `Invalid refund amount. Must be between 1 paisa and order total (Rs. ${(order.pricing.total / 100).toFixed(0)}).`
      );
    }

    const refundRequest: RefundRequest = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      amount,
      reason,
      description,
      requestedBy: actor.sub,
      requestedByRole: actor.roles[0],
      status: 'pending',
      refundChannel: 'wallet_credit',
      createdAt: new Date().toISOString(),
    };

    // Transition order state machine to REFUND_PENDING
    if (order.status !== 'CANCELLED' && order.status !== 'REJECTED') {
      try {
        orderStateMachine.validateAndTransition(
          order,
          'REFUND_PENDING',
          actor,
          `Customer requested refund: ${reason} (Rs. ${(amount / 100).toFixed(0)})`
        );
      } catch (err: any) {
        console.warn('Could not transition to REFUND_PENDING:', err.message);
      }
    }

    dataStore.saveRefundRequest(refundRequest);

    dataStore.addAuditLog({
      actorId: actor.sub,
      actorRole: actor.roles[0],
      action: 'REFUND_REQUESTED',
      resource: 'refunds',
      targetId: refundRequest.id,
      diff: {
        orderId: order.id,
        amountPaisa: amount,
        reason,
      },
    });

    return refundRequest;
  }

  async processRefundApproval(
    refundId: string,
    approved: boolean,
    actor: TokenPayload,
    reviewNotes?: string
  ): Promise<{ refund: RefundRequest; gatewayResult?: any }> {
    const refund = dataStore.findRefundRequestById(refundId);
    if (!refund) throw new Error(`Refund request '${refundId}' not found.`);
    if (refund.status !== 'pending') {
      throw new Error(`Refund request has already been ${refund.status}.`);
    }

    const order = dataStore.findOrderById(refund.orderId);
    if (!order) throw new Error(`Associated order '${refund.orderId}' not found.`);

    if (approved) {
      refund.status = 'approved';
      refund.reviewedBy = actor.sub;
      refund.reviewedAt = new Date().toISOString();
      refund.reviewNotes = reviewNotes || 'Refund authorized by Finance';

      // Call payment gateway adapter for reversal
      let gatewayResult;
      try {
        gatewayResult = await paymentGateway.processRefund(
          order.payment.method,
          order.payment.transactionRef || `TX-${order.orderNumber}`,
          refund.amount,
          refund.reason
        );
      } catch (err: any) {
        console.warn('Gateway refund execution note:', err.message);
      }

      // Transition order state machine to REFUNDED
      order.status = 'REFUNDED';
      order.payment.status = 'refunded';
      order.updatedAt = new Date().toISOString();
      order.statusHistory.push({
        id: `hist_${Date.now()}`,
        fromStatus: 'REFUND_PENDING',
        toStatus: 'REFUNDED',
        actorId: actor.sub,
        actorRole: actor.roles[0],
        reason: `Refund approved: Rs. ${(refund.amount / 100).toFixed(0)} credited`,
        timestamp: new Date().toISOString(),
      });
      dataStore.saveOrder(order);
      dataStore.saveRefundRequest(refund);

      dataStore.addAuditLog({
        actorId: actor.sub,
        actorRole: actor.roles[0],
        action: 'REFUND_APPROVED',
        resource: 'refunds',
        targetId: refund.id,
        diff: {
          orderId: order.id,
          amountPaisa: refund.amount,
          actor: actor.sub,
        },
      });

      return { refund, gatewayResult };
    } else {
      refund.status = 'rejected';
      refund.reviewedBy = actor.sub;
      refund.reviewedAt = new Date().toISOString();
      refund.reviewNotes = reviewNotes || 'Refund rejected by Finance';

      // If order was in REFUND_PENDING, revert to DELIVERED
      if (order.status === 'REFUND_PENDING') {
        order.status = 'DELIVERED';
        order.updatedAt = new Date().toISOString();
        dataStore.saveOrder(order);
      }
      dataStore.saveRefundRequest(refund);

      dataStore.addAuditLog({
        actorId: actor.sub,
        actorRole: actor.roles[0],
        action: 'REFUND_REJECTED',
        resource: 'refunds',
        targetId: refund.id,
        diff: {
          orderId: order.id,
          amountPaisa: refund.amount,
          reason: reviewNotes,
        },
      });

      return { refund };
    }
  }

  // --- 4. Platform Analytics & Financial Control Tower ---
  getPlatformFinancialMetrics(): PlatformFinancialMetrics {
    const allOrders = dataStore.listOrders();
    const deliveredOrders = allOrders.filter((o) => o.status === 'DELIVERED');
    const refundedOrders = allOrders.filter((o) => o.status === 'REFUNDED');

    const totalGmv = deliveredOrders.reduce((sum, o) => sum + o.pricing.total, 0);

    const totalCommissionsEarned = deliveredOrders.reduce((sum, o) => {
      const merchant = dataStore.findMerchantById(o.merchantId);
      const rate = merchant?.commissionRate || 15.0;
      return sum + Math.round(o.pricing.subtotal * (rate / 100));
    }, 0);

    const totalServiceFeesEarned = deliveredOrders.reduce(
      (sum, o) => sum + (o.pricing.serviceFee || 0),
      0
    );

    const totalPlatformRevenue = totalCommissionsEarned + totalServiceFeesEarned;

    const allRiders = dataStore.listRiders();
    const totalCodCashInCirculation = allRiders.reduce((sum, r) => sum + r.cashInHand, 0);

    const settlements = dataStore.listMerchantSettlements();
    const totalMerchantPayoutsSettled = settlements
      .filter((s) => s.status === 'settled')
      .reduce((sum, s) => sum + s.netPayout, 0);
    const totalMerchantPayoutsPending = settlements
      .filter((s) => s.status === 'draft' || s.status === 'processing')
      .reduce((sum, s) => sum + s.netPayout, 0);

    const refunds = dataStore.listRefundRequests();
    const totalRefundsDisbursed = refunds
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalGmv,
      totalPlatformRevenue,
      totalCommissionsEarned,
      totalServiceFeesEarned,
      totalCodCashInCirculation,
      totalMerchantPayoutsSettled,
      totalMerchantPayoutsPending,
      totalRefundsDisbursed,
      activeRiderCount: allRiders.filter((r) => r.status !== 'offline').length,
      activeMerchantCount: dataStore.listMerchants().filter((m) => m.isOpen).length,
      totalCompletedOrders: deliveredOrders.length,
    };
  }

  getGlobalSettings(): GlobalPlatformSettings {
    return { ...this.globalSettings };
  }

  updateGlobalSettings(newSettings: Partial<GlobalPlatformSettings>, actor: TokenPayload) {
    this.globalSettings = { ...this.globalSettings, ...newSettings };
    dataStore.addAuditLog({
      actorId: actor.sub,
      actorRole: actor.roles[0],
      action: 'GLOBAL_SETTINGS_UPDATED',
      resource: 'settings',
      diff: newSettings,
    });
    return this.globalSettings;
  }
}

export const financeService = new FinanceService();
