import { Request, Response, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.ts';
import { dataStore } from '../../db/datastore.ts';

const router = Router();

// 1. Get Customer Profile
router.get('/profile', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const user = dataStore.findUserById(actor.sub);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName || 'Customer',
      phone: user.phone,
      roles: user.roles,
      createdAt: user.createdAt,
    },
  });
});

// 2. Update Customer Profile
router.put('/profile', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { fullName, phone } = req.body;
  const user = dataStore.findUserById(actor.sub);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;

  dataStore.updateUser(user.id, { fullName: user.fullName, phone: user.phone });

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      roles: user.roles,
    },
  });
});

// 3. Get Favorites
router.get('/favorites', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const favs = dataStore.getFavorites(actor.sub);
  return res.status(200).json({
    success: true,
    data: favs,
  });
});

// 4. Toggle Favorite
router.post('/favorites/toggle', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { type, id } = req.body; // type: 'merchant' | 'item'

  if (!type || !id || !['merchant', 'item'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Invalid type (must be merchant or item) or id' });
  }

  const result = dataStore.toggleFavorite(actor.sub, type, id);
  return res.status(200).json({
    success: true,
    message: result.isFavorite ? 'Added to favorites' : 'Removed from favorites',
    data: result,
  });
});

// 5. Get Coupons
router.get('/coupons', (_req: Request, res: Response) => {
  const coupons = dataStore.listCoupons();
  return res.status(200).json({
    success: true,
    data: coupons,
  });
});

// 6. Get Notifications
router.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const notifs = dataStore.getNotifications(actor.sub);
  const unreadCount = notifs.filter((n) => !n.read).length;

  return res.status(200).json({
    success: true,
    data: notifs,
    meta: {
      total: notifs.length,
      unreadCount,
    },
  });
});

// 7. Mark Notification Read
router.post('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const notifId = req.params.id;
  const updated = dataStore.markNotificationRead(actor.sub, notifId);

  return res.status(200).json({
    success: true,
    updated,
  });
});

// 8. Mark All Notifications Read
router.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const count = dataStore.markAllNotificationsRead(actor.sub);

  return res.status(200).json({
    success: true,
    message: `Marked ${count} notifications as read`,
    count,
  });
});

// 9. Get Support Tickets
router.get(['/support', '/support/tickets'], requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const tickets = dataStore.getSupportTickets(actor.sub);
  return res.status(200).json({
    success: true,
    data: tickets,
  });
});

// 10. Create Support Ticket
router.post(['/support', '/support/tickets'], requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { orderId, subject, category, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, error: 'Subject and message are required' });
  }

  const user = dataStore.findUserById(actor.sub);
  const ticket = dataStore.createSupportTicket(actor.sub, {
    orderId,
    subject,
    category: category || 'Order Inquiry',
    message,
    customerName: user?.fullName || 'Customer',
  });

  return res.status(201).json({
    success: true,
    message: 'Support ticket submitted successfully',
    data: ticket,
  });
});

// 11. Reply to Support Ticket
router.post('/support/:id/reply', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const ticketId = req.params.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  try {
    const user = dataStore.findUserById(actor.sub);
    const updatedTicket = dataStore.replySupportTicket(
      actor.sub,
      ticketId,
      message,
      user?.fullName || 'Customer'
    );
    return res.status(200).json({
      success: true,
      message: 'Reply sent',
      data: updatedTicket,
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
});

// 12. Payment Methods
router.get('/payments/methods', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const methods = dataStore.getPaymentMethods(actor.sub);
  return res.status(200).json({
    success: true,
    data: methods,
  });
});

router.post('/payments/methods', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const { type, title, subtitle, isDefault, details } = req.body;

  if (!type || !title) {
    return res.status(400).json({ success: false, error: 'Type and title are required' });
  }

  const newMethod = dataStore.addPaymentMethod(actor.sub, {
    type,
    title,
    subtitle: subtitle || '',
    isDefault: Boolean(isDefault),
    details,
  });

  return res.status(201).json({
    success: true,
    message: 'Payment method saved',
    data: newMethod,
  });
});

router.delete('/payments/methods/:id', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const methodId = req.params.id;
  const removed = dataStore.removePaymentMethod(actor.sub, methodId);

  return res.status(200).json({
    success: true,
    removed,
  });
});

router.put('/payments/methods/:id/default', requireAuth, (req: Request, res: Response) => {
  const actor = req.user!;
  const methodId = req.params.id;
  const updated = dataStore.setDefaultPaymentMethod(actor.sub, methodId);

  return res.status(200).json({
    success: true,
    updated,
  });
});

export const customerRouter = router;
