const router = require('express').Router();
const { Favorite, Commerce, CommerceImage, Category } = require('../models');
const { requireAuth } = require('../middleware/auth');

// GET my favorites
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const favorites = await req.user.getFavorites({
      include: [
        { model: CommerceImage, as: 'images', where: { is_primary: true }, required: false, limit: 1 },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
    });
    res.json(favorites);
  } catch (err) { next(err); }
});

// POST add favorite
router.post('/:commerce_id', requireAuth, async (req, res, next) => {
  try {
    const { commerce_id } = req.params;
    await Favorite.findOrCreate({
      where: { user_id: req.user.id, commerce_id },
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE remove favorite
router.delete('/:commerce_id', requireAuth, async (req, res, next) => {
  try {
    await Favorite.destroy({
      where: { user_id: req.user.id, commerce_id: req.params.commerce_id },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET check if a commerce is favorited
router.get('/check/:commerce_id', requireAuth, async (req, res, next) => {
  try {
    const fav = await Favorite.findOne({
      where: { user_id: req.user.id, commerce_id: req.params.commerce_id },
    });
    res.json({ isFavorite: !!fav });
  } catch (err) { next(err); }
});

module.exports = router;
