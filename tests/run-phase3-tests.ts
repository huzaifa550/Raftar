import { dataStore } from '../server/src/db/datastore.ts';
import { orderStateMachine } from '../server/src/modules/orders/order-state-machine.ts';
import { orderService } from '../server/src/modules/orders/order.service.ts';
import { pricingEngine } from '../server/src/modules/orders/pricing.engine.ts';

async function runPhase3Tests() {
  console.log('🧪 Starting Raftaar Phase 3 Automated Test Suite...\n');
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

  // 1. Single-Merchant Cart Rule
  console.log('--- 1. Single-Merchant Cart Enforcement ---');
  let mixedMerchantError = false;
  try {
    pricingEngine.calculateCart(
      'merch_student_biryani',
      [
        { itemId: 'item_sb_chicken_biryani', quantity: 1 },
        { itemId: 'item_kolachi_mutton_karahi', quantity: 1 }, // Belongs to Kolachi!
      ],
      undefined,
      'delivery'
    );
  } catch (err: any) {
    if (err.message.includes('Single-merchant violation')) mixedMerchantError = true;
  }
  assert(mixedMerchantError, 'Cart rejects items from multiple different merchants');

  // 2. Authoritative Pricing Engine Math
  console.log('\n--- 2. Authoritative Pricing Engine Calculation ---');
  // Student Biryani chicken biryani with Double Portion (+Rs. 250) + Zeera Raita (+Rs. 50)
  // Regular is Rs. 420 (discounted from 450). Double is +Rs. 250 -> unit Rs. 670. Raita is +Rs. 50 -> unit Rs. 720 (72000 paisas)
  const quote = pricingEngine.calculateCart(
    'merch_student_biryani',
    [
      {
        itemId: 'item_sb_chicken_biryani',
        quantity: 1,
        selectedOptionIds: ['opt_sb_double', 'opt_sb_raita'],
      },
    ],
    undefined,
    'delivery',
    24.825,
    67.034,
    5000 // Rs. 50 Tip
  );

  assert(quote.itemsSnapshot.length === 1, '1 item snapshot produced');
  assert(quote.itemsSnapshot[0].finalUnitPrice === 72000, 'Authoritative unit price is Rs. 720 (72000 paisas)');
  assert(quote.pricing.serviceFee === 2000, 'Platform service fee applied (Rs. 20)');
  assert(quote.pricing.tip === 5000, 'Customer tip added (Rs. 50)');

  // Verify formula: subtotal - discounts + delivery + serviceFee + tax + tip = total
  const calculatedTotal =
    quote.pricing.subtotal -
    quote.pricing.itemDiscount -
    quote.pricing.couponDiscount +
    quote.pricing.deliveryFee +
    quote.pricing.serviceFee +
    quote.pricing.tax +
    quote.pricing.tip;

  assert(quote.pricing.total === calculatedTotal, 'Total strictly matches exact arithmetic breakdown');

  // 3. Coupon Validation & Redemption Engine
  console.log('\n--- 3. Coupon Validation Engine ---');
  // RAFTAR50: 50% off up to Rs. 250 on min order Rs. 500
  const quoteWithCoupon = pricingEngine.calculateCart(
    'merch_student_biryani',
    [
      {
        itemId: 'item_sb_chicken_biryani',
        quantity: 2, // 2 x 420 = Rs. 840 (84000 paisas)
      },
    ],
    'RAFTAR50',
    'delivery',
    24.825,
    67.034
  );

  assert(quoteWithCoupon.pricing.couponDiscount === 25000, 'RAFTAR50 applies max discount cap of Rs. 250 (25000 paisas)');
  assert(quoteWithCoupon.pricing.couponCode === 'RAFTAR50', 'Coupon code attached to price breakdown');

  // Test Merchant Scope restriction: BIRYANI20 on Imtiaz Super Market must fail
  let invalidScopeError = false;
  try {
    pricingEngine.calculateCart(
      'merch_imtiaz',
      [{ itemId: 'prod_olpers_milk_1l', quantity: 3 }],
      'BIRYANI20',
      'delivery'
    );
  } catch (err: any) {
    if (err.message.includes('only valid for selected merchants')) invalidScopeError = true;
  }
  assert(invalidScopeError, 'Merchant-scoped coupon rejected on non-participating merchant');

  // 4. Order Creation & Snapshots
  console.log('\n--- 4. Order Creation & Snapshot Immutability ---');
  const demoCustomer = dataStore.findUserByPhone('+923001111111')!;
  const customerToken = {
    sub: demoCustomer.id,
    phone: demoCustomer.phone,
    roles: demoCustomer.roles,
  };

  const newOrder = await orderService.placeOrder(customerToken, {
    merchantId: 'merch_student_biryani',
    items: [
      {
        itemId: 'item_sb_chicken_biryani',
        quantity: 2,
        selectedOptionIds: ['opt_sb_reg', 'opt_sb_raita'],
      },
    ],
    fulfillmentMode: 'delivery',
    paymentMethod: 'cod',
    couponCode: 'RAFTAR50',
  });

  assert(Boolean(newOrder.orderNumber.startsWith('RFT-')), `Order number issued: ${newOrder.orderNumber}`);
  assert(newOrder.status === 'PLACED', 'Initial status is PLACED');
  assert(newOrder.deliveryOtp.length === 6, `6-digit Delivery OTP issued: ${newOrder.deliveryOtp}`);
  assert(newOrder.payment.method === 'cod', 'Payment method set to COD');
  assert(newOrder.payment.status === 'authorized', 'COD payment status is authorized on placement');
  assert(newOrder.items[0].name.includes('Chicken Biryani'), 'Item name snapshotted into order');

  // 5. Order State Machine Transitions
  console.log('\n--- 5. Order State Machine Transition Pipeline ---');
  const demoMerchant = dataStore.findUserByPhone('+923002222222')!;
  const merchantToken = {
    sub: demoMerchant.id,
    phone: demoMerchant.phone,
    roles: demoMerchant.roles,
    merchantId: 'merch_student_biryani',
  };

  const demoRider = dataStore.findUserByPhone('+923004444444')!;
  const riderToken = {
    sub: demoRider.id,
    phone: demoRider.phone,
    roles: demoRider.roles,
    riderId: 'rider_001',
  };

  // PLACED -> ACCEPTED
  const acceptedOrder = orderStateMachine.validateAndTransition(newOrder, 'ACCEPTED', merchantToken, 'Kitchen accepted');
  assert(acceptedOrder.status === 'ACCEPTED', 'Transitioned: PLACED -> ACCEPTED');

  // ACCEPTED -> PREPARING
  const prepOrder = orderStateMachine.validateAndTransition(acceptedOrder, 'PREPARING', merchantToken, 'Cooking biryani');
  assert(prepOrder.status === 'PREPARING', 'Transitioned: ACCEPTED -> PREPARING');

  // PREPARING -> READY_FOR_PICKUP
  const readyOrder = orderStateMachine.validateAndTransition(prepOrder, 'READY_FOR_PICKUP', merchantToken, 'Order packed & sealed');
  assert(readyOrder.status === 'READY_FOR_PICKUP', 'Transitioned: PREPARING -> READY_FOR_PICKUP');

  // READY_FOR_PICKUP -> RIDER_ASSIGNED
  const assignedOrder = orderStateMachine.validateAndTransition(readyOrder, 'RIDER_ASSIGNED', riderToken, 'Rider Bilal assigned');
  assert(assignedOrder.status === 'RIDER_ASSIGNED', 'Transitioned: READY_FOR_PICKUP -> RIDER_ASSIGNED');

  // RIDER_ASSIGNED -> RIDER_AT_MERCHANT -> PICKED_UP -> OUT_FOR_DELIVERY -> RIDER_ARRIVED
  const atMerchant = orderStateMachine.validateAndTransition(assignedOrder, 'RIDER_AT_MERCHANT', riderToken);
  const pickedUp = orderStateMachine.validateAndTransition(atMerchant, 'PICKED_UP', riderToken);
  const outForDelivery = orderStateMachine.validateAndTransition(pickedUp, 'OUT_FOR_DELIVERY', riderToken);
  const arrived = orderStateMachine.validateAndTransition(outForDelivery, 'RIDER_ARRIVED', riderToken);
  assert(arrived.status === 'RIDER_ARRIVED', 'Rider arrived at customer premises');

  // 6. Mandatory OTP Verification on DELIVERED
  console.log('\n--- 6. Delivery OTP & Payment Settlement ---');
  let wrongOtpError = false;
  try {
    orderStateMachine.validateAndTransition(arrived, 'DELIVERED', riderToken, 'Completed', '000000'); // Wrong OTP
  } catch (err: any) {
    if (err.message.includes('Invalid delivery verification code')) wrongOtpError = true;
  }
  assert(wrongOtpError, 'Delivery completion rejected with incorrect OTP');

  // Deliver with correct customer OTP
  const deliveredOrder = orderStateMachine.validateAndTransition(
    arrived,
    'DELIVERED',
    riderToken,
    'Customer confirmed with OTP',
    newOrder.deliveryOtp,
    newOrder.pricing.total
  );
  assert(deliveredOrder.status === 'DELIVERED', 'Order DELIVERED successfully with valid OTP');
  assert(deliveredOrder.payment.status === 'paid', 'COD payment marked as PAID upon OTP confirmation');
  assert(deliveredOrder.statusHistory.length >= 8, `Complete audit status history recorded (${deliveredOrder.statusHistory.length} events)`);

  // 7. Illegal Transition Guard
  console.log('\n--- 7. Illegal State Transition Defense ---');
  let illegalJumpError = false;
  try {
    // Attempting to jump a DELIVERED order back to PREPARING
    orderStateMachine.validateAndTransition(deliveredOrder, 'PREPARING', merchantToken);
  } catch (err: any) {
    if (err.message.includes('Illegal order state transition')) illegalJumpError = true;
  }
  assert(illegalJumpError, 'Illegal state transition blocked by state machine');

  // 8. IDOR Customer Access Boundary
  console.log('\n--- 8. IDOR Order Access Boundary ---');
  const otherCustomerToken = {
    sub: 'usr_stranger_999',
    phone: '+923009999999',
    roles: ['customer' as const],
  };

  let idorBlocked = false;
  try {
    orderService.getOrder(newOrder.id, otherCustomerToken);
  } catch (err: any) {
    if (err.message.includes('Access denied')) idorBlocked = true;
  }
  assert(idorBlocked, 'IDOR Protection: Customer cannot view orders of another customer');

  console.log(`\n🎉 All ${passed}/${total} Phase 3 tests passed successfully!`);
}

runPhase3Tests().catch((err) => {
  console.error('Phase 3 Test Suite Failed:', err);
  process.exit(1);
});
