const jwt = require('jsonwebtoken');
const { User } = require('../models');

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Non authentifié' });
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(payload.id, { attributes: { exclude: ['password_hash'] } });
    if (!req.user) return res.status(401).json({ error: 'Utilisateur introuvable' });
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Accès refusé' });
  next();
};

const requireAdmin = [requireAuth, requireRole('admin')];
const requireMerchant = [requireAuth, requireRole('merchant', 'admin')];

module.exports = { requireAuth, requireRole, requireAdmin, requireMerchant };
