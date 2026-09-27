import { Request, Response, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.ts';
import { dataStore } from '../../db/datastore.ts';
import { orderService } from './order.service.ts';

const router = Router();

// 1. Quote & Price Cart
router.post('/quote', (req: Request, res: Response) => {
  const { merchantId, items, couponCode, fulfillmentMode, lat, lng, tipAmount } = req.body;

  if (!merchantId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'merchantId and non-empty items array are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const quote = orderService.quoteCart(
      merchantId,
      items,
      couponCode,
      fulfillmentMode || 'delivery',
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      tipAmount ? parseInt(tipAmount, 10) : 0
    );

    return res.status(200).json({
      success: true,
      data: quote,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PRICING_ERROR',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 2. Validate Coupon Code
router.get('/coupons', (_req: Request, res: Response) => {
  const coupons = dataStore.listCoupons();
  return res.status(200).json({
    success: true,
    data: coupons,
    meta: {
      total: coupons.length,
      timestamp: new Date().toISOString(),
    },
  });
});

router.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, merchantId, subtotal } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_CODE',
        message: 'Coupon code is required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const result = orderService.validateCoupon(
      code,
      merchantId,
      subtotal ? parseInt(subtotal, 10) : 0
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COUPON',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 3. Place Order (Authenticated)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const actor = req.user!;
  const {
    merchantId,
    items,
    fulfillmentMode,
    paymentMethod,
    couponCode,
    addressId,
    scheduledFor,
    tipAmount,
    customerNote,
  } = req.body;

  if (!merchantId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'merchantId and items are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const order = await orderService.placeOrder(actor, {
      merchantId,
      items,
      fulfillmentMode: fulfillmentMode || 'delivery',
      paymentMethod: paymentMethod || 'cod',
      couponCode,
      addressId,
      scheduledFor,
      tipAmount: tipAmount ? parseInt(tipAmount, 10) : 0,
      customerNote,
    });

    return res.status(201).json({
      success: true,
      message: `Order ${order.orderNumber} successfully placed!`,
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'ORDER_CREATION_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 4. List Orders (Customer, Merchant, or Admin)
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const actor = req.user!;
    const statusFilter = req.query.status as any;
    const orders = orderService.listOrders(actor, statusFilter);

    return res.status(200).json({
      success: true,
      data: orders,
      meta: {
        total: orders.length,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'ORDERS_FETCH_ERROR',
        message: err.message || 'Failed to retrieve orders',
        statusCode: 500,
      },
    });
  }
});

// 5. Get Order Details & Tracking
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const orderId = req.params.id;

  try {
    const order = orderService.getOrder(orderId, actor);
    return res.status(200).json({
      success: true,
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      },
    });
  } catch (err: any) {
    const statusCode = err.message.includes('Access denied') ? 403 : 404;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 403 ? 'FORBIDDEN_IDOR' : 'ORDER_NOT_FOUND',
        message: err.message,
        statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 6. Transition Order Status (State Machine)
router.post('/:id/transition', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const orderId = req.params.id;
  const { targetStatus, reason, otp, cashCollected } = req.body;

  if (!targetStatus) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_STATUS',
        message: 'targetStatus is required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const updatedOrder = orderService.transitionStatus(
      orderId,
      targetStatus,
      actor,
      reason,
      otp,
      cashCollected ? parseInt(cashCollected, 10) : undefined
    );

    return res.status(200).json({
      success: true,
      message: `Order ${updatedOrder.orderNumber} transitioned to ${targetStatus}`,
      data: updatedOrder,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'STATE_TRANSITION_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 7. Customer Cancel Order
router.post('/:id/cancel', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const orderId = req.params.id;
  const { reason } = req.body;

  try {
    const updatedOrder = orderService.transitionStatus(
      orderId,
      'CANCELLED',
      actor,
      reason || 'Customer cancelled before preparation started'
    );

    return res.status(200).json({
      success: true,
      message: `Order ${updatedOrder.orderNumber} has been cancelled.`,
      data: updatedOrder,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CANCELLATION_FAILED',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// 8. Submit Customer Review for Order
router.post('/:id/review', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const orderId = req.params.id;
  const { rating, comment, foodRating, deliveryRating } = req.body;

  if (!rating || isNaN(rating)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_RATING', message: 'Valid rating (1-5) is required' },
    });
  }

  try {
    const review = dataStore.saveOrderReview(
      actor.sub,
      actor.phone || 'Customer',
      orderId,
      parseInt(rating, 10),
      comment || 'Great experience!',
      foodRating ? parseInt(foodRating, 10) : undefined,
      deliveryRating ? parseInt(deliveryRating, 10) : undefined
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted.',
      data: review,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'REVIEW_FAILED', message: err.message },
    });
  }
});

router.get('/:id/review', requireAuth, (req: Request, res: Response) => {
  const orderId = req.params.id;
  const review = dataStore.getOrderReview(orderId);
  return res.status(200).json({
    success: true,
    data: review || null,
  });
});

export const orderRouter = router;
