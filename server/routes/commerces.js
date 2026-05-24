const router = require('express').Router();
const { Op } = require('sequelize');
const { Commerce, Category, Subcategory, CommerceImage, Review, Offer } = require('../models');
const { requireAdmin, requireMerchant } = require('../middleware/auth');
const { slugify } = require('../services/slugify');

router.get('/', async (req, res, next) => {
  try {
    const { category, subcategory, search, sort = 'sponsor_rank', page = 1, limit = 20 } = req.query;
    const where = { status: 'active' };
    if (category) where.category_id = category;
    if (subcategory) where.subcategory_id = subcategory;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const order = sort === 'name' ? [['name', 'ASC']] : [['is_sponsored', 'DESC'], ['sponsor_rank', 'ASC'], ['name', 'ASC']];

    const { count, rows } = await Commerce.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Subcategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
        { model: CommerceImage, as: 'images', where: { is_primary: true }, required: false, limit: 1 },
      ],
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ data: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
});

router.get('/map', async (req, res, next) => {
  try {
    const points = await Commerce.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'slug', 'lat', 'lng', 'category_id'],
    });
    res.json(points);
  } catch (err) { next(err); }
});

router.get('/sponsored', async (req, res, next) => {
  try {
    const list = await Commerce.findAll({
      where: { status: 'active', is_sponsored: true },
      include: [{ model: CommerceImage, as: 'images', where: { is_primary: true }, required: false, limit: 1 }],
      order: [['sponsor_rank', 'ASC']],
      limit: 6,
    });
    res.json(list);
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const commerce = await Commerce.findOne({
      where: { slug: req.params.slug, status: 'active' },
      include: [
        { model: Category, as: 'category' },
        { model: Subcategory, as: 'subcategory' },
        { model: CommerceImage, as: 'images', order: [['order_index', 'ASC']] },
        { model: Review, as: 'reviews', where: { status: 'approved' }, required: false, limit: 20 },
        { model: Offer, as: 'offers', where: { is_active: true }, required: false },
      ],
    });
    if (!commerce) return res.status(404).json({ error: 'Commerce introuvable' });
    res.json(commerce);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    const slug = slugify(name);
    const commerce = await Commerce.create({ name, slug, ...rest });
    res.status(201).json(commerce);
  } catch (err) { next(err); }
});

router.put('/:id', requireMerchant, async (req, res, next) => {
  try {
    const commerce = await Commerce.findByPk(req.params.id);
    if (!commerce) return res.status(404).json({ error: 'Commerce introuvable' });
    if (req.user.role === 'merchant') {
      const profile = await req.user.getMerchantProfile();
      if (profile?.commerce_id !== commerce.id) return res.status(403).json({ error: 'Accès refusé' });
    }
    await commerce.update(req.body);
    res.json(commerce);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Commerce.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
