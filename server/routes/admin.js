const router = require('express').Router();
const multer = require('multer');
const { Op } = require('sequelize');
const { requireAdmin } = require('../middleware/auth');
const { parseCSV, detectColumns, buildGithubImageUrl, validateRow } = require('../services/csvImport');
const { uploadFromUrl } = require('../services/cloudinary');
const { slugify } = require('../services/slugify');
const {
  Commerce, Category, Subcategory, CommerceImage,
  MerchantProfile, CreditTransaction, Review, User, sequelize,
} = require('../models');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Import CSV ──────────────────────────────────────────────────────────────

router.post('/import-csv/preview', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const rows = await parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'Fichier vide' });
    const headers = Object.keys(rows[0]);
    const mapping = detectColumns(headers);
    const preview = rows.slice(0, 5).map(row => ({
      row,
      errors: validateRow(row, mapping),
    }));
    res.json({ headers, mapping, preview, total: rows.length });
  } catch (err) { next(err); }
});

router.post('/import-csv/execute', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const rows = await parseCSV(req.file.buffer);
    const mapping = JSON.parse(req.body.mapping);
    const results = { created: 0, skipped: 0, errors: [] };

    for (const [i, row] of rows.entries()) {
      const rowErrors = validateRow(row, mapping);
      if (rowErrors.length) { results.errors.push({ row: i + 1, errors: rowErrors }); results.skipped++; continue; }

      try {
        const name = row[mapping.name];
        const slug = slugify(name);
        const existing = await Commerce.findOne({ where: { slug } });
        if (existing) { results.skipped++; continue; }

        // Résoudre catégorie
        let category = null;
        if (mapping.category && row[mapping.category]) {
          category = await Category.findOne({ where: { name: { [Op.like]: row[mapping.category] } } });
          if (!category) {
            category = await Category.create({ name: row[mapping.category], slug: slugify(row[mapping.category]) });
          }
        }

        // Résoudre sous-catégorie
        let subcategory = null;
        if (mapping.subcategory && row[mapping.subcategory] && category) {
          subcategory = await Subcategory.findOne({ where: { name: row[mapping.subcategory], category_id: category.id } });
          if (!subcategory) {
            subcategory = await Subcategory.create({
              name: row[mapping.subcategory],
              slug: slugify(row[mapping.subcategory]),
              category_id: category.id,
            });
          }
        }

        const commerce = await Commerce.create({
          name,
          slug,
          category_id: category?.id,
          subcategory_id: subcategory?.id,
          address: row[mapping.address],
          lat: mapping.lat ? parseFloat(row[mapping.lat]) || null : null,
          lng: mapping.lng ? parseFloat(row[mapping.lng]) || null : null,
          phone: row[mapping.phone],
          website: row[mapping.website],
          email: row[mapping.email],
          description: row[mapping.description],
        });

        // Image depuis GitHub (non bloquant)
        if (mapping.image && row[mapping.image]) {
          const githubUrl = buildGithubImageUrl(row[mapping.image]);
          uploadFromUrl(githubUrl, 'petit-clapas/commerces')
            .then(({ url, public_id }) =>
              CommerceImage.create({ commerce_id: commerce.id, cloudinary_url: url, cloudinary_public_id: public_id, is_primary: true })
            )
            .catch(() => {});
        }

        results.created++;
      } catch (err) {
        results.errors.push({ row: i + 1, errors: [err.message] });
        results.skipped++;
      }
    }

    res.json(results);
  } catch (err) { next(err); }
});

// ── Crédits Marchands ───────────────────────────────────────────────────────

router.post('/credits', requireAdmin, async (req, res, next) => {
  try {
    const { merchant_id, amount, note, price_paid } = req.body;
    if (!merchant_id || !amount || amount <= 0) return res.status(400).json({ error: 'Données invalides' });

    const t = await sequelize.transaction();
    try {
      await CreditTransaction.create({ merchant_id, amount, type: 'credit', note, price_paid, created_by: req.user.id }, { transaction: t });
      await MerchantProfile.increment('tickets_balance', { by: amount, where: { user_id: merchant_id }, transaction: t });
      await t.commit();
    } catch (err) { await t.rollback(); throw err; }

    const profile = await MerchantProfile.findOne({ where: { user_id: merchant_id } });
    res.json({ ok: true, tickets_balance: profile.tickets_balance });
  } catch (err) { next(err); }
});

router.get('/credits/:merchant_id', requireAdmin, async (req, res, next) => {
  try {
    const transactions = await CreditTransaction.findAll({
      where: { merchant_id: req.params.merchant_id },
      order: [['created_at', 'DESC']],
    });
    res.json(transactions);
  } catch (err) { next(err); }
});

// ── Stats globales ──────────────────────────────────────────────────────────

router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [totalCommerces, totalUsers, pendingReviews] = await Promise.all([
      Commerce.count({ where: { status: 'active' } }),
      User.count({ where: { role: 'user' } }),
      Review.count({ where: { status: 'pending' } }),
    ]);
    res.json({ totalCommerces, totalUsers, pendingReviews });
  } catch (err) { next(err); }
});

// ── Gestion Marchands ───────────────────────────────────────────────────────

router.get('/merchants', requireAdmin, async (req, res, next) => {
  try {
    const merchants = await MerchantProfile.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Commerce, as: 'commerce', attributes: ['id', 'name'] },
      ],
    });
    res.json(merchants);
  } catch (err) { next(err); }
});

router.post('/merchants', requireAdmin, async (req, res, next) => {
  try {
    const { user_id, commerce_id } = req.body;
    await User.update({ role: 'merchant' }, { where: { id: user_id } });
    const profile = await MerchantProfile.create({ user_id, commerce_id });
    res.status(201).json(profile);
  } catch (err) { next(err); }
});

// ── Reviews admin ──────────────────────────────────────────────────────────

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

module.exports = router;
