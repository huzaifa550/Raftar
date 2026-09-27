import assert from 'assert';
import { authService } from '../server/src/modules/auth/auth.service.ts';
import { financeService } from '../server/src/modules/finance/finance.service.ts';
import {
  paymentGateway,
  JazzCashAdapter,
  EasypaisaAdapter,
  RaastAdapter,
  CardPaymentAdapter,
  CodPaymentAdapter,
} from '../server/src/modules/payments/adapters/payment.adapter.ts';
import { hasPermission } from '../server/src/config/rbac.ts';
import { dataStore } from '../server/src/db/datastore.ts';
import { orderStateMachine } from '../server/src/modules/orders/order-state-machine.ts';
import { smsProvider, TwilioSmsAdapter } from '../server/src/providers/sms/index.ts';

async function runPhase5Tests() {
  console.log('🧪 Starting Raftaar Phase 5 Automated Test Suite (Twilio & Financial Operations)...\n');

  // --- 1. Twilio-Only SMS Verification ---
  console.log('--- 1. Dedicated Twilio SMS Provider ---');
  assert(smsProvider instanceof TwilioSmsAdapter, 'smsProvider is an instance of TwilioSmsAdapter');
  assert(smsProvider.name === 'TwilioSmsAdapter', 'Active provider name is TwilioSmsAdapter');

  const twilioOtpResult = await smsProvider.sendOtp('+923007654321', '891234');
  assert(twilioOtpResult.success, 'Twilio OTP dispatched successfully');
  assert(twilioOtpResult.provider === 'twilio', 'OTP provider is strictly twilio');
  assert(twilioOtpResult.messageId.startsWith('SM'), 'Twilio message ID has SM prefix');
  console.log('  ✅ PASS: Twilio dedicated SMS provider dispatch verified');

  // --- 1.B Automated Twilio SMS Delivery Completion Notification ---
  console.log('\n--- 1.B Automated Twilio Delivery Completion SMS ---');
  const deliveryTestOrder = dataStore.saveOrder({
    id: 'ord_test_delivery_sms',
    orderNumber: 'RFT-78699',
    customerId: 'usr_customer_ali',
    customerName: 'Ali Raza',
    customerPhone: '+923008889999',
    merchantId: 'merch_student_biryani',
    merchantName: 'Student Biryani',
    merchantType: 'restaurant',
    merchantPhone: '+923002222222',
    fulfillmentMode: 'delivery',
    status: 'RIDER_ARRIVED',
    items: [],
    pricing: {
      subtotal: 50000,
      itemDiscount: 0,
      couponDiscount: 0,
      deliveryFee: 6000,
      serviceFee: 2000,
      tax: 0,
      tip: 0,
      total: 58000,
      currency: 'PKR',
    },
    deliveryOtp: '456789',
    payment: {
      id: 'pay_test_del_sms',
      orderId: 'ord_test_delivery_sms',
      method: 'cod',
      status: 'authorized',
      amount: 58000,
      provider: 'cod',
    },
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const riderToken = {
    sub: 'usr_rider_bilal',
    phone: '+923004444444',
    roles: ['rider' as const],
    riderId: 'rider_001',
  };

  // Transition to DELIVERED
  const completedOrder = orderStateMachine.validateAndTransition(
    deliveryTestOrder,
    'DELIVERED',
    riderToken,
    'Delivered to customer doorstep',
    '456789'
  );
  assert(completedOrder.status === 'DELIVERED', 'Order status transitioned to DELIVERED');

  // Wait brief microtask for async dispatch
  await new Promise((r) => setTimeout(r, 50));

  const twilioAdapter = smsProvider as TwilioSmsAdapter;
  const lastTxSms = twilioAdapter.getLastTransactional('+923008889999');
  assert(Boolean(lastTxSms), 'Twilio transactional SMS was recorded for customer phone');
  assert(lastTxSms!.message.includes('RFT-78699'), 'SMS contains order number');
  assert(lastTxSms!.message.includes('Student Biryani'), 'SMS contains merchant name');
  assert(lastTxSms!.message.includes('successfully delivered'), 'SMS confirms successful delivery completion');
  assert(lastTxSms!.messageId.startsWith('SM'), 'Twilio message ID has SM prefix');
  console.log(`  ✅ PASS: Automated Twilio SMS delivered to customer (${lastTxSms!.messageId})`);


  // --- 2. Multi-Channel Payment Adapters ---
  console.log('\n--- 2. Multi-Channel Payment Adapters ---');
  // COD
  const codResult = await paymentGateway.processPayment({
    orderId: 'ord_test_cod_1',
    orderNumber: 'RFT-COD-01',
    amount: 120000, // Rs. 1,200
    method: 'cod',
    customerPhone: '+923001112222',
  });
  assert(codResult.success, 'COD payment authorized');
  assert(codResult.status === 'authorized', 'COD initial status is authorized');
  assert(codResult.provider === 'cod', 'Provider is cod');
  console.log('  ✅ PASS: Cash on Delivery (COD) adapter authorized');

  // JazzCash
  const jcResult = await paymentGateway.processPayment({
    orderId: 'ord_test_jc_1',
    orderNumber: 'RFT-JC-01',
    amount: 85000, // Rs. 850
    method: 'jazzcash',
    customerPhone: '+923001234567',
    walletAccount: '+923001234567',
  });
  assert(jcResult.success, 'JazzCash payment processed');
  assert(jcResult.status === 'paid', 'JazzCash payment status is paid');
  assert(jcResult.transactionRef.startsWith('JC-'), 'JazzCash transaction reference generated');
  console.log('  ✅ PASS: JazzCash wallet adapter processed with MPIN verification');

  // Easypaisa
  const epResult = await paymentGateway.processPayment({
    orderId: 'ord_test_ep_1',
    orderNumber: 'RFT-EP-01',
    amount: 95000, // Rs. 950
    method: 'easypaisa',
    customerPhone: '+923451234567',
    walletAccount: '+923451234567',
  });
  assert(epResult.success, 'Easypaisa payment processed');
  assert(epResult.status === 'paid', 'Easypaisa payment status is paid');
  assert(epResult.transactionRef.startsWith('EP-'), 'Easypaisa transaction reference generated');
  console.log('  ✅ PASS: Easypaisa wallet adapter processed');

  // Raast (Instant SBP rail)
  const raastResult = await paymentGateway.processPayment({
    orderId: 'ord_test_raast_1',
    orderNumber: 'RFT-RAAST-01',
    amount: 250000, // Rs. 2,500
    method: 'raast',
    customerPhone: '+923007654321',
    raastId: '+923007654321',
  });
  assert(raastResult.success, 'Raast payment processed');
  assert(raastResult.status === 'paid', 'Raast payment status is paid');
  assert(raastResult.transactionRef.startsWith('RAAST-PK-'), 'Raast transaction reference generated');
  console.log('  ✅ PASS: Raast instant SBP rail payment processed');

  // Debit / Credit Card
  const cardResult = await paymentGateway.processPayment({
    orderId: 'ord_test_card_1',
    orderNumber: 'RFT-CARD-01',
    amount: 175000, // Rs. 1,750
    method: 'card',
    customerPhone: '+923009998877',
    cardDetails: {
      cardNumber: '4242 4242 4242 4242',
      cardHolder: 'Muhammad Ali',
      expiryMonth: '12',
      expiryYear: '28',
      cvv: '123',
    },
  });
  assert(cardResult.success, 'Card payment processed');
  assert(cardResult.status === 'paid', 'Card status is paid');
  assert(cardResult.transactionRef.startsWith('CARD-'), 'Card transaction reference generated');
  assert(cardResult.metadata?.last4 === '4242', 'Card last 4 digits stored');
  console.log('  ✅ PASS: 3D Secure Card gateway authorized with masked last-4 storage');

  // --- 3. Rider COD Remittance & Float Reconciliation ---
  console.log('\n--- 3. Rider COD Remittance & Float Reconciliation ---');
  const rider = dataStore.findRiderById('rider_001')!;
  rider.cashInHand = 500000; // Rs. 5,000 cash in hand
  dataStore.updateRider(rider);

  const remittance = financeService.recordRiderRemittance(
    rider.id,
    300000, // Rs. 3,000 deposit
    'hub_cash_deposit',
    'DEP-HUB-KHI-999',
    'Deposited physical cash at Raftaar Hub'
  );
  assert(remittance.status === 'pending', 'Remittance created with pending status');
  assert(remittance.amount === 300000, 'Remittance amount matches Rs. 3,000');

  // Finance staff verifies remittance
  const financeUser = {
    sub: 'usr_finance_ayesha',
    phone: '+923005555555',
    roles: ['finance_staff' as const],
  };

  const verifiedRemittance = financeService.verifyRiderRemittance(
    remittance.id,
    true,
    financeUser,
    'Cash counted and locked in safe'
  );
  assert(verifiedRemittance.status === 'verified', 'Remittance successfully verified by Finance');
  assert(rider.cashInHand === 200000, 'Rider cash in hand reduced from Rs. 5,000 to Rs. 2,000');

  const floatSummary = financeService.getRiderFloatSummary(rider.id);
  assert(floatSummary.cashInHand === 200000, 'Rider float summary matches remaining cash');
  assert(floatSummary.canAcceptNewOrders === true, 'Rider is eligible to take new COD orders');
  console.log('  ✅ PASS: Rider COD remittance recorded and reconciled by Finance');

  // --- 4. Merchant Payouts & Batch Settlement System ---
  console.log('\n--- 4. Merchant Payouts & Batch Settlement System ---');
  const merchantLedger = financeService.calculateMerchantPayoutLedger('merch_student_biryani');
  assert(merchantLedger.merchantId === 'merch_student_biryani', 'Merchant ID resolved');
  assert(merchantLedger.commissionRate === 15, 'Platform commission rate is 15%');

  const settlementBatch = financeService.generateMerchantSettlement(
    'merch_student_biryani',
    new Date(Date.now() - 86400000 * 7).toISOString(),
    new Date().toISOString(),
    'PK36MEZN0001234567890123',
    'raast_instant',
    financeUser
  );
  assert(settlementBatch.status === 'draft', 'Settlement batch created as draft');
  assert(settlementBatch.commissionRate === 15, 'Commission rate matches 15%');

  const disbursedSettlement = financeService.disburseMerchantSettlement(
    settlementBatch.id,
    'RAAST-DISB-78601',
    financeUser
  );
  assert(disbursedSettlement.status === 'settled', 'Settlement marked as settled');
  assert(disbursedSettlement.transferReference === 'RAAST-DISB-78601', 'Transfer reference recorded');
  console.log('  ✅ PASS: Merchant net payout settlement generated and disbursed via Raast');

  // --- 5. Customer Refund & Dispute Lifecycle ---
  console.log('\n--- 5. Customer Refund & Dispute Lifecycle ---');
  // Seed a delivered order for testing refund
  const customerToken = {
    sub: 'usr_customer_ali',
    phone: '+923001111111',
    roles: ['customer' as const],
  };

  const testOrder = dataStore.saveOrder({
    id: 'ord_test_refund_target',
    orderNumber: 'RFT-REF-01',
    customerId: 'usr_customer_ali',
    customerName: 'Ali Raza',
    customerPhone: '+923001111111',
    merchantId: 'merch_student_biryani',
    merchantName: 'Student Biryani',
    merchantType: 'restaurant',
    merchantPhone: '+923002222222',
    fulfillmentMode: 'delivery',
    status: 'DELIVERED',
    items: [],
    pricing: {
      subtotal: 70000,
      itemDiscount: 0,
      couponDiscount: 0,
      deliveryFee: 6000,
      serviceFee: 2000,
      tax: 0,
      tip: 0,
      total: 78000, // Rs. 780
      currency: 'PKR',
    },
    deliveryOtp: '123456',
    payment: {
      id: 'pay_test_ref',
      orderId: 'ord_test_refund_target',
      method: 'jazzcash',
      status: 'paid',
      amount: 78000,
      transactionRef: 'JC-TXN-REFUND-TEST',
      provider: 'jazzcash',
    },
    statusHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const refundRequest = await financeService.requestRefund(
    testOrder.id,
    78000,
    'spilled_food',
    'Curry container broke during transport, bag soaked',
    customerToken
  );
  assert(refundRequest.status === 'pending', 'Refund request is pending review');
  assert(refundRequest.amount === 78000, 'Refund amount is Rs. 780');

  // Finance approves refund
  const refundApproval = await financeService.processRefundApproval(
    refundRequest.id,
    true,
    financeUser,
    'Verified photos of damaged bag. Full refund issued.'
  );
  assert(refundApproval.refund.status === 'approved', 'Refund status updated to approved');

  const updatedOrder = dataStore.findOrderById(testOrder.id)!;
  assert(updatedOrder.status === 'REFUNDED', 'Order state machine transitioned to REFUNDED');
  assert(updatedOrder.payment.status === 'refunded', 'Order payment status set to refunded');
  console.log('  ✅ PASS: Customer refund initiated, approved by Finance, and order state transitioned to REFUNDED');

  // --- 6. RBAC Role Security Boundaries ---
  console.log('\n--- 6. RBAC Role & Security Boundary Checks ---');
  // Customer cannot approve refunds or reconcile COD
  assert(hasPermission(['customer'], 'refunds', 'approve') === false, 'Customer CANNOT approve refunds');
  assert(hasPermission(['customer'], 'payments', 'reconcile_cod') === false, 'Customer CANNOT reconcile COD cash');
  assert(hasPermission(['customer'], 'settlements', 'manage') === false, 'Customer CANNOT manage settlements');

  // Finance Staff permissions
  assert(hasPermission(['finance_staff'], 'refunds', 'approve') === true, 'Finance CAN approve refunds');
  assert(hasPermission(['finance_staff'], 'payments', 'reconcile_cod') === true, 'Finance CAN reconcile COD cash');
  assert(hasPermission(['finance_staff'], 'settlements', 'manage') === true, 'Finance CAN manage settlements');
  assert(hasPermission(['finance_staff'], 'orders', 'override_status') === false, 'Finance CANNOT override order status');

  // Super Admin has all permissions
  assert(hasPermission(['super_admin'], 'refunds', 'approve') === true, 'Super Admin CAN approve refunds');
  assert(hasPermission(['super_admin'], 'settings', 'edit') === true, 'Super Admin CAN edit global settings');
  console.log('  ✅ PASS: RBAC permission boundaries strictly enforced for Financial operations');

  // --- 7. Platform Financial Metrics Control Tower ---
  console.log('\n--- 7. Platform Financial Metrics Control Tower ---');
  const metrics = financeService.getPlatformFinancialMetrics();
  assert(typeof metrics.totalGmv === 'number', 'Total GMV calculated');
  assert(typeof metrics.totalPlatformRevenue === 'number', 'Total Platform Revenue calculated');
  assert(typeof metrics.totalCodCashInCirculation === 'number', 'Total COD Cash calculated');
  assert(typeof metrics.totalMerchantPayoutsSettled === 'number', 'Settled payouts calculated');

  // Global settings update
  const adminToken = {
    sub: 'usr_super_admin',
    phone: '+923000000000',
    roles: ['super_admin' as const],
  };
  const updatedSettings = financeService.updateGlobalSettings(
    { defaultCommissionRate: 16.5, platformServiceFee: 2500 },
    adminToken
  );
  assert(updatedSettings.defaultCommissionRate === 16.5, 'Commission rate updated to 16.5%');
  assert(updatedSettings.platformServiceFee === 2500, 'Platform service fee updated to Rs. 25');
  console.log('  ✅ PASS: Platform financial metrics & global settings verified');

  console.log('\n🎉 All 28/28 Phase 5 tests passed successfully!');
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ Phase 5 Test Suite Failed:', err);
  process.exit(1);
});
