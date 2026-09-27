import { Request, Response, Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.ts';
import { dataStore } from '../../db/datastore.ts';
import { dispatchService } from './dispatch.service.ts';

const router = Router();

// 0. List All Riders (Platform-wide rider overview for Admin / Dispatch)
router.get('/riders', (_req: Request, res: Response) => {
  const riders = dataStore.listRiders();
  return res.status(200).json({
    success: true,
    data: riders,
    meta: {
      count: riders.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// 1. Get Current Rider Profile & Shift Metrics
router.get('/riders/me', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  let rider = dataStore.findRiderByUserId(actor.sub);

  if (!rider) {
    // Default to Bilal Ahmed demo rider if testing with customer/admin
    rider = dataStore.findRiderById('rider_001')!;
  }

  const activeOffer = dataStore.findActiveOfferForRider(rider.id);
  const activeOrder = rider.activeOrderId ? dataStore.findOrderById(rider.activeOrderId) : null;

  return res.status(200).json({
    success: true,
    data: {
      rider,
      activeOffer,
      activeOrder,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// 2. Toggle Rider Shift (Online / Offline)
router.post('/riders/shift', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { online, riderId } = req.body;

  let targetRiderId = riderId;
  if (!targetRiderId) {
    const rider = dataStore.findRiderByUserId(actor.sub);
    targetRiderId = rider ? rider.id : 'rider_001';
  }

  try {
    const updatedRider = dispatchService.toggleRiderShift(targetRiderId, Boolean(online));
    return res.status(200).json({
      success: true,
      message: `Rider shift set to ${updatedRider.status}`,
      data: updatedRider,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SHIFT_UPDATE_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 3. Update Rider GPS Telemetry
router.post('/riders/location', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { lat, lng, heading, riderId } = req.body;

  let targetRiderId = riderId;
  if (!targetRiderId) {
    const rider = dataStore.findRiderByUserId(actor.sub);
    targetRiderId = rider ? rider.id : 'rider_001';
  }

  try {
    const updated = dispatchService.updateRiderLocation(
      targetRiderId,
      parseFloat(lat),
      parseFloat(lng),
      heading ? parseFloat(heading) : undefined
    );
    return res.status(200).json({
      success: true,
      data: updated.currentLocation,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'LOCATION_UPDATE_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 4. Get Active Timed Dispatch Offer
router.get('/offers/active', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  let rider = dataStore.findRiderByUserId(actor.sub);
  if (!rider) rider = dataStore.findRiderById('rider_001')!;

  const offer = dataStore.findActiveOfferForRider(rider.id);
  const remainingSeconds = offer ? Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000)) : 0;

  return res.status(200).json({
    success: true,
    data: offer ? { ...offer, remainingSeconds } : null,
  });
});

// 5. Respond to 30-Second Dispatch Offer (Accept or Decline)
router.post('/offers/:id/respond', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const offerId = req.params.id;
  const { accept, riderId } = req.body;

  let targetRiderId = riderId;
  if (!targetRiderId) {
    const rider = dataStore.findRiderByUserId(actor.sub);
    targetRiderId = rider ? rider.id : 'rider_001';
  }

  try {
    const result = dispatchService.respondToOffer(targetRiderId, offerId, Boolean(accept), actor);
    return res.status(200).json({
      success: true,
      message: accept ? 'Dispatch offer accepted!' : 'Offer declined. Cascaded to next available rider.',
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'OFFER_RESPONSE_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 6. Merchant Dashboard & Kitchen Queue
router.get('/merchant/dashboard', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const merchantId = (req.query.merchantId as string) || actor.merchantId || 'merch_student_biryani';

  const dashboard = dispatchService.getMerchantDashboard(merchantId);
  return res.status(200).json({
    success: true,
    data: dashboard,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// 7. Merchant Accept Order with Prep Time Clock
router.post('/merchant/prep-time', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { orderId, prepMinutes } = req.body;

  if (!orderId || !prepMinutes) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'orderId and prepMinutes are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const updatedOrder = dispatchService.setOrderPrepTime(orderId, parseInt(prepMinutes, 10), actor);
    return res.status(200).json({
      success: true,
      message: `Order accepted with ${prepMinutes} mins prep clock. Dispatch search initiated!`,
      data: updatedOrder,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PREP_TIME_SET_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 8. Instant 86 / Menu Item Availability Toggle
router.patch('/merchant/menu-item/:id/availability', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const itemId = req.params.id;
  const { isAvailable, merchantId } = req.body;

  const targetMerchantId = merchantId || actor.merchantId || 'merch_student_biryani';

  try {
    const updated = dispatchService.toggleItemAvailability(targetMerchantId, itemId, Boolean(isAvailable));
    return res.status(200).json({
      success: true,
      message: `Item ${updated.name} availability toggled to: ${isAvailable ? 'AVAILABLE' : '86 / SOLD OUT'}`,
      data: updated,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ITEM_TOGGLE_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 9. Live Tracking Telemetry
router.get('/orders/:id/live-tracking', (req: Request, res: Response) => {
  const orderId = req.params.id;
  try {
    const tracking = dispatchService.getLiveTracking(orderId);
    return res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'TRACKING_NOT_FOUND',
        message: err.message,
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 10. Manual Dispatch Cascade Trigger (for tests and dev testing)
router.post('/cascade/:orderId', requireAuth, (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  try {
    const offer = dispatchService.createDispatchCascade(orderId);
    return res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err.message },
    });
  }
});

// 11. Admin Manage Rider Parameters / Reset Cash in Hand
router.patch('/riders/:id', requireAuth, requirePermission('riders', 'manage'), (req: Request, res: Response) => {
  const riderId = req.params.id;
  const rider = dataStore.findRiderById(riderId);
  if (!rider) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Rider '${riderId}' not found.` },
    });
  }

  const { status, vehicleNumber, vehicleType, resetCashInHand, phone, name } = req.body;
  if (status !== undefined) rider.status = status;
  if (vehicleNumber !== undefined) rider.vehicleNumber = vehicleNumber;
  if (vehicleType !== undefined) rider.vehicleType = vehicleType;
  if (phone !== undefined) rider.phone = phone;
  if (name !== undefined) rider.name = name;
  if (resetCashInHand === true) rider.cashInHand = 0;

  const updated = dataStore.updateRider(rider);

  dataStore.addAuditLog({
    actorId: req.user!.sub,
    actorPhone: req.user!.phone,
    actorRole: req.user!.roles[0],
    action: `rider:admin_update:${status || 'modified'}`,
    resource: 'riders',
    targetId: rider.id,
    diff: req.body,
  });

  return res.status(200).json({
    success: true,
    message: `Rider ${rider.name} updated`,
    data: updated,
  });
});

// 12. Admin Onboard New Rider
router.post('/riders', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const {
    name,
    nameUrdu,
    phone,
    cnic,
    vehicleType = 'motorcycle',
    vehicleNumber,
    area = 'Clifton',
    maxCashLimit = 1500000,
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      error: { message: 'Rider full name and phone number are required' },
    });
  }

  const riderNum = Math.floor(100 + Math.random() * 900);
  const riderId = `rider_${Date.now()}_${riderNum}`;
  const userId = `usr_rider_${riderNum}`;

  // Establish base coordinates by assigned area
  const areaCoords: Record<string, { lat: number; lng: number }> = {
    Clifton: { lat: 24.826, lng: 67.032 },
    'DHA Phase 5': { lat: 24.81, lng: 67.05 },
    'Gulshan-e-Iqbal': { lat: 24.92, lng: 67.09 },
    Saddar: { lat: 24.854, lng: 67.018 },
    Bahadurabad: { lat: 24.88, lng: 67.07 },
    'North Nazimabad': { lat: 24.94, lng: 67.04 },
  };

  const loc = areaCoords[area] || { lat: 24.83, lng: 67.03 };

  // Create linked system user
  dataStore.createUser({
    phone,
    fullName: `${name} (Rider)`,
    email: `rider.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@raftaar.pk`,
    roles: ['rider'],
    status: 'active',
    isPhoneVerified: true,
    riderId,
    isDemo: false,
  });

  const newRider = {
    id: riderId,
    userId,
    name,
    nameUrdu: nameUrdu || name,
    phone,
    cnic: cnic || `42${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000000 + Math.random() * 9000000)}-1`,
    vehicleType: (vehicleType as any) || 'motorcycle',
    vehicleNumber: vehicleNumber || `KHI-${Math.floor(100 + Math.random() * 900)} (Honda CD70)`,
    status: 'online' as const,
    currentLocation: {
      lat: loc.lat + (Math.random() - 0.5) * 0.01,
      lng: loc.lng + (Math.random() - 0.5) * 0.01,
      heading: 90,
      updatedAt: new Date().toISOString(),
    },
    rating: 5.0,
    completedOrdersCount: 0,
    cashInHand: 0,
    maxCashLimit: Number(maxCashLimit) || 1500000,
    todayEarnings: 0,
    isDemo: false,
  };

  dataStore.createRider(newRider);

  dataStore.addAuditLog({
    actorId: actor.sub,
    actorPhone: actor.phone,
    actorRole: actor.roles?.[0] || 'super_admin',
    action: 'rider:onboard',
    resource: 'riders',
    targetId: newRider.id,
    diff: { name, phone, vehicleType, vehicleNumber, area },
  });

  return res.status(201).json({
    success: true,
    message: `Rider ${newRider.name} onboarded and active in dispatch fleet!`,
    data: newRider,
  });
});

// 13. Admin Decommission / Delete Rider
router.delete('/riders/:id', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const riderId = req.params.id;
  const rider = dataStore.findRiderById(riderId);

  if (!rider) {
    return res.status(404).json({
      success: false,
      error: { message: `Rider '${riderId}' not found` },
    });
  }

  dataStore.deleteRider(riderId);

  dataStore.addAuditLog({
    actorId: actor.sub,
    actorPhone: actor.phone,
    actorRole: actor.roles?.[0] || 'super_admin',
    action: 'rider:delete',
    resource: 'riders',
    targetId: riderId,
    diff: { deletedRiderName: rider.name },
  });

  return res.status(200).json({
    success: true,
    message: `Rider "${rider.name}" removed from dispatch fleet`,
    data: { id: riderId },
  });
});

export const dispatchRouter = router;
