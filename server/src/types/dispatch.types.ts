export interface Rider {
  id: string;
  userId: string;
  name: string;
  nameUrdu?: string;
  phone: string;
  cnic: string; // Pakistani Computerized National Identity Card
  vehicleType: 'motorcycle' | 'bicycle';
  vehicleNumber: string; // e.g. "KHI-KAS-4892"
  status: 'online' | 'offline' | 'busy';
  currentLocation: {
    lat: number;
    lng: number;
    heading?: number;
    updatedAt: string;
  };
  rating: number;
  completedOrdersCount: number;
  cashInHand: number; // in paisas (COD cash collected)
  maxCashLimit: number; // in paisas (e.g. Rs. 15,000 max before remittance)
  todayEarnings: number; // in paisas
  activeOrderId?: string;
  isDemo?: boolean;
}

export interface DispatchOffer {
  id: string;
  orderId: string;
  orderNumber: string;
  riderId: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantLocation: { lat: number; lng: number };
  deliveryAddress: { streetAddress: string; area: string };
  deliveryLocation: { lat: number; lng: number };
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  estimatedEarning: number; // in paisas (Base + per-km + tip)
  expiresAt: number; // timestamp in ms (30 seconds from dispatch)
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
}

export interface MerchantDashboardStats {
  todayOrdersCount: number;
  todayGrossSales: number; // in paisas
  todayNetPayout: number; // in paisas (sales minus platform commission)
  avgPrepTimeMinutes: number;
  pendingAcceptanceCount: number;
  activeCookingCount: number;
  readyForPickupCount: number;
}
