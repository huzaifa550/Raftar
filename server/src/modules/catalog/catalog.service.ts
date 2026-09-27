import { dataStore } from '../../db/datastore.ts';
import { CustomerAddress, MenuItem, Merchant, Product } from '../../types/catalog.types.ts';
import { calculateDistanceKm, estimateDeliveryEta, isPointInPolygon } from '../../utils/geo.utils.ts';

export interface MerchantQueryFilters {
  type?: 'restaurant' | 'shop';
  category?: string;
  cuisine?: string;
  search?: string;
  lat?: number;
  lng?: number;
  sortBy?: 'rating' | 'deliveryTime' | 'distance' | 'popular';
  freeDeliveryOnly?: boolean;
  openOnly?: boolean;
  minRating?: number;
}

export class CatalogService {
  // 1. List Merchants with Spatial Distance, Filters & Sorting
  getMerchants(filters: MerchantQueryFilters) {
    let list = dataStore.listMerchants();

    // Filter by type (restaurant vs shop)
    if (filters.type) {
      list = list.filter((m) => m.type === filters.type);
    }

    // Filter by cuisine
    if (filters.cuisine) {
      const targetCuisine = filters.cuisine.toLowerCase();
      list = list.filter((m) => m.cuisines.some((c) => c.toLowerCase().includes(targetCuisine)));
    }

    // Filter by category
    if (filters.category) {
      // Find merchants having items in this category
      const targetCatId = filters.category;
      const merchantIdsWithCategory = new Set<string>();

      for (const item of dataStore.menuItems.values()) {
        if (item.categoryId === targetCatId) merchantIdsWithCategory.add(item.merchantId);
      }
      for (const prod of dataStore.products.values()) {
        if (prod.categoryId === targetCatId) merchantIdsWithCategory.add(prod.merchantId);
      }

      list = list.filter((m) => merchantIdsWithCategory.has(m.id));
    }

    // Filter by text search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.nameUrdu.includes(q) ||
          m.cuisines.some((c) => c.toLowerCase().includes(q)) ||
          m.area.toLowerCase().includes(q)
      );
    }

    // Filter by Open status
    if (filters.openOnly) {
      list = list.filter((m) => m.isOpen);
    }

    // Filter by Free Delivery
    if (filters.freeDeliveryOnly) {
      list = list.filter((m) => m.hasFreeDelivery);
    }

    // Filter by Minimum Rating
    if (filters.minRating) {
      list = list.filter((m) => m.rating >= filters.minRating!);
    }

    // Augment with distance and delivery ETA if user coordinates provided
    const userLat = filters.lat;
    const userLng = filters.lng;

    const enrichedList = list.map((m) => {
      let distanceKm: number | null = null;
      let eta: { min: number; max: number } = {
        min: m.avgPrepTimeMinutes + 10,
        max: m.avgPrepTimeMinutes + 25,
      };
      let isWithinZone = true;

      if (userLat !== undefined && userLng !== undefined) {
        distanceKm = calculateDistanceKm(userLat, userLng, m.latitude, m.longitude);
        eta = estimateDeliveryEta(distanceKm, m.avgPrepTimeMinutes);

        // Check zone polygon
        const point = { lat: userLat, lng: userLng };
        isWithinZone = m.deliveryZones.some((zone) => {
          if (zone.polygonCoordinates && zone.polygonCoordinates.length >= 3) {
            return isPointInPolygon(point, zone.polygonCoordinates);
          }
          return distanceKm! <= zone.maxRadiusKm;
        });
      }

      return {
        ...m,
        distanceKm,
        eta,
        isWithinZone,
      };
    });

    // Sort results
    if (filters.sortBy === 'rating') {
      enrichedList.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'deliveryTime') {
      enrichedList.sort((a, b) => a.eta.min - b.eta.min);
    } else if (filters.sortBy === 'distance' && userLat && userLng) {
      enrichedList.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else {
      // Default: Popular / Featured first, then rating
      enrichedList.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.reviewCount - a.reviewCount;
      });
    }

    return enrichedList;
  }

  // 2. Get Merchant Details with Menu / Products Catalog
  getMerchantDetails(slugOrId: string, userLat?: number, userLng?: number) {
    let merchant = dataStore.findMerchantBySlug(slugOrId);
    if (!merchant) {
      merchant = dataStore.findMerchantById(slugOrId);
    }
    if (!merchant) return null;

    let distanceKm: number | null = null;
    let eta = { min: merchant.avgPrepTimeMinutes + 10, max: merchant.avgPrepTimeMinutes + 25 };
    let isWithinZone = true;
    let deliveryFee = merchant.baseDeliveryFee;

    if (userLat !== undefined && userLng !== undefined) {
      distanceKm = calculateDistanceKm(userLat, userLng, merchant.latitude, merchant.longitude);
      eta = estimateDeliveryEta(distanceKm, merchant.avgPrepTimeMinutes);

      const zone = merchant.deliveryZones[0];
      if (zone) {
        deliveryFee = zone.baseFee + Math.round(distanceKm * (zone.perKmFee / 100)) * 100;
      }

      isWithinZone = merchant.deliveryZones.some((z) => {
        if (z.polygonCoordinates && z.polygonCoordinates.length >= 3) {
          return isPointInPolygon({ lat: userLat, lng: userLng }, z.polygonCoordinates);
        }
        return distanceKm! <= z.maxRadiusKm;
      });
    }

    // Retrieve items or products
    const menuItems = dataStore.listMenuItemsByMerchant(merchant.id);
    const products = dataStore.listProductsByMerchant(merchant.id);

    // Group items by category
    const categoriesMap = new Map<string, { category: any; items: any[] }>();

    dataStore.listCategories().forEach((cat) => {
      categoriesMap.set(cat.id, { category: cat, items: [] });
    });

    if (merchant.type === 'restaurant') {
      menuItems.forEach((item) => {
        const group = categoriesMap.get(item.categoryId);
        if (group) group.items.push(item);
      });
    } else {
      products.forEach((prod) => {
        const group = categoriesMap.get(prod.categoryId);
        if (group) group.items.push(prod);
      });
    }

    const categorizedCatalog = Array.from(categoriesMap.values()).filter((g) => g.items.length > 0);

    return {
      merchant: {
        ...merchant,
        distanceKm,
        eta,
        isWithinZone,
        calculatedDeliveryFee: deliveryFee,
      },
      categories: categorizedCatalog,
      totalItemsCount: menuItems.length + products.length,
    };
  }

  // 3. Global Cross-Catalog Search
  globalSearch(query: string, userLat?: number, userLng?: number) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        merchants: [],
        dishes: [],
        products: [],
        categories: [],
      };
    }

    // Match categories
    const matchedCategories = dataStore
      .listCategories()
      .filter((c) => c.name.toLowerCase().includes(q) || c.nameUrdu.includes(q));

    // Match merchants
    const matchedMerchants = this.getMerchants({ search: q, lat: userLat, lng: userLng });

    // Match dishes (restaurant menu items)
    const matchedDishes: Array<MenuItem & { merchantName: string; merchantSlug: string }> = [];
    for (const item of dataStore.menuItems.values()) {
      if (
        item.name.toLowerCase().includes(q) ||
        item.nameUrdu.includes(q) ||
        item.description.toLowerCase().includes(q)
      ) {
        const merchant = dataStore.findMerchantById(item.merchantId);
        matchedDishes.push({
          ...item,
          merchantName: merchant ? merchant.name : 'Restaurant',
          merchantSlug: merchant ? merchant.slug : '',
        });
      }
    }

    // Match products (grocery items)
    const matchedProducts: Array<Product & { merchantName: string; merchantSlug: string }> = [];
    for (const prod of dataStore.products.values()) {
      if (
        prod.name.toLowerCase().includes(q) ||
        prod.nameUrdu.includes(q) ||
        prod.brand.toLowerCase().includes(q)
      ) {
        const merchant = dataStore.findMerchantById(prod.merchantId);
        matchedProducts.push({
          ...prod,
          merchantName: merchant ? merchant.name : 'Mart',
          merchantSlug: merchant ? merchant.slug : '',
        });
      }
    }

    return {
      query,
      counts: {
        merchants: matchedMerchants.length,
        dishes: matchedDishes.length,
        products: matchedProducts.length,
        categories: matchedCategories.length,
      },
      categories: matchedCategories,
      merchants: matchedMerchants.slice(0, 10),
      dishes: matchedDishes.slice(0, 20),
      products: matchedProducts.slice(0, 20),
    };
  }

  // 4. Delivery Zone Coverage Checker
  checkCoverage(merchantId: string, lat: number, lng: number) {
    const merchant = dataStore.findMerchantById(merchantId);
    if (!merchant) throw new Error('Merchant not found');

    const distanceKm = calculateDistanceKm(lat, lng, merchant.latitude, merchant.longitude);
    const point = { lat, lng };

    let isCovered = false;
    let matchedZone = null;

    for (const zone of merchant.deliveryZones) {
      const inPoly =
        zone.polygonCoordinates && zone.polygonCoordinates.length >= 3
          ? isPointInPolygon(point, zone.polygonCoordinates)
          : distanceKm <= zone.maxRadiusKm;

      if (inPoly) {
        isCovered = true;
        matchedZone = zone;
        break;
      }
    }

    const eta = estimateDeliveryEta(distanceKm, merchant.avgPrepTimeMinutes);
    const baseFee = matchedZone ? matchedZone.baseFee : merchant.baseDeliveryFee;
    const perKmFee = matchedZone ? matchedZone.perKmFee : 2000;
    const deliveryFee = baseFee + Math.round(distanceKm * (perKmFee / 100)) * 100;

    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      isCovered,
      distanceKm,
      eta,
      deliveryFee,
      minOrderAmount: merchant.minOrderAmount,
    };
  }

  // 5. Customer Addresses Management
  getUserAddresses(userId: string): CustomerAddress[] {
    return dataStore.listAddressesByUser(userId);
  }

  saveAddress(
    userId: string,
    data: {
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
      isDefault?: boolean;
    }
  ): CustomerAddress {
    return dataStore.createAddress({
      userId,
      ...data,
      isDefault: Boolean(data.isDefault),
    });
  }

  setDefaultAddress(userId: string, addressId: string): boolean {
    return dataStore.setDefaultAddress(userId, addressId);
  }

  deleteAddress(userId: string, addressId: string): boolean {
    return dataStore.deleteAddress(userId, addressId);
  }

  // 6. Merchant Inventory Update
  updateStock(merchantId: string, productId: string, stockQuantity: number): Product {
    const product = dataStore.findProductById(productId);
    if (!product || product.merchantId !== merchantId) {
      throw new Error('Product not found for this merchant');
    }
    const updated = dataStore.updateProductStock(productId, stockQuantity);
    return updated!;
  }
}

export const catalogService = new CatalogService();
