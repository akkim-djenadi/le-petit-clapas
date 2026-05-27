const router = require('express').Router();
const { requireAuth, requireMerchant, requireAdmin } = require('../middleware/auth');
const { TicketOffer, Commerce, UserTicket, User, MerchantProfile } = require('../models');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// GET /ticket-offers/all — admin: all active offers
router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const offers = await TicketOffer.findAll({
      where: { is_active: true },
      include: [{ model: Commerce, attributes: ['id', 'name'] }],
    });
    res.json(offers);
  } catch (err) { next(err); }
});

// GET /ticket-offers — list active offers for a commerce (public)
router.get('/', async (req, res, next) => {
  try {
    const { commerce_id } = req.query;
    const where = { is_active: true };
    if (commerce_id) where.commerce_id = commerce_id;
    const offers = await TicketOffer.findAll({
      where,
      include: [{ model: Commerce, attributes: ['id', 'name', 'slug'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(offers);
  } catch (err) { next(err); }
});

// GET /ticket-offers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const offer = await TicketOffer.findByPk(req.params.id, {
      include: [{ model: Commerce, attributes: ['id', 'name', 'slug'] }],
    });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    res.json(offer);
  } catch (err) { next(err); }
});

// POST /ticket-offers — merchant creates an offer
router.post('/', requireMerchant, async (req, res, next) => {
  try {
    const { title, advantage, description, quantity, expires_at, commerce_id } = req.body;
    if (!title || !advantage || !quantity || !commerce_id) return res.status(400).json({ error: 'title, advantage, quantity, commerce_id requis' });
    // Verify merchant owns this commerce
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id, commerce_id } });
    if (!profile && req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    // Check ticket balance
    if (profile && profile.tickets_balance < 1) return res.status(402).json({ error: 'Solde de tickets insuffisant' });
    const offer = await TicketOffer.create({
      title, advantage, description: description || null,
      quantity_total: quantity, quantity_remaining: quantity,
      commerce_id, expires_at: expires_at || null, is_active: true,
    });
    // Debit one ticket from merchant balance
    if (profile) await profile.decrement('tickets_balance', { by: 1 });
    res.status(201).json(offer);
  } catch (err) { next(err); }
});

// PUT /ticket-offers/:id — merchant updates offer
router.put('/:id', requireMerchant, async (req, res, next) => {
  try {
    const offer = await TicketOffer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id, commerce_id: offer.commerce_id } });
    if (!profile && req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { title, advantage, description, is_active, expires_at } = req.body;
    await offer.update({ title, advantage, description, is_active, expires_at });
    res.json(offer);
  } catch (err) { next(err); }
});

// POST /ticket-offers/:id/claim — user claims a ticket
router.post('/:id/claim', requireAuth, async (req, res, next) => {
  try {
    const offer = await TicketOffer.findByPk(req.params.id);
    if (!offer || !offer.is_active) return res.status(404).json({ error: 'Offre introuvable ou inactive' });
    if (offer.quantity_remaining < 1) return res.status(409).json({ error: 'Plus de tickets disponibles' });
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) return res.status(410).json({ error: 'Offre expirée' });
    // Check if user already has this offer
    const existing = await UserTicket.findOne({ where: { user_id: req.user.id, ticket_offer_id: offer.id, status: 'active' } });
    if (existing) return res.status(409).json({ error: 'Vous avez déjà ce ticket' });
    const qrToken = uuidv4();
    const qrCode = await QRCode.toDataURL(qrToken);
    // Atomic decrement + create
    const [updated] = await TicketOffer.update(
      { quantity_remaining: offer.quantity_remaining - 1 },
      { where: { id: offer.id, quantity_remaining: offer.quantity_remaining } }
    );
    if (!updated) return res.status(409).json({ error: 'Conflit, réessayez' });
    const ticket = await UserTicket.create({
      user_id: req.user.id,
      ticket_offer_id: offer.id,
      qr_token: qrToken,
      qr_code: qrCode,
      status: 'active',
    });
    res.status(201).json(ticket);
  } catch (err) { next(err); }
});

// POST /ticket-offers/scan/:token — merchant scans QR
router.post('/scan/:token', requireMerchant, async (req, res, next) => {
  try {
    const ticket = await UserTicket.findOne({
      where: { qr_token: req.params.token },
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: TicketOffer, as: 'ticketOffer', include: [{ model: Commerce, attributes: ['id', 'name'] }] },
      ],
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' });
    if (ticket.status === 'used') return res.status(410).json({ error: 'Ticket déjà utilisé', ticket });
    if (ticket.status === 'expired') return res.status(410).json({ error: 'Ticket expiré', ticket });
    // Verify merchant owns the commerce
    const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id, commerce_id: ticket.ticketOffer?.commerce_id } });
    if (!profile && req.user.role !== 'admin') return res.status(403).json({ error: 'Ce ticket ne concerne pas votre commerce' });
    // Atomic mark as used
    const [updated] = await UserTicket.update(
      { status: 'used', used_at: new Date() },
      { where: { id: ticket.id, status: 'active' } }
    );
    if (!updated) return res.status(410).json({ error: 'Ticket déjà utilisé' });
    await ticket.reload();
    res.json({ message: 'Ticket validé', ticket });
  } catch (err) { next(err); }
});

module.exports = router;
