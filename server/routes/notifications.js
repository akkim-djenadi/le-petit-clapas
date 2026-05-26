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
    await UserNotification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: req.user.id, is_read: false } }
    );
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
