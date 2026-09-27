import { dataStore } from '../server/src/db/datastore.ts';
import { dispatchService } from '../server/src/modules/dispatch/dispatch.service.ts';
import { orderService } from '../server/src/modules/orders/order.service.ts';

async function runPhase4Tests() {
  console.log('🧪 Starting Raftaar Phase 4 Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test Failed: ${testName}`);
    }
  }

  // 1. Rider Shift Operations
  console.log('--- 1. Rider Shift Online / Offline Management ---');
  const rider1 = dataStore.findRiderById('rider_001')!;
  assert(rider1.status === 'online', 'Initial status of Rider Bilal is online');

  const offlineRider = dispatchService.toggleRiderShift('rider_001', false);
  assert(offlineRider.status === 'offline', 'Rider Bilal successfully toggled to offline');

  const onlineRider = dispatchService.toggleRiderShift('rider_001', true);
  assert(onlineRider.status === 'online', 'Rider Bilal back online');

  // GPS Telemetry
  const updatedRiderLoc = dispatchService.updateRiderLocation('rider_001', 24.825, 67.034, 120);
  assert(updatedRiderLoc.currentLocation.lat === 24.825, 'GPS telemetry coordinates updated');

  // 2. Proximity-Based Dispatch Cascade
  console.log('\n--- 2. Proximity-Based Dispatch Cascade ---');
  const demoCustomer = dataStore.findUserByPhone('+923001111111')!;
  const customerToken = {
    sub: demoCustomer.id,
    phone: demoCustomer.phone,
    roles: demoCustomer.roles,
  };

  // Place a test order at Student Biryani (Saddar / Clifton)
  const testOrder = await orderService.placeOrder(customerToken, {
    merchantId: 'merch_student_biryani',
    items: [{ itemId: 'item_sb_chicken_biryani', quantity: 2 }],
    fulfillmentMode: 'delivery',
    paymentMethod: 'cod',
  });

  const offer = dispatchService.createDispatchCascade(testOrder.id);
  assert(Boolean(offer), 'Dispatch cascade successfully generated an offer');
  assert(offer!.status === 'pending', 'Dispatch offer status is pending');
  assert(offer!.expiresAt > Date.now(), 'Offer has a valid future 30-second expiry timestamp');
  assert(offer!.riderId === 'rider_001', 'Nearest rider (Bilal Ahmed in Clifton) selected first');
  assert(offer!.estimatedEarning >= 7000, `Rider estimated earning computed: Rs. ${offer!.estimatedEarning / 100}`);

  // 3. 30-Second Offer Decline & Auto-Cascade to Next Rider
  console.log('\n--- 3. Offer Decline & Auto-Cascade to Next Nearest Rider ---');
  const demoRider1User = dataStore.findUserByPhone('+923004444444')!;
  const rider1Token = {
    sub: demoRider1User.id,
    phone: demoRider1User.phone,
    roles: demoRider1User.roles,
  };

  // Rider 1 declines offer
  const declineResult = dispatchService.respondToOffer('rider_001', offer!.id, false, rider1Token);
  assert(declineResult.offer.status === 'declined', 'Offer 1 marked as declined by Rider 1');

  // Check next offer cascaded to Rider 2 (Tariq Mehmood in Saddar)
  const nextOffer = dataStore.findActiveOfferForRider('rider_002');
  assert(Boolean(nextOffer), 'Offer automatically cascaded to next nearest available rider (Rider 2)');
  assert(nextOffer!.riderId === 'rider_002', 'Next candidate is Tariq Mehmood (rider_002)');

  // 4. Rider Offer Acceptance & Assignment
  console.log('\n--- 4. Rider Offer Acceptance & State Assignment ---');
  const demoRider2User = dataStore.findUserByPhone('+923005555555')!;
  const rider2Token = {
    sub: demoRider2User.id,
    phone: demoRider2User.phone,
    roles: demoRider2User.roles,
  };

  const acceptResult = dispatchService.respondToOffer('rider_002', nextOffer!.id, true, rider2Token);
  assert(acceptResult.offer.status === 'accepted', 'Offer accepted by Rider 2');

  const rider2 = dataStore.findRiderById('rider_002')!;
  assert(rider2.status === 'busy', 'Rider status shifted to busy');
  assert(rider2.activeOrderId === testOrder.id, 'Rider activeOrderId linked');

  const refreshedOrder = dataStore.findOrderById(testOrder.id)!;
  assert(refreshedOrder.status === 'RIDER_ASSIGNED', 'Order state machine transitioned to RIDER_ASSIGNED');

  // 5. Merchant Dashboard Analytics & Kitchen Queue
  console.log('\n--- 5. Merchant Kitchen Dashboard & Analytics ---');
  const dashboard = dispatchService.getMerchantDashboard('merch_student_biryani');
  assert(dashboard.stats.avgPrepTimeMinutes === 20, 'Average kitchen prep time tracked');
  assert(dashboard.readyOrders.length >= 1, 'Assigned active order visible in kitchen ready queue');

  // 6. Kitchen Prep Time Clock Acceptance (15, 25, 40 mins)
  console.log('\n--- 6. Kitchen Prep Time Clock Setting ---');
  const demoMerchantUser = dataStore.findUserByPhone('+923002222222')!;
  const merchantToken = {
    sub: demoMerchantUser.id,
    phone: demoMerchantUser.phone,
    roles: demoMerchantUser.roles,
    merchantId: 'merch_student_biryani',
  };

  // Place another order to test prep clock acceptance
  const prepTestOrder = await orderService.placeOrder(customerToken, {
    merchantId: 'merch_student_biryani',
    items: [{ itemId: 'item_sb_chicken_biryani', quantity: 2 }],
    fulfillmentMode: 'delivery',
    paymentMethod: 'cod',
  });

  const acceptedOrder = dispatchService.setOrderPrepTime(prepTestOrder.id, 25, merchantToken);
  assert(acceptedOrder.status === 'ACCEPTED', 'Order transitioned to ACCEPTED with prep time');
  assert(
    Boolean(acceptedOrder.statusHistory[acceptedOrder.statusHistory.length - 1].reason?.includes('25 minutes')),
    'Committed kitchen prep clock of 25 minutes logged into history'
  );

  // 7. Instant 86 / Menu Item Availability Toggle
  console.log('\n--- 7. Instant 86 / Menu Item Out-of-Stock Toggle ---');
  const toggledOff = dispatchService.toggleItemAvailability('merch_student_biryani', 'item_sb_chicken_biryani', false);
  assert(toggledOff.isAvailable === false, 'Special Chicken Biryani successfully 86ed (marked sold out)');

  const toggledOn = dispatchService.toggleItemAvailability('merch_student_biryani', 'item_sb_chicken_biryani', true);
  assert(toggledOn.isAvailable === true, 'Special Chicken Biryani toggled back to available');

  // 8. Live Route Telemetry & Tracking
  console.log('\n--- 8. Live Route Telemetry & Tracking ---');
  const tracking = dispatchService.getLiveTracking(testOrder.id);
  assert(Boolean(tracking.merchant.name), 'Merchant location present');
  assert(Boolean(tracking.customer.streetAddress), 'Customer drop-off address present');
  assert(Boolean(tracking.rider.vehicleNumber), 'Rider vehicle number and telemetry present');
  assert(tracking.distanceKm >= 0, `Live distance: ${tracking.distanceKm} km`);
  assert(tracking.etaMinutes > 0, `Dynamic ETA: ${tracking.etaMinutes} mins`);

  console.log(`\n🎉 All ${passed}/${total} Phase 4 tests passed successfully!`);
}

runPhase4Tests().catch((err) => {
  console.error('Phase 4 Test Suite Failed:', err);
  process.exit(1);
});
