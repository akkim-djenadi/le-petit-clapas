# Le Petit Clapas — Plan d'Implémentation Phase 1 (Partie 2 : Backend suite)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Lire part1.md avant de commencer.

---

## Task 5 : API Avis & Favoris

**Files:**
- Create: `server/routes/reviews.js`
- Create: `server/routes/favorites.js`
- Test: `server/tests/reviews.test.js`

- [ ] **Étape 1 : Écrire les tests (failing)**

`server/tests/reviews.test.js`:
```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User, Category, Commerce, Review } = require('../models');
const { signToken } = require('../services/auth');

let userToken, adminToken, commerce;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('pass123', 12);
  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password_hash: hash, role: 'admin' });
  const user = await User.create({ name: 'User', email: 'user@test.com', password_hash: hash, role: 'user' });
  adminToken = signToken(admin);
  userToken = signToken(user);
  const cat = await Category.create({ name: 'Resto', slug: 'resto' });
  commerce = await Commerce.create({ name: 'Test Bar', slug: 'test-bar', category_id: cat.id });
});
afterAll(async () => { await sequelize.close(); });

describe('POST /api/reviews', () => {
  test('crée un avis en status pending', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ commerce_id: commerce.id, rating: 4, comment: 'Super endroit !' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  test('refuse rating hors [1-5]', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ commerce_id: commerce.id, rating: 6 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/reviews/:id/moderate', () => {
  test('admin peut approuver un avis', async () => {
    const review = await Review.create({ commerce_id: commerce.id, user_id: 2, rating: 3, comment: 'Ok' });
    const res = await request(app)
      .put(`/api/reviews/${review.id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });
});
```

- [ ] **Étape 2 : Lancer (doit échouer)**

```bash
npm test -- tests/reviews.test.js
```

Résultat attendu : FAIL — routes/reviews.js vide

- [ ] **Étape 3 : Créer server/routes/reviews.js**

```js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Review, User } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/commerce/:id', async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { commerce_id: req.params.id, status: 'approved' },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, [
  body('commerce_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString().trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const review = await Review.create({
      commerce_id: req.body.commerce_id,
      user_id: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
      status: 'pending',
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

router.put('/:id/moderate', requireAdmin, async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Avis introuvable' });
    await review.update({ status: req.body.status });
    res.json(review);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Review.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Étape 4 : Créer server/routes/favorites.js**

```js
const router = require('express').Router();
const { Favorite, Commerce, CommerceImage, Category } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Commerce,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          { model: CommerceImage, as: 'images', where: { is_primary: true }, required: false, limit: 1 },
        ],
      }],
      order: [['created_at', 'DESC']],
    });
    res.json(favorites.map(f => f.Commerce));
  } catch (err) { next(err); }
});

router.post('/:commerce_id', requireAuth, async (req, res, next) => {
  try {
    await Favorite.findOrCreate({
      where: { user_id: req.user.id, commerce_id: req.params.commerce_id },
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:commerce_id', requireAuth, async (req, res, next) => {
  try {
    await Favorite.destroy({ where: { user_id: req.user.id, commerce_id: req.params.commerce_id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Étape 5 : Relancer les tests (doivent passer)**

```bash
npm test -- tests/reviews.test.js
```

Résultat attendu : `PASS` — 3 tests passent.

- [ ] **Étape 6 : Commit**

```bash
git add routes/reviews.js routes/favorites.js tests/reviews.test.js
git commit -m "feat: API avis (modération) et favoris"
```

---

## Task 6 : Cloudinary & Import CSV

**Files:**
- Create: `server/services/cloudinary.js`
- Create: `server/services/csvImport.js`
- Modify: `server/routes/admin.js`
- Test: `server/tests/csvImport.test.js`

- [ ] **Étape 1 : Créer server/services/cloudinary.js**

```js
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFromUrl = async (url, folder = 'petit-clapas') => {
  const result = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: 'image',
    format: 'webp',
    quality: 'auto',
    fetch_format: 'auto',
  });
  return { url: result.secure_url, public_id: result.public_id };
};

const uploadFromBuffer = async (buffer, folder = 'petit-clapas') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: 'image', format: 'webp', quality: 'auto' },
      (err, result) => err ? reject(err) : resolve({ url: result.secure_url, public_id: result.public_id })
    ).end(buffer);
  });
};

const deleteImage = async (public_id) => {
  await cloudinary.uploader.destroy(public_id);
};

module.exports = { uploadFromUrl, uploadFromBuffer, deleteImage };
```

- [ ] **Étape 2 : Écrire les tests CSV (failing)**

`server/tests/csvImport.test.js`:
```js
const { parseCSV, detectColumns, buildGithubImageUrl } = require('../services/csvImport');

describe('detectColumns', () => {
  test('détecte les colonnes standard', () => {
    const headers = ['Nom du commerce', 'Adresse', 'Latitude', 'Longitude', 'Catégorie', 'Photo'];
    const mapping = detectColumns(headers);
    expect(mapping.name).toBe('Nom du commerce');
    expect(mapping.address).toBe('Adresse');
    expect(mapping.lat).toBe('Latitude');
    expect(mapping.lng).toBe('Longitude');
    expect(mapping.category).toBe('Catégorie');
    expect(mapping.image).toBe('Photo');
  });

  test('détecte les colonnes anglaises', () => {
    const headers = ['name', 'address', 'lat', 'lng', 'category'];
    const mapping = detectColumns(headers);
    expect(mapping.name).toBe('name');
    expect(mapping.lat).toBe('lat');
  });
});

describe('buildGithubImageUrl', () => {
  test('construit lURL GitHub raw correctement', () => {
    process.env.GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/akkim-djenadi/le-petit-clapas-/main/images_commerces';
    const url = buildGithubImageUrl('bistrot-paul.jpg');
    expect(url).toBe('https://raw.githubusercontent.com/akkim-djenadi/le-petit-clapas-/main/images_commerces/bistrot-paul.jpg');
  });
});

describe('parseCSV', () => {
  test('parse un CSV simple', async () => {
    const csv = `name,address,lat,lng,category\nLe Bistrot,1 rue Test,43.6,3.88,Restauration`;
    const rows = await parseCSV(Buffer.from(csv));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Le Bistrot');
    expect(rows[0].lat).toBe('43.6');
  });
});
```

- [ ] **Étape 3 : Lancer (doit échouer)**

```bash
npm test -- tests/csvImport.test.js
```

Résultat attendu : FAIL — `Cannot find module '../services/csvImport'`

- [ ] **Étape 4 : Créer server/services/csvImport.js**

```js
const { parse } = require('csv-parse/sync');

const COLUMN_ALIASES = {
  name: ['name', 'nom', 'nom du commerce', 'commerce', 'enseigne'],
  address: ['address', 'adresse', 'adresse complète'],
  lat: ['lat', 'latitude'],
  lng: ['lng', 'lon', 'longitude'],
  category: ['category', 'catégorie', 'categorie', 'type'],
  subcategory: ['subcategory', 'sous-catégorie', 'sous_categorie', 'sous catégorie'],
  phone: ['phone', 'téléphone', 'telephone', 'tel'],
  website: ['website', 'site', 'site web', 'url'],
  email: ['email', 'mail', 'e-mail'],
  description: ['description', 'desc', 'présentation'],
  image: ['image', 'photo', 'img', 'photo principale', 'fichier image'],
};

const detectColumns = (headers) => {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const mapping = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const found = headers.find((h, i) => aliases.includes(lowerHeaders[i]));
    if (found) mapping[field] = found;
  }
  return mapping;
};

const buildGithubImageUrl = (filename) =>
  `${process.env.GITHUB_RAW_BASE}/${filename.trim()}`;

const parseCSV = (buffer) => {
  const content = buffer.toString('utf-8').replace(/^﻿/, ''); // strip BOM
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  return records;
};

const validateRow = (row, mapping) => {
  const errors = [];
  if (!row[mapping.name]) errors.push('Nom manquant');
  if (mapping.lat && row[mapping.lat] && isNaN(parseFloat(row[mapping.lat]))) errors.push('Latitude invalide');
  if (mapping.lng && row[mapping.lng] && isNaN(parseFloat(row[mapping.lng]))) errors.push('Longitude invalide');
  return errors;
};

module.exports = { parseCSV, detectColumns, buildGithubImageUrl, validateRow };
```

- [ ] **Étape 5 : Relancer les tests (doivent passer)**

```bash
npm test -- tests/csvImport.test.js
```

Résultat attendu : `PASS` — 3 tests passent.

- [ ] **Étape 6 : Créer server/routes/admin.js (import CSV + crédits)**

```js
const router = require('express').Router();
const multer = require('multer');
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
        let category = await Category.findOne({ where: { name: { [require('sequelize').Op.like]: row[mapping.category] || '' } } });
        if (!category && mapping.category && row[mapping.category]) {
          category = await Category.create({ name: row[mapping.category], slug: slugify(row[mapping.category]) });
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

        // Image depuis GitHub
        if (mapping.image && row[mapping.image]) {
          try {
            const githubUrl = buildGithubImageUrl(row[mapping.image]);
            const { url, public_id } = await uploadFromUrl(githubUrl, 'petit-clapas/commerces');
            await CommerceImage.create({ commerce_id: commerce.id, cloudinary_url: url, cloudinary_public_id: public_id, is_primary: true });
          } catch {
            // Image non bloquante
          }
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

module.exports = router;
```

- [ ] **Étape 7 : Commit**

```bash
git add services/cloudinary.js services/csvImport.js routes/admin.js tests/csvImport.test.js
git commit -m "feat: service Cloudinary, import CSV intelligent + crédits marchands"
```

---

## Task 7 : Système Tickets (Offres + QR codes)

**Files:**
- Modify: `server/routes/ticketOffers.js`
- Modify: `server/routes/userTickets.js`
- Create: `server/services/qr.js`
- Test: `server/tests/tickets.test.js`

- [ ] **Étape 1 : Créer server/services/qr.js**

```js
const { v4: uuidv4 } = require('uuid');

const generateQR = () => uuidv4();

module.exports = { generateQR };
```

- [ ] **Étape 2 : Écrire les tests (failing)**

`server/tests/tickets.test.js`:
```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User, Category, Commerce, MerchantProfile, TicketOffer, UserTicket } = require('../models');
const { signToken } = require('../services/auth');

let merchantToken, userToken, merchantUser, normalUser, commerce, ticketOffer;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('pass123', 12);
  merchantUser = await User.create({ name: 'Merchant', email: 'merchant@test.com', password_hash: hash, role: 'merchant' });
  normalUser = await User.create({ name: 'User', email: 'user@test.com', password_hash: hash, role: 'user' });
  merchantToken = signToken(merchantUser);
  userToken = signToken(normalUser);
  const cat = await Category.create({ name: 'Resto', slug: 'resto' });
  commerce = await Commerce.create({ name: 'Bar Test', slug: 'bar-test', category_id: cat.id });
  await MerchantProfile.create({ user_id: merchantUser.id, commerce_id: commerce.id, tickets_balance: 10 });
});
afterAll(async () => { await sequelize.close(); });

describe('POST /api/ticket-offers', () => {
  test('merchant crée une offre et débite son solde', async () => {
    const res = await request(app)
      .post('/api/ticket-offers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ title: 'Café offert', advantage: 'Un café offert pour toute commande', quantity_total: 5 });
    expect(res.status).toBe(201);
    expect(res.body.quantity_remaining).toBe(5);
    const profile = await MerchantProfile.findOne({ where: { user_id: merchantUser.id } });
    expect(profile.tickets_balance).toBe(5); // 10 - 5
    ticketOffer = res.body;
  });

  test('refuse si solde insuffisant', async () => {
    const res = await request(app)
      .post('/api/ticket-offers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ title: 'Trop de tickets', advantage: 'x', quantity_total: 100 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/user-tickets/:qr/scan', () => {
  test('scan valide un QR en status used', async () => {
    const offer = await TicketOffer.create({
      commerce_id: commerce.id, title: 'Test', advantage: 'Cadeau',
      quantity_total: 3, quantity_remaining: 3, created_by: merchantUser.id,
    });
    const ticket = await UserTicket.create({
      user_id: normalUser.id, ticket_offer_id: offer.id,
      qr_code: 'test-uuid-1234', status: 'pending', won_at: new Date(),
    });

    const res = await request(app)
      .put(`/api/user-tickets/${ticket.qr_code}/scan`)
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('used');
  });

  test('refuse un QR déjà utilisé', async () => {
    const offer = await TicketOffer.create({
      commerce_id: commerce.id, title: 'Test2', advantage: 'Cadeau2',
      quantity_total: 1, quantity_remaining: 1, created_by: merchantUser.id,
    });
    const ticket = await UserTicket.create({
      user_id: normalUser.id, ticket_offer_id: offer.id,
      qr_code: 'used-uuid-5678', status: 'used', won_at: new Date(), used_at: new Date(),
    });

    const res = await request(app)
      .put(`/api/user-tickets/${ticket.qr_code}/scan`)
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Étape 3 : Lancer (doit échouer)**

```bash
npm test -- tests/tickets.test.js
```

Résultat attendu : FAIL

- [ ] **Étape 4 : Créer server/routes/ticketOffers.js**

```js
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
    const { is_active, title, advantage, valid_until } = req.body;
    await offer.update({ is_active, title, advantage, valid_until });
    res.json(offer);
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Étape 5 : Créer server/routes/userTickets.js**

```js
const router = require('express').Router();
const { UserTicket, TicketOffer, Commerce, MerchantProfile } = require('../models');
const { requireAuth, requireMerchant } = require('../middleware/auth');

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const tickets = await UserTicket.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: TicketOffer, as: 'ticketOffer',
        include: [{ model: Commerce, attributes: ['id', 'name', 'slug', 'address'] }],
      }],
      order: [['won_at', 'DESC']],
    });
    res.json(tickets);
  } catch (err) { next(err); }
});

router.put('/:qr/scan', requireMerchant, async (req, res, next) => {
  try {
    const ticket = await UserTicket.findOne({
      where: { qr_code: req.params.qr },
      include: [{ model: TicketOffer, as: 'ticketOffer' }],
    });

    if (!ticket) return res.status(404).json({ error: 'QR code introuvable' });
    if (ticket.status === 'used') return res.status(409).json({ error: 'QR code déjà utilisé' });
    if (ticket.status === 'expired') return res.status(410).json({ error: 'QR code expiré' });

    // Vérifier que le QR appartient bien à un commerce du marchand
    if (req.user.role === 'merchant') {
      const profile = await MerchantProfile.findOne({ where: { user_id: req.user.id } });
      if (ticket.ticketOffer.commerce_id !== profile?.commerce_id)
        return res.status(403).json({ error: 'Ce ticket ne vous appartient pas' });
    }

    await ticket.update({ status: 'used', used_at: new Date() });
    res.json({ ok: true, status: 'used', advantage: ticket.ticketOffer.advantage });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Étape 6 : Relancer les tests (doivent passer)**

```bash
npm test -- tests/tickets.test.js
```

Résultat attendu : `PASS` — 4 tests passent.

- [ ] **Étape 7 : Commit**

```bash
git add routes/ticketOffers.js routes/userTickets.js services/qr.js tests/tickets.test.js
git commit -m "feat: système de tickets marchands avec QR usage unique"
```

---

## Task 8 : Jeux, Socket.io & Web Push

**Files:**
- Create: `server/socket/index.js`
- Create: `server/services/notifications.js`
- Modify: `server/routes/games.js`
- Modify: `server/routes/notifications.js`
- Test: `server/tests/games.test.js`

- [ ] **Étape 1 : Créer server/socket/index.js**

```js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch { /* socket non authentifiée mais acceptée */ }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`);
    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io non initialisé');
  return io;
};

module.exports = { initSocket, getIO };
```

- [ ] **Étape 2 : Créer server/services/notifications.js**

```js
const webpush = require('web-push');
const { PushSubscription, Notification, UserNotification, User } = require('../models');
const { getIO } = require('../socket');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const broadcastNotification = async ({ type, title, message, game_id = null, commerce_id = null }) => {
  // 1. Sauvegarder en base
  const notif = await Notification.create({ type, title, message, game_id, commerce_id, is_broadcast: true });

  // 2. Socket.io temps réel
  try {
    getIO().emit('notification:new', { id: notif.id, type, title, message, game_id, commerce_id });
  } catch { /* socket non dispo en test */ }

  // 3. Web Push pour les abonnés hors-app
  const subscriptions = await PushSubscription.findAll();
  const payload = JSON.stringify({ title, body: message, data: { type, game_id, commerce_id } });

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410) await sub.destroy(); // subscription expirée
      })
    )
  );

  return notif;
};

const notifyUser = async (userId, { type, title, message }) => {
  const notif = await Notification.create({ type, title, message, is_broadcast: false });
  await UserNotification.create({ user_id: userId, notification_id: notif.id });
  try {
    getIO().to(`user:${userId}`).emit('notification:new', { type, title, message });
  } catch {}
};

module.exports = { broadcastNotification, notifyUser };
```

- [ ] **Étape 3 : Écrire les tests jeux (failing)**

`server/tests/games.test.js`:
```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User, Category, Commerce, MerchantProfile, TicketOffer, Game } = require('../models');
const { signToken } = require('../services/auth');

let adminToken, userToken, adminUser, normalUser, commerce, ticketOffer;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('pass123', 12);
  adminUser = await User.create({ name: 'Admin', email: 'admin@test.com', password_hash: hash, role: 'admin' });
  normalUser = await User.create({ name: 'User', email: 'user@test.com', password_hash: hash, role: 'user' });
  adminToken = signToken(adminUser);
  userToken = signToken(normalUser);
  const cat = await Category.create({ name: 'Resto', slug: 'resto' });
  commerce = await Commerce.create({ name: 'Bar Test', slug: 'bar-test', category_id: cat.id });
  const mp = await MerchantProfile.create({ user_id: adminUser.id, commerce_id: commerce.id, tickets_balance: 0 });
  ticketOffer = await TicketOffer.create({
    commerce_id: commerce.id, title: 'Café offert', advantage: 'Un café',
    quantity_total: 5, quantity_remaining: 5, created_by: adminUser.id,
  });
});
afterAll(async () => { await sequelize.close(); });

describe('POST /api/games', () => {
  test('admin crée un jeu quiz', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Quiz Montpellier', type: 'quiz',
        ticket_offer_id: ticketOffer.id,
        content: { question: 'Combien de km2 fait Montpellier ?', options: ['56', '62', '74', '45'], answer: 0 },
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 3600000).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active');
  });

  test('refuse un user normal', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Triche', type: 'quiz', starts_at: new Date(), ends_at: new Date() });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/games/active', () => {
  test('retourne le jeu en cours', async () => {
    const res = await request(app).get('/api/games/active');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/games/:id/play', () => {
  test('user peut jouer et potentiellement gagner', async () => {
    const game = await Game.findOne({ where: { status: 'active' } });
    if (!game) return;
    const res = await request(app)
      .post(`/api/games/${game.id}/play`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ answer: 0 });
    expect([200, 201]).toContain(res.status);
  });
});
```

- [ ] **Étape 4 : Lancer (doit échouer)**

```bash
npm test -- tests/games.test.js
```

Résultat attendu : FAIL

- [ ] **Étape 5 : Créer server/routes/games.js**

```js
const router = require('express').Router();
const { Game, TicketOffer, UserTicket, Notification, User } = require('../models');
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

    // Si ticket_offer_id absent → tirage aléatoire parmi les offres actives
    let resolvedOfferId = ticket_offer_id;
    if (!resolvedOfferId) {
      const randomOffer = await TicketOffer.findOne({
        where: { is_active: true, quantity_remaining: { [require('sequelize').Op.gt]: 0 } },
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

    // Notifier tous les utilisateurs
    await broadcastNotification({
      type: 'game_live',
      title: `🎮 Un jeu vient de démarrer !`,
      message: `Tentez de gagner : "${offer.advantage}" — Jouez maintenant !`,
      game_id: game.id,
    }).catch(() => {}); // non bloquant

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

    // Vérification de la réponse selon le type
    let isCorrect = false;
    if (game.type === 'quiz') {
      isCorrect = game.content?.answer === answer;
    } else if (game.type === 'enigme') {
      const correct = (game.content?.answer || '').toLowerCase().trim();
      isCorrect = (String(answer || '')).toLowerCase().trim() === correct;
    } else if (game.type === 'flappy') {
      // Pour flappy : le premier à soumettre son score gagne
      isCorrect = true;
    }

    if (!isCorrect) return res.status(200).json({ won: false, message: 'Mauvaise réponse, réessayez !' });

    // Désigner le gagnant
    await game.update({ winner_id: req.user.id, status: 'ended' });

    // Décrémenter le stock du ticket
    if (game.ticketOffer.quantity_remaining > 0) {
      await game.ticketOffer.decrement('quantity_remaining');
    }

    // Créer le ticket utilisateur
    const userTicket = await UserTicket.create({
      user_id: req.user.id,
      ticket_offer_id: game.ticket_offer_id,
      qr_code: generateQR(),
      status: 'pending',
      won_at: new Date(),
    });

    // Notifier le gagnant
    await notifyUser(req.user.id, {
      type: 'ticket_won',
      title: '🎉 Vous avez gagné !',
      message: `Votre récompense "${game.ticketOffer.advantage}" est dans votre coffre.`,
    }).catch(() => {});

    res.status(201).json({ won: true, ticket: userTicket, advantage: game.ticketOffer.advantage });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Étape 6 : Créer server/routes/notifications.js**

```js
const router = require('express').Router();
const { Notification, UserNotification, PushSubscription } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userNotifs = await UserNotification.findAll({
      where: { user_id: req.user.id, is_read: false },
      include: [{ model: Notification, as: 'notification' }],
      order: [['id', 'DESC']],
      limit: 20,
    });
    // + broadcast non lues
    const broadcastNotifs = await Notification.findAll({
      where: { is_broadcast: true },
      order: [['created_at', 'DESC']],
      limit: 10,
    });
    res.json({ personal: userNotifs, broadcast: broadcastNotifs });
  } catch (err) { next(err); }
});

router.put('/read', requireAuth, async (req, res, next) => {
  try {
    await UserNotification.update({ is_read: true, read_at: new Date() }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/push/subscribe', async (req, res, next) => {
  try {
    const { endpoint, p256dh, auth } = req.body;
    if (!endpoint || !p256dh || !auth) return res.status(400).json({ error: 'Données manquantes' });
    await PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: { user_id: req.user?.id || null, p256dh, auth },
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
```

- [ ] **Étape 7 : Relancer les tests (doivent passer)**

```bash
npm test -- tests/games.test.js
```

Résultat attendu : `PASS` — 3-4 tests passent.

- [ ] **Étape 8 : Lancer tous les tests backend**

```bash
npm test
```

Résultat attendu : tous les tests passent.

- [ ] **Étape 9 : Commit**

```bash
git add socket/index.js services/notifications.js routes/games.js routes/notifications.js tests/games.test.js
git commit -m "feat: jeux flash, Socket.io temps réel et Web Push notifications"
```

---

## Checkpoint Backend

À ce stade, le backend complet est opérationnel :

- ✅ 16 tables MySQL synchronisées
- ✅ Auth JWT + Google OAuth
- ✅ API REST complète (commerces, catégories, avis, favoris, tickets, jeux)
- ✅ Import CSV avec images GitHub → Cloudinary
- ✅ Système de crédits marchands
- ✅ QR codes usage unique
- ✅ Socket.io + Web Push notifications
- ✅ Tests Jest + Supertest

**Démarrer le serveur localement :**
```bash
npm run dev
# → Serveur sur :4000, MySQL connecté, tables synchronisées
```

**La Partie 3 (frontend React) peut commencer indépendamment.**
