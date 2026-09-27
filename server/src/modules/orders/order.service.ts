import { dataStore } from '../../db/datastore.ts';
import { paymentProvider } from '../../providers/payments/index.ts';
import { TokenPayload } from '../auth/auth.service.ts';
import {
  CartItemInput,
  FulfillmentMode,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../../types/order.types.ts';
import { orderStateMachine } from './order-state-machine.ts';
import { pricingEngine } from './pricing.engine.ts';

export interface CreateOrderInput {
  merchantId: string;
  items: CartItemInput[];
  fulfillmentMode: FulfillmentMode;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  addressId?: string;
  scheduledFor?: string;
  tipAmount?: number;
  customerNote?: string;
}

export class OrderService {
  // 1. Recompute and price cart quote
  quoteCart(
    merchantId: string,
    items: CartItemInput[],
    couponCode?: string,
    fulfillmentMode: FulfillmentMode = 'delivery',
    lat?: number,
    lng?: number,
    tip = 0
  ) {
    return pricingEngine.calculateCart(merchantId, items, couponCode, fulfillmentMode, lat, lng, tip);
  }

  // 2. Validate Coupon
  validateCoupon(code: string, merchantId: string, subtotal: number) {
    const coupon = dataStore.findCouponByCode(code);
    if (!coupon) {
      throw new Error(`Coupon '${code}' is invalid.`);
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      throw new Error(`Coupon '${code}' has expired.`);
    }
    if (coupon.timesUsed >= coupon.usageLimit) {
      throw new Error(`Coupon '${code}' has exceeded redemption limit.`);
    }
    if (coupon.merchantId && coupon.merchantId !== merchantId) {
      throw new Error(`Coupon '${code}' is not applicable to this merchant.`);
    }
    if (subtotal < coupon.minOrderAmount) {
      throw new Error(`Minimum order of Rs. ${Math.round(coupon.minOrderAmount / 100)} required.`);
    }

    let estimatedDiscount = 0;
    if (coupon.type === 'percentage') {
      const raw = Math.round(subtotal * (coupon.discountValue / 100));
      estimatedDiscount = coupon.maxDiscountAmount ? Math.min(raw, coupon.maxDiscountAmount) : raw;
    } else if (coupon.type === 'fixed') {
      estimatedDiscount = Math.min(coupon.discountValue, subtotal);
    } else {
      estimatedDiscount = 6000; // Free delivery estimated discount
    }

    return {
      valid: true,
      coupon,
      estimatedDiscount,
      message: `Coupon '${coupon.code}' applied successfully!`,
    };
  }

  // 3. Create Order
  async placeOrder(actor: TokenPayload, input: CreateOrderInput) {
    const user = dataStore.findUserById(actor.sub);
    if (!user) throw new Error('Customer profile not found');

    const merchant = dataStore.findMerchantById(input.merchantId);
    if (!merchant) throw new Error(`Merchant '${input.merchantId}' not found.`);

    if (!merchant.isOpen) {
      throw new Error(`${merchant.name} is currently closed.`);
    }

    // Resolve Delivery Address
    let deliveryAddressSnapshot = undefined;
    let customerLat = undefined;
    let customerLng = undefined;

    if (input.fulfillmentMode === 'delivery') {
      if (input.addressId) {
        const addr = dataStore.addresses.get(input.addressId);
        if (addr) {
          deliveryAddressSnapshot = {
            streetAddress: addr.streetAddress,
            area: addr.area,
            city: addr.city,
            landmark: addr.landmark,
            instructions: addr.deliveryInstructions,
            latitude: addr.latitude,
            longitude: addr.longitude,
          };
          customerLat = addr.latitude;
          customerLng = addr.longitude;
        }
      }

      if (!deliveryAddressSnapshot) {
        // Fallback default address in Karachi
        deliveryAddressSnapshot = {
          streetAddress: 'Default Delivery Point, Clifton Block 7',
          area: 'Clifton',
          city: 'Karachi',
          instructions: input.customerNote,
          latitude: 24.825,
          longitude: 67.034,
        };
        customerLat = 24.825;
        customerLng = 67.034;
      }
    }

    // 1. Authoritative Pricing Calculation on Server
    const pricedCart = pricingEngine.calculateCart(
      input.merchantId,
      input.items,
      input.couponCode,
      input.fulfillmentMode,
      customerLat,
      customerLng,
      input.tipAmount || 0
    );

    // 2. Generate unique order attributes
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = `RFT-${Math.floor(10000 + Math.random() * 90000)}`;
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const pickupPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits

    // 3. Process Initial Payment via Provider Adapter
    const paymentResult = await paymentProvider.processPayment({
      orderId,
      orderNumber,
      amount: pricedCart.pricing.total,
      method: input.paymentMethod,
      customerPhone: user.phone,
      customerEmail: user.email,
    });

    if (!paymentResult.success) {
      throw new Error(`Payment authorization failed: ${paymentResult.message}`);
    }

    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantType: merchant.type,
      merchantPhone: merchant.phone,
      fulfillmentMode: input.fulfillmentMode,
      status: 'PLACED',
      items: pricedCart.itemsSnapshot,
      pricing: pricedCart.pricing,
      deliveryAddress: deliveryAddressSnapshot,
      deliveryOtp,
      pickupPin: input.fulfillmentMode === 'pickup' ? pickupPin : undefined,
      scheduledFor: input.scheduledFor,
      payment: {
        id: `pay_${Date.now()}`,
        orderId,
        method: input.paymentMethod,
        status: paymentResult.status,
        amount: pricedCart.pricing.total,
        transactionRef: paymentResult.transactionRef,
        provider: paymentResult.provider,
        paidAt: paymentResult.status === 'paid' ? now : undefined,
      },
      statusHistory: [
        {
          id: `hist_init_${orderId}`,
          fromStatus: null,
          toStatus: 'PLACED',
          actorId: user.id,
          actorRole: 'customer',
          reason: 'Order placed by customer at checkout',
          timestamp: now,
        },
      ],
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    };

    // Save in DataStore
    dataStore.saveOrder(newOrder);

    // Atomically increment coupon usage if used
    if (pricedCart.couponApplied) {
      dataStore.incrementCouponUsage(pricedCart.couponApplied.code);
    }

    // Deduct inventory for shop products
    if (merchant.type === 'shop') {
      input.items.forEach((item) => {
        const prod = dataStore.findProductById(item.itemId);
        if (prod) {
          const newQty = Math.max(0, prod.stockQuantity - item.quantity);
          dataStore.updateProductStock(prod.id, newQty);
        }
      });
    }

    // Audit log
    dataStore.addAuditLog({
      actorId: user.id,
      actorPhone: user.phone,
      actorRole: 'customer',
      action: 'order:create',
      resource: 'orders',
      targetId: newOrder.id,
      diff: {
        orderNumber: newOrder.orderNumber,
        merchantId: newOrder.merchantId,
        total: newOrder.pricing.total,
        itemsCount: newOrder.items.length,
      },
    });

    return newOrder;
  }

  // 4. Get Order with Tenant Access Control
  getOrder(orderId: string, actor: TokenPayload): Order {
    const order = dataStore.findOrderById(orderId) || dataStore.findOrderByNumber(orderId);
    if (!order) {
      throw new Error(`Order '${orderId}' not found.`);
    }

    const isAdmin = actor.roles.includes('admin') || actor.roles.includes('super_admin') || actor.roles.includes('support_staff');
    if (!isAdmin) {
      if (actor.roles.includes('customer') && order.customerId !== actor.sub) {
        throw new Error('Access denied: You cannot view orders belonging to other customers (IDOR protection).');
      }
      if (actor.roles.includes('restaurant_partner') || actor.roles.includes('shop_partner')) {
        if (actor.merchantId && actor.merchantId !== order.merchantId) {
          throw new Error('Access denied: You cannot view orders belonging to other merchants.');
        }
      }
    }

    return order;
  }

  // 5. List Orders (Customer own orders, or Merchant orders, or Admin all)
  listOrders(actor: TokenPayload, statusFilter?: OrderStatus): Order[] {
    if (!actor) return [];
    const roles = Array.isArray(actor.roles) ? actor.roles : [];
    const isAdmin =
      roles.includes('admin') ||
      roles.includes('super_admin') ||
      roles.includes('support_staff') ||
      roles.includes('finance_staff');

    if (isAdmin) {
      return dataStore.listOrders({ status: statusFilter });
    }

    if (roles.includes('restaurant_partner') || roles.includes('shop_partner')) {
      const merchantId = actor.merchantId || 'merch_student_biryani';
      return dataStore.listOrders({ merchantId, status: statusFilter });
    }

    if (roles.includes('rider')) {
      const rider = dataStore.findRiderByUserId(actor.sub);
      if (rider && rider.activeOrderId) {
        const order = dataStore.findOrderById(rider.activeOrderId);
        return order ? [order] : [];
      }
      return [];
    }

    // Default: Customer's own orders
    return dataStore.listOrders({ customerId: actor.sub, status: statusFilter });
  }

  // 6. Transition Order Status
  transitionStatus(
    orderId: string,
    targetStatus: OrderStatus,
    actor: TokenPayload,
    reason?: string,
    otp?: string,
    cashCollected?: number
  ): Order {
    const order = this.getOrder(orderId, actor);
    return orderStateMachine.validateAndTransition(order, targetStatus, actor, reason, otp, cashCollected);
  }
}

export const orderService = new OrderService();
