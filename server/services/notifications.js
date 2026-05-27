const webpush = require('web-push');
const { PushSubscription, Notification, UserNotification } = require('../models');
const { getIO } = require('../socket');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL?.startsWith('mailto:') ? process.env.VAPID_EMAIL : `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  } catch { /* invalid keys in dev/test env */ }
}

const broadcastNotification = async ({ type, title, message, game_id = null, commerce_id = null }) => {
  const notif = await Notification.create({ type, title, message, game_id, commerce_id, is_broadcast: true });

  try {
    getIO().emit('notification:new', { id: notif.id, type, title, message, game_id, commerce_id });
  } catch { /* socket not available in test */ }

  const subscriptions = await PushSubscription.findAll();
  const payload = JSON.stringify({ title, body: message, data: { type, game_id, commerce_id } });

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410) await sub.destroy();
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
