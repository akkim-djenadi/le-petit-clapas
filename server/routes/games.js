const router = require('express').Router();
const { Op } = require('sequelize');
const { Game, TicketOffer, UserTicket, User } = require('../models');
const { requireAuth, requireAdmin, requireMerchant } = require('../middleware/auth');
const { broadcastNotification, notifyUser } = require('../services/notifications');
const { generateQR } = require('../services/qr');

router.get('/active', async (req, res, next) => {
  try {
    const game = await Game.findOne({
      where: { status: 'active' },
      include: [{ model: TicketOffer, as: 'ticketOffer', attributes: ['id', 'title', 'advantage'] }],
    });
    res.json(game || null);
  } catch (err) { next(err); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const games = await Game.findAll({
      include: [
        { model: TicketOffer, as: 'ticketOffer', attributes: ['id', 'title', 'advantage'] },
        { model: User, as: 'winner', attributes: ['id', 'name'], required: false },
      ],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json(games);
  } catch (err) { next(err); }
});

router.post('/', requireMerchant, async (req, res, next) => {
  try {
    const { title, type, content, ticket_offer_id, commerce_id, starts_at, ends_at } = req.body;

    let resolvedOfferId = ticket_offer_id;
    if (!resolvedOfferId) {
      const randomOffer = await TicketOffer.findOne({
        where: { is_active: true, quantity_remaining: { [Op.gt]: 0 } },
        order: require('sequelize').literal('RAND()'),
      });
      if (!randomOffer) return res.status(400).json({ error: 'Aucune offre disponible pour ce jeu' });
      resolvedOfferId = randomOffer.id;
    }

    const game = await Game.create({
      title, type, content, ticket_offer_id: resolvedOfferId,
      commerce_id: commerce_id || null,
      status: 'active', starts_at, ends_at, created_by: req.user.id,
    });

    const offer = await TicketOffer.findByPk(resolvedOfferId);

    await broadcastNotification({
      type: 'game_live',
      title: `🎮 Un jeu vient de démarrer !`,
      message: `Tentez de gagner : "${offer.advantage}" — Jouez maintenant !`,
      game_id: game.id,
    }).catch(() => {});

    res.status(201).json(game);
  } catch (err) { next(err); }
});

router.post('/:id/play', requireAuth, async (req, res, next) => {
  try {
    const game = await Game.findByPk(req.params.id, {
      include: [{ model: TicketOffer, as: 'ticketOffer' }],
    });
    if (!game) return res.status(404).json({ error: 'Jeu introuvable' });
    if (game.status !== 'active') return res.status(400).json({ error: 'Jeu terminé ou non démarré' });
    if (game.winner_id) return res.status(400).json({ error: 'Ce jeu a déjà un gagnant' });

    const { answer } = req.body;

    let isCorrect = false;
    if (game.type === 'quiz') {
      isCorrect = game.content?.answer === answer;
    } else if (game.type === 'enigme') {
      const correct = (game.content?.answer || '').toLowerCase().trim();
      isCorrect = String(answer || '').toLowerCase().trim() === correct;
    } else if (game.type === 'flappy') {
      isCorrect = true;
    }

    if (!isCorrect) return res.status(200).json({ won: false, message: 'Mauvaise réponse, réessayez !' });

    if (game.ticketOffer.quantity_remaining <= 0)
      return res.status(400).json({ error: 'Plus de récompenses disponibles' });

    // Atomic claim: only one winner
    const { sequelize } = require('../models');
    const [claimCount] = await Game.update(
      { winner_id: req.user.id, status: 'ended' },
      { where: { id: game.id, winner_id: null, status: 'active' } }
    );
    if (claimCount === 0) return res.status(409).json({ error: 'Ce jeu a déjà un gagnant' });

    await game.ticketOffer.decrement('quantity_remaining');

    const userTicket = await UserTicket.create({
      user_id: req.user.id,
      ticket_offer_id: game.ticket_offer_id,
      qr_code: generateQR(),
      status: 'pending',
      won_at: new Date(),
    });

    await notifyUser(req.user.id, {
      type: 'ticket_won',
      title: '🎉 Vous avez gagné !',
      message: `Votre récompense "${game.ticketOffer.advantage}" est dans votre coffre.`,
    }).catch(() => {});

    res.status(201).json({ won: true, ticket: userTicket, advantage: game.ticketOffer.advantage });
  } catch (err) { next(err); }
});

module.exports = router;
