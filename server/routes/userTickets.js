const router = require('express').Router();
const { UserTicket, TicketOffer, Commerce, MerchantProfile } = require('../models');
const { requireAuth, requireMerchant } = require('../middleware/auth');

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const tickets = await UserTicket.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: TicketOffer, as: 'ticketOffer',
        include: [{ model: Commerce, attributes: ['id', 'name', 'slug', 'address'] }],
      }],
      order: [['won_at', 'DESC']],
    });
    res.json(tickets);
  } catch (err) { next(err); }
});

router.put('/:qr/scan', requireMerchant, async (req, res, next) => {
  try {
    const ticket = await UserTicket.findOne({
      where: { qr_code: req.params.qr },
      include: [{ model: TicketOffer, as: 'ticketOffer' }],
    });

    if (!ticket) return res.status(404).json({ error: 'QR code introuvable' });
    if (ticket.status === 'used') return res.status(409).json({ error: 'QR code déjà utilisé' });
    if (ticket.status === 'expired') return res.status(410).json({ error: 'QR code expiré' });

    if (req.user.role === 'merchant') {
      const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
      if (ticket.ticketOffer.commerce_id !== profile?.commerce_id)
        return res.status(403).json({ error: 'Ce ticket ne vous appartient pas' });
    }

    await ticket.update({ status: 'used', used_at: new Date() });
    res.json({ ok: true, status: 'used', advantage: ticket.ticketOffer.advantage });
  } catch (err) { next(err); }
});

module.exports = router;
