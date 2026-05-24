const router = require('express').Router();
const { Category, Subcategory } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { slugify } = require('../services/slugify');

router.get('/', async (req, res, next) => {
  try {
    const cats = await Category.findAll({
      include: [{ model: Subcategory, as: 'subcategories', order: [['order_index', 'ASC']] }],
      order: [['order_index', 'ASC']],
    });
    res.json(cats);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, icon, order_index } = req.body;
    const cat = await Category.create({ name, slug: slugify(name), icon, order_index });
    res.status(201).json(cat);
  } catch (err) { next(err); }
});

router.post('/:id/subcategories', requireAdmin, async (req, res, next) => {
  try {
    const { name, icon, order_index } = req.body;
    const sub = await Subcategory.create({ category_id: req.params.id, name, slug: slugify(name), icon, order_index });
    res.status(201).json(sub);
  } catch (err) { next(err); }
});

router.put('/reorder', requireAdmin, async (req, res, next) => {
  try {
    const { order } = req.body;
    await Promise.all(order.map(({ id, order_index }) => Category.update({ order_index }, { where: { id } })));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
    await cat.update(req.body);
    res.json(cat);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
