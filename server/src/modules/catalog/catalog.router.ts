import { Request, Response, Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.ts';
import { dataStore } from '../../db/datastore.ts';
import { catalogService, MerchantQueryFilters } from './catalog.service.ts';

const router = Router();

// 1. Get Categories
router.get('/categories', (req: Request, res: Response) => {
  const type = req.query.type as 'food' | 'grocery' | undefined;
  const categories = dataStore.listCategories(type);
  return res.status(200).json({
    success: true,
    data: categories,
    meta: {
      total: categories.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// 2. Discover / List Merchants with Filters & Geo Proximity
router.get('/merchants', (req: Request, res: Response) => {
  const filters: MerchantQueryFilters = {
    type: req.query.type as any,
    category: req.query.category as string,
    cuisine: req.query.cuisine as string,
    search: req.query.search as string,
    lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
    lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
    sortBy: req.query.sortBy as any,
    freeDeliveryOnly: req.query.freeDelivery === 'true',
    openOnly: req.query.openOnly === 'true',
    minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
  };

  const merchants = catalogService.getMerchants(filters);

  return res.status(200).json({
    success: true,
    data: merchants,
    meta: {
      total: merchants.length,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    },
  });
});

// 3. Get Merchant Details & Categorized Catalog
router.get('/merchants/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

  const result = catalogService.getMerchantDetails(slug, lat, lng);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'MERCHANT_NOT_FOUND',
        message: `Merchant with slug or id '${slug}' was not found`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    },
  });
});

// 4. Global Search (Merchants, Dishes, Products, Cuisines)
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

  const searchResults = catalogService.globalSearch(query, lat, lng);

  return res.status(200).json({
    success: true,
    data: searchResults,
    meta: {
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    },
  });
});

// 5. Check Delivery Zone Coverage
router.post('/coverage', (req: Request, res: Response) => {
  const { merchantId, lat, lng } = req.body;
  if (!merchantId || lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'merchantId, lat and lng are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const coverage = catalogService.checkCoverage(merchantId, parseFloat(lat), parseFloat(lng));
    return res.status(200).json({
      success: true,
      data: coverage,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message,
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 6. Customer Saved Addresses
router.get('/addresses', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const addresses = catalogService.getUserAddresses(userId);
  return res.status(200).json({
    success: true,
    data: addresses,
    meta: {
      total: addresses.length,
      timestamp: new Date().toISOString(),
    },
  });
});

router.post('/addresses', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { label, recipientName, recipientPhone, streetAddress, area, city, landmark, deliveryInstructions, latitude, longitude, isDefault } = req.body;

  if (!streetAddress || !area || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'streetAddress, area, latitude, and longitude are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const newAddress = catalogService.saveAddress(userId, {
    label: label || 'Home',
    recipientName: recipientName || req.user!.phone,
    recipientPhone: recipientPhone || req.user!.phone,
    streetAddress,
    area,
    city: city || 'Karachi',
    landmark,
    deliveryInstructions,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    isDefault: Boolean(isDefault),
  });

  return res.status(201).json({
    success: true,
    message: 'Address saved successfully',
    data: newAddress,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

router.put('/addresses/:id/default', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const addressId = req.params.id;
  const updated = catalogService.setDefaultAddress(userId, addressId);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found or does not belong to user',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Default address updated',
    data: { addressId, isDefault: true },
  });
});

router.delete('/addresses/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const addressId = req.params.id;
  const deleted = catalogService.deleteAddress(userId, addressId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found or does not belong to user',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: { id: addressId },
  });
});

// 7. Update Inventory / Stock (Merchant role protected)
router.patch('/inventory/:id', requireAuth, requirePermission('catalog', 'write'), (req: Request, res: Response) => {
  const productId = req.params.id;
  const { stockQuantity } = req.body;

  if (stockQuantity === undefined || isNaN(stockQuantity)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_QUANTITY',
        message: 'Valid stockQuantity integer required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const merchantId = req.user?.merchantId || 'merch_imtiaz';
  try {
    const updatedProduct = catalogService.updateStock(merchantId, productId, parseInt(stockQuantity, 10));
    return res.status(200).json({
      success: true,
      message: 'Product inventory updated',
      data: updatedProduct,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVENTORY_UPDATE_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 8. Admin Update Merchant Status, Commission & Parameters
router.patch('/merchants/:id', requireAuth, requirePermission('merchants', 'approve'), (req: Request, res: Response) => {
  const merchantId = req.params.id;
  const merchant = dataStore.findMerchantById(merchantId);
  if (!merchant) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Merchant '${merchantId}' not found.` },
    });
  }

  const { status, isOpen, commissionRate, minimumOrder, name, phone } = req.body;
  if (status !== undefined) merchant.status = status;
  if (isOpen !== undefined) merchant.isOpen = Boolean(isOpen);
  if (commissionRate !== undefined) merchant.commissionRate = parseFloat(commissionRate);
  if (minimumOrder !== undefined) merchant.minOrderAmount = parseInt(minimumOrder, 10);
  if (name !== undefined) merchant.name = name;
  if (phone !== undefined) merchant.phone = phone;

  const updated = dataStore.updateMerchant(merchant);

  dataStore.addAuditLog({
    actorId: req.user!.sub,
    actorPhone: req.user!.phone,
    actorRole: req.user!.roles[0],
    action: `merchant:admin_update:${status || 'modified'}`,
    resource: 'merchants',
    targetId: merchant.id,
    diff: req.body,
  });

  return res.status(200).json({
    success: true,
    message: `Merchant ${merchant.name} successfully updated`,
    data: updated,
  });
});

// 9. Admin Create New Restaurant or Grocery / Shop Partner
router.post('/merchants', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const {
    name,
    nameUrdu,
    type = 'restaurant',
    cuisines,
    description,
    descriptionUrdu,
    phone,
    email,
    address,
    area = 'Clifton',
    city = 'Karachi',
    latitude = 24.829,
    longitude = 67.033,
    minOrderAmount = 50000,
    baseDeliveryFee = 7000,
    hasFreeDelivery = false,
    commissionRate = 15.0,
    openingHours = '10:00 AM - 12:00 AM',
    avgPrepTimeMinutes = 25,
    logoUrl,
    bannerUrl,
  } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: { message: 'Partner name is required' } });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  const merchantId = `merch_${slug.replace(/-/g, '_')}`;

  const defaultDeliveryZone = {
    id: `zone_${merchantId}_1`,
    merchantId,
    name: `${area} & Greater Karachi Zone`,
    baseFee: Number(baseDeliveryFee),
    perKmFee: 2000,
    maxRadiusKm: 16,
    polygonCoordinates: [
      { lat: 24.80, lng: 66.98 },
      { lat: 24.98, lng: 66.98 },
      { lat: 24.98, lng: 67.18 },
      { lat: 24.80, lng: 67.18 },
    ],
  };

  const defaultLogo = type === 'shop'
    ? 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80';

  const defaultBanner = type === 'shop'
    ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80';

  const newMerchant = {
    id: merchantId,
    name,
    nameUrdu: nameUrdu || name,
    slug,
    type: type as 'restaurant' | 'shop',
    cuisines: Array.isArray(cuisines)
      ? cuisines
      : typeof cuisines === 'string'
      ? cuisines.split(',').map((s: string) => s.trim())
      : type === 'shop' ? ['Grocery', 'Daily Essentials'] : ['Pakistani', 'Fast Food'],
    description: description || `${name} delivering fresh across ${area}, ${city}`,
    descriptionUrdu: descriptionUrdu || `${name} بہترین کوالٹی کے ساتھ دستیاب ہے`,
    phone: phone || '+923001234567',
    email: email || `${slug}@raftaar.pk`,
    address: address || `${area}, ${city}`,
    area,
    city,
    latitude: Number(latitude),
    longitude: Number(longitude),
    isOpen: true,
    openingHours,
    rating: 4.9,
    reviewCount: 1,
    avgPrepTimeMinutes: Number(avgPrepTimeMinutes),
    minOrderAmount: Number(minOrderAmount),
    baseDeliveryFee: Number(baseDeliveryFee),
    hasFreeDelivery: Boolean(hasFreeDelivery),
    isFeatured: true,
    logoUrl: logoUrl || defaultLogo,
    bannerUrl: bannerUrl || defaultBanner,
    commissionRate: Number(commissionRate),
    status: 'active' as const,
    deliveryZones: [defaultDeliveryZone],
  };

  dataStore.createMerchant(newMerchant as any);

  // Automatically seed starter catalog items so the new partner is immediately orderable
  if (type === 'restaurant') {
    dataStore.createMenuItem({
      id: `item_${merchantId}_starter_1`,
      merchantId,
      categoryId: 'cat_biryani',
      name: `${name} Signature Special`,
      nameUrdu: `${name} اسپیشل ڈش`,
      description: 'Chef recommendation with authentic spices and fresh ingredients',
      price: 49900,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
      isAvailable: true,
      prepTimeMinutes: 20,
    });
    dataStore.createMenuItem({
      id: `item_${merchantId}_starter_2`,
      merchantId,
      categoryId: 'cat_fastfood',
      name: `${name} Deluxe Platter`,
      nameUrdu: `${name} ڈیلکس پلیٹر`,
      description: 'Hearty serving served hot and fresh for 2-3 persons',
      price: 85000,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
      isAvailable: true,
      prepTimeMinutes: 25,
    });
  } else {
    dataStore.createProduct({
      id: `prod_${merchantId}_starter_1`,
      merchantId,
      categoryId: 'cat_fruits_veg',
      name: 'Farm Fresh Organic Box',
      nameUrdu: 'تازہ پھل اور سبزیاں',
      brand: 'FreshFarm',
      unit: '1 Basket (2.5kg)',
      price: 38000,
      inStock: true,
      stockQuantity: 50,
      lowStockThreshold: 5,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
    });
    dataStore.createProduct({
      id: `prod_${merchantId}_starter_2`,
      merchantId,
      categoryId: 'cat_dairy_eggs',
      name: 'Pure Full Cream Milk (Pack of 3)',
      nameUrdu: 'خالص دودھ ۳ پیکٹ',
      brand: 'DairyGold',
      unit: '3 x 1000ml',
      price: 66000,
      inStock: true,
      stockQuantity: 40,
      lowStockThreshold: 10,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
    });
  }

  dataStore.addAuditLog({
    actorId: actor.sub,
    actorPhone: actor.phone,
    actorRole: actor.roles?.[0] || 'super_admin',
    action: `merchant:create:${type}`,
    resource: 'merchants',
    targetId: newMerchant.id,
    diff: { name, type, area, commissionRate },
  });

  return res.status(201).json({
    success: true,
    message: `${type === 'restaurant' ? 'Restaurant' : 'Shop'} "${name}" created and published successfully!`,
    data: newMerchant,
  });
});

// 10. Admin Delete Merchant
router.delete('/merchants/:id', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const merchantId = req.params.id;
  const merchant = dataStore.findMerchantById(merchantId);

  if (!merchant) {
    return res.status(404).json({ success: false, error: { message: `Merchant '${merchantId}' not found` } });
  }

  dataStore.deleteMerchant(merchantId);

  dataStore.addAuditLog({
    actorId: actor.sub,
    actorPhone: actor.phone,
    actorRole: actor.roles?.[0] || 'super_admin',
    action: 'merchant:delete',
    resource: 'merchants',
    targetId: merchantId,
    diff: { deletedMerchantName: merchant.name },
  });

  return res.status(200).json({
    success: true,
    message: `Merchant "${merchant.name}" has been removed`,
    data: { id: merchantId },
  });
});

export const catalogRouter = router;
