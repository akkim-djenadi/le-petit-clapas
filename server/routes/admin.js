const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { sequelize, User, Commerce, MerchantProfile, CreditTransaction, Review, Category, Subcategory, Game } = require('../models');
const { Op } = require('sequelize');

// GET /admin/stats
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [totalCommerces, totalUsers, pendingReviews, activeGames] = await Promise.all([
      Commerce.count({ where: { status: 'active' } }),
      User.count({ where: { role: 'user' } }),
      Review.count({ where: { status: 'pending' } }),
      Game.count({ where: { status: 'active' } }),
    ]);
    res.json({ totalCommerces, totalUsers, pendingReviews, activeGames });
  } catch (err) { next(err); }
});

// GET /admin/merchants
router.get('/merchants', requireAdmin, async (req, res, next) => {
  try {
    const merchants = await MerchantProfile.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Commerce, as: 'commerce', attributes: ['id', 'name'] },
      ],
      order: [['tickets_balance', 'ASC']],
    });
    res.json(merchants);
  } catch (err) { next(err); }
});

// POST /admin/credits
router.post('/credits', requireAdmin, async (req, res, next) => {
  try {
    const { merchant_id, amount, note, price_paid } = req.body;
    if (!merchant_id || !amount || amount < 1) return res.status(400).json({ error: 'merchant_id et amount requis' });
    const profile = await MerchantProfile.findOne({ where: { user_id: merchant_id } });
    if (!profile) return res.status(404).json({ error: 'Marchand introuvable' });
    const tx = await sequelize.transaction(async (t) => {
      await profile.increment('tickets_balance', { by: amount, transaction: t });
      return CreditTransaction.create({
        merchant_id,
        amount,
        type: 'credit',
        note: note || null,
        price_paid: price_paid || null,
        created_by: req.user.id,
      }, { transaction: t });
    });
    res.status(201).json(tx);
  } catch (err) { next(err); }
});

// GET /admin/credits/:id
router.get('/credits/:id', requireAdmin, async (req, res, next) => {
  try {
    const txs = await CreditTransaction.findAll({
      where: { merchant_id: req.params.id },
      order: [['created_at', 'DESC']],
    });
    res.json(txs);
  } catch (err) { next(err); }
});

// GET /admin/reviews
router.get('/reviews', requireAdmin, async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const reviews = await Review.findAll({
      where: { status },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: Commerce, attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

// POST /admin/import-csv/preview
const multer = require('multer');
const csv = require('csv-parse/sync');
const { slugify } = require('../services/slugify');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/import-csv/preview', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier CSV requis' });
    const records = csv.parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true });
    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    // Auto-map headers by guessing common names
    const autoMapping = {};
    const guesses = { name: ['nom','name','title'], address: ['adresse','address'], lat: ['lat','latitude'], lng: ['lng','lon','longitude'], category: ['categorie','category'], subcategory: ['sous_categorie','subcategory','sous-catégorie'], phone: ['telephone','phone','tel'], website: ['site','website','url'], email: ['email','mail'], description: ['description','desc'], image: ['image','photo','img'] };
    for (const [field, candidates] of Object.entries(guesses)) {
      const found = headers.find(h => candidates.includes(h.toLowerCase().replace(/[éèê]/g, 'e').replace(/\s+/g, '_')));
      if (found) autoMapping[field] = found;
    }
    const preview = records.slice(0, 10).map(row => ({ row, errors: [] }));
    res.json({ headers, mapping: autoMapping, preview, total: records.length });
  } catch (err) { next(err); }
});

// POST /admin/import-csv/execute
router.post('/import-csv/execute', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier CSV requis' });
    const mapping = JSON.parse(req.body.mapping || '{}');
    const records = csv.parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true });
    let created = 0, skipped = 0;
    const errors = [];
    for (const row of records) {
      try {
        const name = mapping.name ? row[mapping.name] : null;
        if (!name) { skipped++; continue; }
        const existing = await Commerce.findOne({ where: { name } });
        if (existing) { skipped++; continue; }
        // Resolve category
        let categoryId = null, subcategoryId = null;
        if (mapping.category && row[mapping.category]) {
          const catName = row[mapping.category];
          const [cat] = await Category.findOrCreate({ where: { name: catName }, defaults: { name: catName, slug: slugify(catName) } });
          categoryId = cat.id;
          if (mapping.subcategory && row[mapping.subcategory]) {
            const subName = row[mapping.subcategory];
            const [sub] = await Subcategory.findOrCreate({ where: { name: subName, category_id: categoryId }, defaults: { name: subName, category_id: categoryId, slug: slugify(subName) } });
            subcategoryId = sub.id;
          }
        }
        const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
        await Commerce.create({
          name,
          slug,
          address: mapping.address ? row[mapping.address] : null,
          lat: mapping.lat ? parseFloat(row[mapping.lat]) || null : null,
          lng: mapping.lng ? parseFloat(row[mapping.lng]) || null : null,
          phone: mapping.phone ? row[mapping.phone] : null,
          website: mapping.website ? row[mapping.website] : null,
          email: mapping.email ? row[mapping.email] : null,
          description: mapping.description ? row[mapping.description] : null,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          status: 'active',
        });
        created++;
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    }
    res.json({ created, skipped, errors });
  } catch (err) { next(err); }
});

module.exports = router;
