import { Coupon } from '../types/order.types.ts';

export const SEED_COUPONS: Coupon[] = [
  {
    id: 'coup_raftaar50',
    code: 'RAFTAR50',
    type: 'percentage',
    discountValue: 50, // 50%
    minOrderAmount: 50000, // Rs. 500
    maxDiscountAmount: 25000, // Max discount Rs. 250
    expiryDate: '2027-12-31T23:59:59Z',
    usageLimit: 5000,
    timesUsed: 142,
    description: '50% OFF up to Rs. 250 on orders above Rs. 500 across Karachi!',
    isDemo: true,
  },
  {
    id: 'coup_biryani20',
    code: 'BIRYANI20',
    type: 'percentage',
    discountValue: 20, // 20%
    minOrderAmount: 40000, // Rs. 400
    maxDiscountAmount: 20000, // Max discount Rs. 200
    expiryDate: '2027-12-31T23:59:59Z',
    usageLimit: 3000,
    timesUsed: 89,
    merchantId: 'merch_student_biryani',
    description: '20% OFF on Student Biryani specialties!',
    isDemo: true,
  },
  {
    id: 'coup_freedel',
    code: 'FREEDEL',
    type: 'free_delivery',
    discountValue: 100, // 100% off delivery fee
    minOrderAmount: 40000, // Rs. 400
    expiryDate: '2027-12-31T23:59:59Z',
    usageLimit: 10000,
    timesUsed: 620,
    description: '100% Free Delivery on any order above Rs. 400!',
    isDemo: true,
  },
  {
    id: 'coup_pechs100',
    code: 'PECHS100',
    type: 'fixed',
    discountValue: 10000, // Flat Rs. 100 off
    minOrderAmount: 60000, // Rs. 600
    expiryDate: '2027-12-31T23:59:59Z',
    usageLimit: 2000,
    timesUsed: 45,
    description: 'Flat Rs. 100 OFF on delicious food orders over Rs. 600!',
    isDemo: true,
  },
  {
    id: 'coup_imtiazsaver',
    code: 'IMTIAZSAVER',
    type: 'percentage',
    discountValue: 10, // 10% off
    minOrderAmount: 80000, // Rs. 800
    maxDiscountAmount: 30000, // Max Rs. 300
    expiryDate: '2027-12-31T23:59:59Z',
    usageLimit: 5000,
    timesUsed: 210,
    merchantId: 'merch_imtiaz',
    description: '10% OFF on pantry & groceries at Imtiaz Super Market!',
    isDemo: true,
  },
];
