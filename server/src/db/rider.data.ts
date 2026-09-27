import { Rider } from '../types/dispatch.types.ts';

export const SEED_RIDERS: Rider[] = [
  // Rider 1: Stationed in Clifton (near Student Biryani & Kolachi)
  {
    id: 'rider_001',
    userId: 'usr_rider_bilal',
    name: 'Bilal Ahmed',
    nameUrdu: 'بلال احمد',
    phone: '+923004444444',
    cnic: '42201-1234567-1',
    vehicleType: 'motorcycle',
    vehicleNumber: 'KHI-KAS-4892 (Honda CD70)',
    status: 'online',
    currentLocation: {
      lat: 24.826,
      lng: 67.032,
      heading: 90,
      updatedAt: new Date().toISOString(),
    },
    rating: 4.9,
    completedOrdersCount: 480,
    cashInHand: 450000, // Rs. 4,500
    maxCashLimit: 1500000, // Rs. 15,000
    todayEarnings: 125000, // Rs. 1,250
    isDemo: true,
  },

  // Rider 2: Stationed in Saddar / Civil Lines
  {
    id: 'rider_002',
    userId: 'usr_rider_tariq',
    name: 'Tariq Mehmood',
    nameUrdu: 'طارق محمود',
    phone: '+923005555555',
    cnic: '42101-9876543-3',
    vehicleType: 'motorcycle',
    vehicleNumber: 'KHI-LEB-8219 (Yamaha YBR)',
    status: 'online',
    currentLocation: {
      lat: 24.854,
      lng: 67.018,
      heading: 180,
      updatedAt: new Date().toISOString(),
    },
    rating: 4.8,
    completedOrdersCount: 312,
    cashInHand: 280000, // Rs. 2,800
    maxCashLimit: 1500000,
    todayEarnings: 98000,
    isDemo: true,
  },

  // Rider 3: Stationed in Gulshan-e-Iqbal
  {
    id: 'rider_003',
    userId: 'usr_rider_kamran',
    name: 'Kamran Khan',
    nameUrdu: 'کامران خان',
    phone: '+923006666666',
    cnic: '42301-5647382-9',
    vehicleType: 'motorcycle',
    vehicleNumber: 'KHI-KUL-3012 (Suzuki GD110S)',
    status: 'online',
    currentLocation: {
      lat: 24.915,
      lng: 67.095,
      heading: 45,
      updatedAt: new Date().toISOString(),
    },
    rating: 4.7,
    completedOrdersCount: 220,
    cashInHand: 150000,
    maxCashLimit: 1500000,
    todayEarnings: 72000,
    isDemo: true,
  },
];
