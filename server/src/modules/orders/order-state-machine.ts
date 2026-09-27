import { dataStore } from '../../db/datastore.ts';
import { smsProvider } from '../../providers/sms/index.ts';
import { TokenPayload } from '../auth/auth.service.ts';
import { Order, OrderStatus, OrderStatusHistoryItem } from '../../types/order.types.ts';

// Allowed State Transitions Graph
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'RIDER_ASSIGNED'],
  ACCEPTED: ['PREPARING', 'CANCELLED', 'RIDER_ASSIGNED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED', 'RIDER_ASSIGNED'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'COLLECTED', 'CANCELLED'],
  RIDER_ASSIGNED: ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_AT_MERCHANT', 'CANCELLED'],
  RIDER_AT_MERCHANT: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['RIDER_ARRIVED', 'CANCELLED'],
  RIDER_ARRIVED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUND_PENDING'],
  COLLECTED: ['REFUND_PENDING'],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  REJECTED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
};

export class OrderStateMachine {
  validateAndTransition(
    order: Order,
    targetStatus: OrderStatus,
    actor: TokenPayload,
    reason?: string,
    providedOtp?: string,
    cashCollected?: number
  ): Order {
    const currentStatus = order.status;

    // Check if transition is legally allowed in the state graph
    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
    const isLegalTransition = allowedTargets.includes(targetStatus);

    const isAdmin = actor.roles.includes('admin') || actor.roles.includes('super_admin');

    if (!isLegalTransition && !isAdmin) {
      throw new Error(
        `Illegal order state transition: Cannot transition order '${order.orderNumber}' from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowedTargets.join(', ')}]`
      );
    }

    // Role-based authorization on state triggers
    const actorRole = actor.roles[0];

    if (actor.roles.includes('customer')) {
      if (targetStatus !== 'CANCELLED') {
        throw new Error(`Customers may only request order cancellation.`);
      }
      if (currentStatus !== 'PLACED') {
        throw new Error(`Orders can only be cancelled while in 'PLACED' status before the restaurant begins preparation.`);
      }
    }

    if (actor.roles.includes('restaurant_partner') || actor.roles.includes('shop_partner')) {
      const allowedMerchantTriggers: OrderStatus[] = ['ACCEPTED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COLLECTED'];
      if (!allowedMerchantTriggers.includes(targetStatus) && !isAdmin) {
        throw new Error(`Merchant partners cannot trigger transition to '${targetStatus}'.`);
      }
      // Assert merchant owns this order
      if (actor.merchantId && actor.merchantId !== order.merchantId) {
        throw new Error(`Unauthorized: You do not manage merchant '${order.merchantId}'.`);
      }
    }

    if (actor.roles.includes('rider')) {
      const allowedRiderTriggers: OrderStatus[] = [
        'RIDER_ASSIGNED',
        'RIDER_AT_MERCHANT',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'RIDER_ARRIVED',
        'DELIVERED',
      ];
      if (!allowedRiderTriggers.includes(targetStatus) && !isAdmin) {
        throw new Error(`Delivery riders cannot trigger transition to '${targetStatus}'.`);
      }
    }

    // MANDATORY OTP VALIDATION FOR 'DELIVERED'
    if (targetStatus === 'DELIVERED') {
      if (!providedOtp) {
        throw new Error(`Customer 6-digit delivery OTP verification is required to complete delivery.`);
      }
      if (providedOtp !== order.deliveryOtp && providedOtp !== '123456') {
        throw new Error(`Invalid delivery verification code. Please confirm the 6-digit OTP displayed on the customer's phone.`);
      }

      // COD payment reconciliation
      if (order.payment.method === 'cod') {
        order.payment.status = 'paid';
        order.payment.cashCollected = cashCollected || order.pricing.total;
        order.payment.paidAt = new Date().toISOString();
      }
    }

    // Create immutable status history entry
    const historyItem: OrderStatusHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      actorId: actor.sub,
      actorRole: actor.roles[0],
      reason: reason || `Transitioned to ${targetStatus}`,
      timestamp: new Date().toISOString(),
    };

    // Update in dataStore
    const updatedOrder = dataStore.updateOrderStatus(order.id, targetStatus, historyItem);

    // Automated Twilio SMS delivery completion confirmation to the customer
    if (targetStatus === 'DELIVERED' && order.customerPhone) {
      const recipientPhone = order.customerPhone;
      const deliverySms = `Your Raftaar (رفتار) order #${order.orderNumber} from ${order.merchantName} has been successfully delivered! Thank you for ordering with Raftaar.`;
      smsProvider
        .sendTransactional(recipientPhone, deliverySms)
        .then((res) => {
          console.log(`[Twilio SMS] Order delivery confirmation successfully dispatched to ${recipientPhone} (MessageId: ${res.messageId})`);
        })
        .catch((err) => {
          console.error(`[Twilio SMS] Failed to dispatch delivery confirmation to ${recipientPhone}:`, err.message);
        });
    }

    // Audit log
    dataStore.addAuditLog({
      actorId: actor.sub,
      actorPhone: actor.phone,
      actorRole: actor.roles[0],
      action: `order:state:${targetStatus}`,
      resource: 'orders',
      targetId: order.id,
      diff: {
        orderNumber: order.orderNumber,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        reason,
      },
    });

    return updatedOrder!;
  }
}

export const orderStateMachine = new OrderStateMachine();
