import { MerchantSettlement, RefundRequest, RiderRemittance } from '../types/finance.types.ts';

export const SEED_RIDER_REMITTANCES: RiderRemittance[] = [
  {
    id: 'rem_001',
    riderId: 'rider_001',
    riderName: 'Bilal Ahmed',
    amount: 300000, // Rs. 3,000 deposited
    remittanceMethod: 'hub_cash_deposit',
    referenceNumber: 'DEP-HUB-KHI-0419',
    status: 'verified',
    notes: 'Cash deposited at Raftaar Saddar Operations Hub',
    verifiedBy: 'usr_finance_ayesha',
    verifiedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'rem_002',
    riderId: 'rider_002',
    riderName: 'Tariq Mehmood',
    amount: 250000, // Rs. 2,500
    remittanceMethod: 'jazzcash_transfer',
    referenceNumber: 'JC-TRF-981245',
    status: 'pending',
    notes: 'Transferred via JazzCash Agent to Raftaar Business Account',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export const SEED_MERCHANT_SETTLEMENTS: MerchantSettlement[] = [
  {
    id: 'set_001',
    merchantId: 'merch_student_biryani',
    merchantName: 'Student Biryani',
    periodStart: new Date(Date.now() - 86400000 * 7).toISOString(),
    periodEnd: new Date(Date.now() - 86400000 * 1).toISOString(),
    orderCount: 142,
    grossSales: 12500000, // Rs. 125,000
    commissionRate: 15.0,
    commissionAmount: 1875000, // Rs. 18,750
    refundDeductions: 120000, // Rs. 1,200
    netPayout: 10505000, // Rs. 105,050
    payoutMethod: 'raast_instant',
    beneficiaryIbanOrRaast: 'PK36MEZN0001234567890123',
    status: 'settled',
    transferReference: 'RAAST-SET-7861042',
    settledAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    settledBy: 'usr_finance_ayesha',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'set_002',
    merchantId: 'merch_kolachi',
    merchantName: 'Kolachi Restaurant',
    periodStart: new Date(Date.now() - 86400000 * 7).toISOString(),
    periodEnd: new Date(Date.now() - 86400000 * 1).toISOString(),
    orderCount: 88,
    grossSales: 24800000, // Rs. 248,000
    commissionRate: 14.0,
    commissionAmount: 3472000, // Rs. 34,720
    refundDeductions: 0,
    netPayout: 21328000, // Rs. 213,280
    payoutMethod: 'bank_transfer',
    beneficiaryIbanOrRaast: 'PK65HABB0009876543210987',
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_REFUND_REQUESTS: RefundRequest[] = [
  {
    id: 'ref_001',
    orderId: 'ord_demo_refund_1',
    orderNumber: 'RFT-54120',
    customerId: 'usr_customer_ali',
    customerName: 'Ali Raza',
    merchantId: 'merch_student_biryani',
    merchantName: 'Student Biryani',
    amount: 72000, // Rs. 720
    reason: 'spilled_food',
    description: 'Raita and gravy spilled inside the delivery bag during motorcycle transport.',
    requestedBy: 'usr_customer_ali',
    requestedByRole: 'customer',
    status: 'pending',
    refundChannel: 'wallet_credit',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];
