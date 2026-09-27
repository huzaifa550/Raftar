import { dataStore } from '../../db/datastore.ts';
import {
  CartItemInput,
  Coupon,
  FulfillmentMode,
  OrderItemSnapshot,
  PriceBreakdown,
  SelectedOptionSnapshot,
} from '../../types/order.types.ts';
import { calculateDistanceKm } from '../../utils/geo.utils.ts';

export interface PricingCalculationResult {
  merchantId: string;
  merchantName: string;
  itemsSnapshot: OrderItemSnapshot[];
  pricing: PriceBreakdown;
  couponApplied?: Coupon;
}

export class PricingEngine {
  private PLATFORM_SERVICE_FEE = 2000; // Flat Rs. 20 (in paisas)
  private SALES_TAX_PERCENTAGE = 5; // 5% provincial sales tax on cooked food / restaurant orders

  calculateCart(
    merchantId: string,
    rawItems: CartItemInput[],
    couponCode?: string,
    fulfillmentMode: FulfillmentMode = 'delivery',
    customerLat?: number,
    customerLng?: number,
    tipAmount = 0
  ): PricingCalculationResult {
    const merchant = dataStore.findMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant '${merchantId}' does not exist.`);
    }

    if (!rawItems || rawItems.length === 0) {
      throw new Error('Cart cannot be empty.');
    }

    let subtotal = 0;
    let itemDiscounts = 0;
    const itemsSnapshot: OrderItemSnapshot[] = [];

    // 1. Validate each item and calculate authoritative prices
    for (const rawItem of rawItems) {
      let authoritativeItem = dataStore.findMenuItemById(rawItem.itemId);
      let isProduct = false;

      if (!authoritativeItem) {
        const prod = dataStore.findProductById(rawItem.itemId);
        if (prod) {
          isProduct = true;
          authoritativeItem = {
            id: prod.id,
            merchantId: prod.merchantId,
            categoryId: prod.categoryId,
            name: prod.name,
            nameUrdu: prod.nameUrdu,
            description: `${prod.brand} • ${prod.unit}`,
            price: prod.price,
            discountedPrice: prod.discountedPrice,
            image: prod.image,
            isAvailable: prod.inStock,
            prepTimeMinutes: 5,
          };
        }
      }

      if (!authoritativeItem) {
        throw new Error(`Item '${rawItem.itemId}' not found in marketplace catalog.`);
      }

      // Enforce Single-Merchant Rule
      if (authoritativeItem.merchantId !== merchantId) {
        throw new Error(
          `Single-merchant violation: Item '${authoritativeItem.name}' belongs to merchant '${authoritativeItem.merchantId}', but cart is bound to '${merchantId}'.`
        );
      }

      if (!authoritativeItem.isAvailable) {
        throw new Error(`Item '${authoritativeItem.name}' is currently sold out.`);
      }

      if (rawItem.quantity <= 0 || !Number.isInteger(rawItem.quantity)) {
        throw new Error(`Invalid quantity for item '${authoritativeItem.name}'.`);
      }

      // Calculate options price modifier
      let optionsTotal = 0;
      const selectedOptionsSnapshots: SelectedOptionSnapshot[] = [];

      if (rawItem.selectedOptionIds && rawItem.selectedOptionIds.length > 0) {
        const optionIdSet = new Set(rawItem.selectedOptionIds);
        if (authoritativeItem.optionGroups) {
          for (const group of authoritativeItem.optionGroups) {
            for (const opt of group.options) {
              if (optionIdSet.has(opt.id)) {
                optionsTotal += opt.priceModifier;
                selectedOptionsSnapshots.push({
                  groupId: group.id,
                  groupName: group.name,
                  optionId: opt.id,
                  optionName: opt.name,
                  priceModifier: opt.priceModifier,
                });
              }
            }
          }
        }
      }

      const regularUnitPrice = authoritativeItem.price;
      const effectiveUnitPrice = authoritativeItem.discountedPrice || authoritativeItem.price;
      const discountPerUnit = regularUnitPrice - effectiveUnitPrice;

      const finalUnitPrice = effectiveUnitPrice + optionsTotal;
      const lineItemTotal = finalUnitPrice * rawItem.quantity;

      subtotal += (regularUnitPrice + optionsTotal) * rawItem.quantity;
      itemDiscounts += discountPerUnit * rawItem.quantity;

      itemsSnapshot.push({
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemId: authoritativeItem.id,
        name: authoritativeItem.name,
        nameUrdu: authoritativeItem.nameUrdu,
        unitPrice: regularUnitPrice,
        optionsTotalPrice: optionsTotal,
        finalUnitPrice,
        quantity: rawItem.quantity,
        totalPrice: lineItemTotal,
        selectedOptions: selectedOptionsSnapshots,
        specialInstructions: rawItem.specialInstructions,
      });
    }

    const netItemSubtotal = subtotal - itemDiscounts;

    // Minimum order check
    if (netItemSubtotal < merchant.minOrderAmount) {
      const minRupees = Math.round(merchant.minOrderAmount / 100);
      throw new Error(`Minimum order amount for ${merchant.name} is Rs. ${minRupees}. Current subtotal is Rs. ${Math.round(netItemSubtotal / 100)}.`);
    }

    // 2. Delivery Fee calculation
    let deliveryFee = 0;
    if (fulfillmentMode === 'delivery') {
      let isEligibleForMerchantFreeDelivery = false;
      if (merchant.hasFreeDelivery) {
        if (!merchant.freeDeliveryThreshold || netItemSubtotal >= merchant.freeDeliveryThreshold) {
          isEligibleForMerchantFreeDelivery = true;
        }
      }

      if (isEligibleForMerchantFreeDelivery) {
        deliveryFee = 0;
      } else {
        deliveryFee = merchant.baseDeliveryFee;
        if (customerLat !== undefined && customerLng !== undefined) {
          const distKm = calculateDistanceKm(customerLat, customerLng, merchant.latitude, merchant.longitude);
          const zone = merchant.deliveryZones[0];
          const perKm = zone ? zone.perKmFee : 1500;
          deliveryFee = (zone ? zone.baseFee : merchant.baseDeliveryFee) + Math.round(distKm * (perKm / 100)) * 100;
        }
      }
    }

    // 3. Coupon Validation and Discount calculation
    let couponDiscount = 0;
    let appliedCoupon: Coupon | undefined;

    if (couponCode) {
      const coupon = dataStore.findCouponByCode(couponCode);
      if (!coupon) {
        throw new Error(`Coupon code '${couponCode}' is invalid.`);
      }

      if (new Date(coupon.expiryDate) < new Date()) {
        throw new Error(`Coupon code '${couponCode}' has expired.`);
      }

      if (coupon.timesUsed >= coupon.usageLimit) {
        throw new Error(`Coupon code '${couponCode}' has reached its global redemption limit.`);
      }

      if (coupon.merchantId && coupon.merchantId !== merchantId) {
        throw new Error(`Coupon code '${couponCode}' is only valid for selected merchants.`);
      }

      if (netItemSubtotal < coupon.minOrderAmount) {
        const minRs = Math.round(coupon.minOrderAmount / 100);
        throw new Error(`Coupon '${couponCode}' requires a minimum order of Rs. ${minRs}.`);
      }

      // Calculate discount amount
      if (coupon.type === 'percentage') {
        const rawDiscount = Math.round(netItemSubtotal * (coupon.discountValue / 100));
        couponDiscount = coupon.maxDiscountAmount ? Math.min(rawDiscount, coupon.maxDiscountAmount) : rawDiscount;
      } else if (coupon.type === 'fixed') {
        couponDiscount = Math.min(coupon.discountValue, netItemSubtotal);
      } else if (coupon.type === 'free_delivery') {
        couponDiscount = deliveryFee;
        deliveryFee = 0;
      }

      appliedCoupon = coupon;
    }

    // 4. Platform Service Fee
    const serviceFee = this.PLATFORM_SERVICE_FEE;

    // 5. Sales Tax (Sindh/Punjab GST on restaurant food)
    const taxableAmount = Math.max(0, netItemSubtotal - couponDiscount);
    const tax = merchant.type === 'restaurant' ? Math.round(taxableAmount * (this.SALES_TAX_PERCENTAGE / 100)) : 0;

    // 6. Total Calculation (Strict server authority)
    const tip = Math.max(0, tipAmount);
    const total = Math.max(0, netItemSubtotal - couponDiscount + deliveryFee + serviceFee + tax + tip);

    const pricingBreakdown: PriceBreakdown = {
      subtotal,
      itemDiscount: itemDiscounts,
      couponDiscount,
      deliveryFee,
      serviceFee,
      tax,
      tip,
      total,
      couponCode: appliedCoupon?.code,
      currency: 'PKR',
    };

    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      itemsSnapshot,
      pricing: pricingBreakdown,
      couponApplied: appliedCoupon,
    };
  }
}

export const pricingEngine = new PricingEngine();
