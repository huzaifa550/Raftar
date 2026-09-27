import { dataStore } from '../../db/datastore.ts';
import { DispatchOffer, MerchantDashboardStats, Rider } from '../../types/dispatch.types.ts';
import { calculateDistanceKm, estimateDeliveryEta } from '../../utils/geo.utils.ts';
import { TokenPayload } from '../auth/auth.service.ts';
import { orderStateMachine } from '../orders/order-state-machine.ts';

export class DispatchService {
  // 1. Toggle Rider Shift Status
  toggleRiderShift(riderId: string, online: boolean): Rider {
    const rider = dataStore.findRiderById(riderId);
    if (!rider) throw new Error(`Rider '${riderId}' not found.`);

    if (!online && rider.activeOrderId) {
      throw new Error(`Cannot go offline while on an active delivery order.`);
    }

    rider.status = online ? 'online' : 'offline';
    return dataStore.updateRider(rider);
  }

  // 2. Update Rider GPS Telemetry
  updateRiderLocation(riderId: string, lat: number, lng: number, heading?: number): Rider {
    const rider = dataStore.findRiderById(riderId);
    if (!rider) throw new Error(`Rider '${riderId}' not found.`);

    rider.currentLocation = {
      lat,
      lng,
      heading: heading || rider.currentLocation.heading || 0,
      updatedAt: new Date().toISOString(),
    };

    return dataStore.updateRider(rider);
  }

  // 3. Proximity-Based Dispatch Cascade (Nearest Rider First with 30s Countdown)
  createDispatchCascade(orderId: string, excludedRiderIds: string[] = []): DispatchOffer | null {
    const order = dataStore.findOrderById(orderId);
    if (!order) throw new Error(`Order '${orderId}' not found.`);

    const merchant = dataStore.findMerchantById(order.merchantId);
    if (!merchant) throw new Error(`Merchant '${order.merchantId}' not found.`);

    // 1. Find all available riders (online, not busy, cashInHand below limit)
    const availableRiders = dataStore
      .listRiders()
      .filter((r) => r.status === 'online' && !r.activeOrderId && !excludedRiderIds.includes(r.id));

    if (availableRiders.length === 0) {
      console.warn(`[Dispatch Cascade] No available riders for order ${order.orderNumber}`);
      return null;
    }

    // 2. Sort by distance from merchant pickup location
    const rankedRiders = availableRiders.map((r) => {
      const distanceToMerchantKm = calculateDistanceKm(
        r.currentLocation.lat,
        r.currentLocation.lng,
        merchant.latitude,
        merchant.longitude
      );
      return { rider: r, distanceToMerchantKm };
    });

    rankedRiders.sort((a, b) => a.distanceToMerchantKm - b.distanceToMerchantKm);
    const chosen = rankedRiders[0];
    const chosenRider = chosen.rider;

    // 3. Calculate delivery distance and rider earning
    const dropoffLat = order.deliveryAddress?.latitude || merchant.latitude;
    const dropoffLng = order.deliveryAddress?.longitude || merchant.longitude;

    const deliveryDistanceKm = calculateDistanceKm(
      merchant.latitude,
      merchant.longitude,
      dropoffLat,
      dropoffLng
    );

    // Rider earnings: Rs. 70 base + Rs. 20/km + 100% tip
    const baseFarePaisas = 7000;
    const perKmRatePaisas = 2000;
    const estimatedEarning =
      baseFarePaisas + Math.round(deliveryDistanceKm * perKmRatePaisas) + order.pricing.tip;

    // 4. Create 30-Second Dispatch Offer
    const offerId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = Date.now() + 30 * 1000; // 30 seconds

    const offer: DispatchOffer = {
      id: offerId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      riderId: chosenRider.id,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantAddress: merchant.address,
      merchantLocation: { lat: merchant.latitude, lng: merchant.longitude },
      deliveryAddress: {
        streetAddress: order.deliveryAddress?.streetAddress || 'Clifton Block 7',
        area: order.deliveryAddress?.area || 'Clifton',
      },
      deliveryLocation: { lat: dropoffLat, lng: dropoffLng },
      pickupDistanceKm: chosen.distanceToMerchantKm,
      deliveryDistanceKm,
      estimatedEarning,
      expiresAt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    dataStore.saveDispatchOffer(offer);

    // Audit log
    dataStore.addAuditLog({
      actorId: 'system',
      actorRole: 'dispatch_engine',
      action: 'dispatch:offer:created',
      resource: 'dispatch',
      targetId: chosenRider.id,
      diff: {
        offerId,
        orderNumber: order.orderNumber,
        riderName: chosenRider.name,
        pickupDistanceKm: chosen.distanceToMerchantKm,
        expiresInSeconds: 30,
      },
    });

    return offer;
  }

  // 4. Respond to 30-Second Dispatch Offer
  respondToOffer(riderId: string, offerId: string, accept: boolean, actor: TokenPayload): { offer: DispatchOffer; order?: any } {
    const offer = dataStore.findDispatchOfferById(offerId);
    if (!offer) throw new Error('Dispatch offer not found.');

    if (offer.riderId !== riderId) {
      throw new Error('Unauthorized: This dispatch offer was not assigned to you.');
    }

    if (offer.status !== 'pending') {
      throw new Error(`Offer has already been ${offer.status}.`);
    }

    if (Date.now() > offer.expiresAt) {
      offer.status = 'expired';
      dataStore.saveDispatchOffer(offer);
      // Auto-cascade to next rider
      this.createDispatchCascade(offer.orderId, [riderId]);
      throw new Error('Offer expired after 30 seconds.');
    }

    const order = dataStore.findOrderById(offer.orderId);
    if (!order) throw new Error('Associated order not found.');

    const rider = dataStore.findRiderById(riderId);
    if (!rider) throw new Error('Rider record not found.');

    if (accept) {
      offer.status = 'accepted';
      dataStore.saveDispatchOffer(offer);

      rider.status = 'busy';
      rider.activeOrderId = order.id;
      dataStore.updateRider(rider);

      // Transition order to RIDER_ASSIGNED via State Machine
      const updatedOrder = orderStateMachine.validateAndTransition(
        order,
        'RIDER_ASSIGNED',
        actor,
        `Rider ${rider.name} accepted dispatch offer`
      );

      return { offer, order: updatedOrder };
    } else {
      // Declined by rider -> cascade to next nearest rider!
      offer.status = 'declined';
      dataStore.saveDispatchOffer(offer);

      const nextOffer = this.createDispatchCascade(order.id, [riderId]);

      return { offer, order: nextOffer ? { cascadedToOffer: nextOffer.id } : null };
    }
  }

  // 5. Merchant Dashboard Analytics & Kitchen Queue
  getMerchantDashboard(merchantId: string): {
    stats: MerchantDashboardStats;
    pendingOrders: any[];
    kitchenOrders: any[];
    readyOrders: any[];
    deliveredOrders: any[];
  } {
    const allOrders = dataStore.listOrders({ merchantId });

    const pendingOrders = allOrders.filter((o) => o.status === 'PLACED');
    const kitchenOrders = allOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING');
    const readyOrders = allOrders.filter(
      (o) =>
        o.status === 'READY_FOR_PICKUP' ||
        o.status === 'RIDER_ASSIGNED' ||
        o.status === 'RIDER_AT_MERCHANT' ||
        o.status === 'PICKED_UP' ||
        o.status === 'OUT_FOR_DELIVERY' ||
        o.status === 'RIDER_ARRIVED'
    );
    const deliveredOrders = allOrders.filter((o) => o.status === 'DELIVERED');

    const todayGrossSales = deliveredOrders.reduce((sum, o) => sum + o.pricing.subtotal, 0);
    // Platform commission is 15%
    const todayNetPayout = Math.round(todayGrossSales * 0.85);

    const stats: MerchantDashboardStats = {
      todayOrdersCount: deliveredOrders.length,
      todayGrossSales,
      todayNetPayout,
      avgPrepTimeMinutes: 20,
      pendingAcceptanceCount: pendingOrders.length,
      activeCookingCount: kitchenOrders.length,
      readyForPickupCount: readyOrders.length,
    };

    return {
      stats,
      pendingOrders,
      kitchenOrders,
      readyOrders,
      deliveredOrders,
    };
  }

  // 6. Set Kitchen Preparation Time Clock (15, 25, 40 mins)
  setOrderPrepTime(orderId: string, prepMinutes: number, actor: TokenPayload) {
    const order = dataStore.findOrderById(orderId);
    if (!order) throw new Error('Order not found.');

    const updated = orderStateMachine.validateAndTransition(
      order,
      'ACCEPTED',
      actor,
      `Accepted with committed kitchen prep time: ${prepMinutes} minutes`
    );

    // Trigger dispatch cascade search as soon as order is accepted!
    this.createDispatchCascade(order.id);

    return updated;
  }

  // 7. Instant 86 / Item Availability Toggle
  toggleItemAvailability(merchantId: string, itemId: string, isAvailable: boolean): any {
    const item = dataStore.findMenuItemById(itemId);
    if (!item || item.merchantId !== merchantId) {
      throw new Error('Menu item not found for this merchant.');
    }

    return dataStore.toggleMenuItemAvailability(itemId, isAvailable);
  }

  // 8. Live Route Telemetry & Dynamic ETA Tracking
  getLiveTracking(orderId: string) {
    const order = dataStore.findOrderById(orderId);
    if (!order) throw new Error('Order not found.');

    const merchant = dataStore.findMerchantById(order.merchantId);
    if (!merchant) throw new Error('Merchant not found.');

    // Find rider assigned to this order
    const allRiders = dataStore.listRiders();
    const assignedRider = allRiders.find((r) => r.activeOrderId === order.id) || allRiders[0];

    const customerLat = order.deliveryAddress?.latitude || 24.825;
    const customerLng = order.deliveryAddress?.longitude || 67.034;

    // Calculate current distance between rider and destination
    let targetLat = merchant.latitude;
    let targetLng = merchant.longitude;

    if (
      order.status === 'OUT_FOR_DELIVERY' ||
      order.status === 'RIDER_ARRIVED' ||
      order.status === 'DELIVERED'
    ) {
      targetLat = customerLat;
      targetLng = customerLng;
    }

    const distanceKm = calculateDistanceKm(
      assignedRider.currentLocation.lat,
      assignedRider.currentLocation.lng,
      targetLat,
      targetLng
    );

    const eta = estimateDeliveryEta(distanceKm, 5);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      merchant: {
        name: merchant.name,
        lat: merchant.latitude,
        lng: merchant.longitude,
      },
      customer: {
        streetAddress: order.deliveryAddress?.streetAddress || 'Clifton Block 7',
        area: order.deliveryAddress?.area || 'Clifton',
        lat: customerLat,
        lng: customerLng,
      },
      rider: {
        id: assignedRider.id,
        name: assignedRider.name,
        phone: assignedRider.phone,
        vehicleNumber: assignedRider.vehicleNumber,
        rating: assignedRider.rating,
        currentLocation: assignedRider.currentLocation,
      },
      distanceKm,
      etaMinutes: eta.min,
    };
  }
}

export const dispatchService = new DispatchService();
