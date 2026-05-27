const router = require('express').Router();
const { requireMerchant } = require('../middleware/auth');
const { MerchantProfile, Commerce, Review, TicketOffer, UserTicket } = require('../models');

router.get('/profile', requireMerchant, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({
      where: { user_id: req.user.id },
      include: [{ model: Commerce, as: 'commerce' }],
    });
    res.json(profile);
  } catch (err) { next(err); }
});

router.get('/stats', requireMerchant, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil introuvable' });
    const [activeOffers, totalTicketsUsed, totalReviews] = await Promise.all([
      TicketOffer.count({ where: { commerce_id: profile.commerce_id, is_active: true } }),
      UserTicket.count({ where: { status: 'used' }, include: [{ model: TicketOffer, where: { commerce_id: profile.commerce_id }, required: true }] }),
      Review.count({ where: { commerce_id: profile.commerce_id, status: 'approved' } }),
    ]);
    res.json({ tickets_balance: profile.tickets_balance, activeOffers, totalTicketsUsed, totalReviews });
  } catch (err) { next(err); }
});

module.exports = router;
