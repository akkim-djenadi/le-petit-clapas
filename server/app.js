require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const commerceRoutes = require('./routes/commerces');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');
const ticketOfferRoutes = require('./routes/ticketOffers');
const gameRoutes = require('./routes/games');
const userTicketRoutes = require('./routes/userTickets');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

require('./config/passport')(passport);

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

const authLimiter = rateLimit({ windowMs: 60_000, max: 5 });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/commerces', commerceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ticket-offers', ticketOfferRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/user-tickets', userTicketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

const merchantRoutes = require('./routes/merchant');
const offerRoutes = require('./routes/offers');
app.use('/api/merchant', merchantRoutes);
app.use('/api/offers', offerRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

module.exports = app;
