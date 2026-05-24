const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Review, User } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET reviews for a commerce (public — only approved)
router.get('/commerce/:id', async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { commerce_id: req.params.id, status: 'approved' },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

// GET pending reviews for admin
router.get('/pending', requireAdmin, async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

// POST create review (auth required)
router.post('/', requireAuth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('commerce_id').isInt(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { commerce_id, rating, comment } = req.body;
    const review = await Review.create({
      commerce_id,
      user_id: req.user.id,
      rating,
      comment,
      status: 'pending',
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

// PUT moderate review (admin only)
router.put('/:id/moderate', requireAdmin, async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Avis introuvable' });
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    await review.update({ status });
    res.json(review);
  } catch (err) { next(err); }
});

// GET my reviews (merchant sees reviews for their commerce)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

module.exports = router;
