export type MerchantType = 'restaurant' | 'shop';

export interface Category {
  id: string;
  name: string;
  nameUrdu: string;
  slug: string;
  type: 'food' | 'grocery' | 'both';
  icon: string;
  image: string;
  isPopular?: boolean;
}

export interface ItemOption {
  id: string;
  name: string;
  nameUrdu?: string;
  priceModifier: number; // in minor units / paisas (e.g. 5000 = Rs. 50)
}

export interface ItemOptionGroup {
  id: string;
  name: string;
  nameUrdu?: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: ItemOption[];
}

export interface MenuItem {
  id: string;
  merchantId: string;
  categoryId: string;
  name: string;
  nameUrdu: string;
  description: string;
  price: number; // in paisas (e.g. 45000 = Rs. 450)
  discountedPrice?: number;
  image: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'spicy' | 'extra_spicy';
  servesCount?: number;
  prepTimeMinutes: number;
  optionGroups?: ItemOptionGroup[];
  isDemo?: boolean;
}

export interface Product {
  id: string;
  merchantId: string;
  categoryId: string;
  name: string;
  nameUrdu: string;
  brand: string;
  unit: string; // e.g. "1 Litre", "500g", "Pack of 6"
  price: number; // in paisas
  discountedPrice?: number;
  inStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  image: string;
  barcode?: string;
  isDemo?: boolean;
}

export interface DeliveryZone {
  id: string;
  merchantId: string;
  name: string;
  baseFee: number; // in paisas (e.g. 8000 = Rs. 80)
  perKmFee: number; // in paisas (e.g. 2000 = Rs. 20/km)
  maxRadiusKm: number;
  polygonCoordinates: Array<{ lat: number; lng: number }>; // Geo boundary
}

export interface Merchant {
  id: string;
  name: string;
  nameUrdu: string;
  slug: string;
  type: MerchantType;
  cuisines: string[];
  description: string;
  descriptionUrdu?: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  openingHours: string; // e.g. "11:00 AM - 02:00 AM"
  rating: number;
  reviewCount: number;
  avgPrepTimeMinutes: number;
  minOrderAmount: number; // in paisas
  baseDeliveryFee: number; // in paisas
  hasFreeDelivery: boolean;
  freeDeliveryThreshold?: number; // in paisas
  isFeatured?: boolean;
  logoUrl: string;
  bannerUrl: string;
  commissionRate: number; // percentage e.g. 15.00
  status?: 'active' | 'pending_approval' | 'suspended';
  isDemo?: boolean;
  deliveryZones: DeliveryZone[];
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  area: string;
  city: string;
  landmark?: string;
  deliveryInstructions?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}
