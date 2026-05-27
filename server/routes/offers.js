const router = require('express').Router();
const { Offer } = require('../models');
const { requireMerchant } = require('../middleware/auth');

router.get('/commerce/:id', async (req, res, next) => {
  try { res.json(await Offer.findAll({ where: { commerce_id: req.params.id, is_active: true } })); } catch (err) { next(err); }
});

router.post('/', requireMerchant, async (req, res, next) => {
  try { res.status(201).json(await Offer.create(req.body)); } catch (err) { next(err); }
});

module.exports = router;
