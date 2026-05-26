const router = require('express').Router();
const { TicketOffer, MerchantProfile, CreditTransaction, Commerce } = require('../models');
const { requireAuth, requireMerchant, requireAdmin } = require('../middleware/auth');
const { sequelize } = require('../models');

router.post('/', requireMerchant, async (req, res, next) => {
  try {
    const { title, advantage, quantity_total, valid_until } = req.body;
    if (!title || !advantage || !quantity_total || quantity_total <= 0)
      return res.status(400).json({ error: 'Données invalides' });

    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil marchand introuvable' });
    if (profile.tickets_balance < quantity_total)
      return res.status(400).json({ error: `Solde insuffisant (${profile.tickets_balance} tickets disponibles)` });

    const t = await sequelize.transaction();
    try {
      const offer = await TicketOffer.create({
        commerce_id: profile.commerce_id, title, advantage, quantity_total,
        quantity_remaining: quantity_total, valid_until, created_by: req.user.id,
      }, { transaction: t });

      await MerchantProfile.decrement('tickets_balance', { by: quantity_total, where: { user_id: req.user.id }, transaction: t });
      await CreditTransaction.create({
        merchant_id: req.user.id, amount: -quantity_total, type: 'debit',
        note: `Création offre "${title}"`, created_by: req.user.id,
      }, { transaction: t });

      await t.commit();
      res.status(201).json(offer);
    } catch (err) { await t.rollback(); throw err; }
  } catch (err) { next(err); }
});

router.get('/mine', requireMerchant, async (req, res, next) => {
  try {
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil marchand introuvable' });
    const offers = await TicketOffer.findAll({
      where: { commerce_id: profile.commerce_id },
      order: [['created_at', 'DESC']],
    });
    res.json(offers);
  } catch (err) { next(err); }
});

router.put('/:id', requireMerchant, async (req, res, next) => {
  try {
    const offer = await TicketOffer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile || offer.commerce_id !== profile.commerce_id)
      return res.status(403).json({ error: 'Accès refusé' });
    const { is_active, title, advantage, valid_until } = req.body;
    await offer.update({ is_active, title, advantage, valid_until });
    res.json(offer);
  } catch (err) { next(err); }
});

module.exports = router;
