import { Request, Response, Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.ts';
import { dataStore } from '../../db/datastore.ts';
import { paymentGateway } from '../payments/adapters/payment.adapter.ts';
import { financeService } from './finance.service.ts';

export const financeRouter = Router();

// --- 1. Metrics & Overview ---
financeRouter.get(
  '/metrics',
  requireAuth,
  requirePermission('payments', 'read'),
  (req: Request, res: Response) => {
    const metrics = financeService.getPlatformFinancialMetrics();
    res.json({ success: true, data: metrics });
  }
);

financeRouter.get(
  '/settings',
  requireAuth,
  requirePermission('payments', 'read'),
  (_req: Request, res: Response) => {
    const settings = financeService.getGlobalSettings();
    res.json({ success: true, data: settings });
  }
);

financeRouter.put(
  '/settings',
  requireAuth,
  requirePermission('settings', 'edit'),
  (req: Request, res: Response) => {
    const user = (req as any).user;
    const updated = financeService.updateGlobalSettings(req.body, user);
    res.json({ success: true, data: updated });
  }
);

// --- 2. Rider COD Remittances & Float ---
financeRouter.get(
  '/remittances',
  requireAuth,
  requirePermission('payments', 'read'),
  (req: Request, res: Response) => {
    const { riderId, status } = req.query;
    const list = dataStore.listRiderRemittances({
      riderId: riderId as string,
      status: status as string,
    });
    res.json({ success: true, data: list });
  }
);

financeRouter.post('/remittances', requireAuth, (req: Request, res: Response, next) => {
  try {
    const { riderId, amount, remittanceMethod, referenceNumber, notes } = req.body;
    const remittance = financeService.recordRiderRemittance(
      riderId,
      amount,
      remittanceMethod,
      referenceNumber,
      notes
    );
    res.status(201).json({ success: true, data: remittance });
  } catch (err) {
    next(err);
  }
});

financeRouter.post(
  '/remittances/:id/verify',
  requireAuth,
  requirePermission('payments', 'reconcile_cod'),
  (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { approved, notes } = req.body;
      const result = financeService.verifyRiderRemittance(id, approved, user, notes);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

financeRouter.get('/riders/:id/float', requireAuth, (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const summary = financeService.getRiderFloatSummary(id);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// --- 3. Merchant Settlements ---
financeRouter.get(
  '/settlements',
  requireAuth,
  requirePermission('payments', 'read'),
  (req: Request, res: Response) => {
    const { merchantId, status } = req.query;
    const list = dataStore.listMerchantSettlements({
      merchantId: merchantId as string,
      status: status as string,
    });
    res.json({ success: true, data: list });
  }
);

financeRouter.get(
  '/merchants/:id/ledger',
  requireAuth,
  requirePermission('payments', 'read'),
  (req: Request, res: Response, next) => {
    try {
      const { id } = req.params;
      const ledger = financeService.calculateMerchantPayoutLedger(id);
      res.json({ success: true, data: ledger });
    } catch (err) {
      next(err);
    }
  }
);

financeRouter.post(
  '/settlements/generate',
  requireAuth,
  requirePermission('settlements', 'manage'),
  (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      const { merchantId, periodStart, periodEnd, beneficiaryIbanOrRaast, payoutMethod } = req.body;
      const settlement = financeService.generateMerchantSettlement(
        merchantId,
        periodStart,
        periodEnd,
        beneficiaryIbanOrRaast,
        payoutMethod,
        user
      );
      res.status(201).json({ success: true, data: settlement });
    } catch (err) {
      next(err);
    }
  }
);

financeRouter.post(
  '/settlements/:id/disburse',
  requireAuth,
  requirePermission('settlements', 'manage'),
  (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { transferReference } = req.body;
      const settlement = financeService.disburseMerchantSettlement(id, transferReference, user);
      res.json({ success: true, data: settlement });
    } catch (err) {
      next(err);
    }
  }
);

// --- 4. Refunds & Disputes ---
financeRouter.get(
  '/refunds',
  requireAuth,
  requirePermission('payments', 'read'),
  (req: Request, res: Response) => {
    const { orderId, customerId, merchantId, status } = req.query;
    const list = dataStore.listRefundRequests({
      orderId: orderId as string,
      customerId: customerId as string,
      merchantId: merchantId as string,
      status: status as string,
    });
    res.json({ success: true, data: list });
  }
);

financeRouter.post('/refunds', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const user = (req as any).user;
    const { orderId, amount, reason, description } = req.body;
    const refund = await financeService.requestRefund(orderId, amount, reason, description, user);
    res.status(201).json({ success: true, data: refund });
  } catch (err) {
    next(err);
  }
});

financeRouter.post(
  '/refunds/:id/review',
  requireAuth,
  requirePermission('refunds', 'approve'),
  async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { approved, reviewNotes } = req.body;
      const result = await financeService.processRefundApproval(id, approved, user, reviewNotes);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// --- 5. Direct Payment Processing API ---
financeRouter.post('/payments/process', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const result = await paymentGateway.processPayment(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
