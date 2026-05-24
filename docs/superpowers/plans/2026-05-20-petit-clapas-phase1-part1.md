# Le Petit Clapas — Plan d'Implémentation Phase 1 (Partie 1 : Backend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le backend complet de Le Petit Clapas — API REST, auth JWT+Google, 16 tables MySQL, système de tickets/jeux/notifications temps réel.

**Architecture:** Monorepo `server/` (Express + Sequelize + Socket.io). Railway pour l'hébergement. Cloudinary pour les images. Tests Jest + Supertest sur base MySQL de test.

**Tech Stack:** Node.js 20, Express 4, Sequelize 6, MySQL 8, Socket.io 4, Passport.js, bcrypt, jsonwebtoken, web-push, csv-parse, uuid, Cloudinary SDK, Jest, Supertest

---

## Task 1 : Scaffolding du projet

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/app.js`
- Create: `server/server.js`
- Create: `client/package.json` *(init seulement)*

- [ ] **Étape 1 : Créer la structure de dossiers**

```bash
mkdir -p server/{config,models,middleware,routes,services,socket,tests}
mkdir -p client
cd server
```

- [ ] **Étape 2 : Initialiser server/package.json**

```bash
cd server && npm init -y
npm install express sequelize mysql2 bcryptjs jsonwebtoken passport passport-google-oauth20 passport-local socket.io web-push csv-parse uuid cloudinary multer cors express-rate-limit express-validator dotenv
npm install --save-dev jest supertest nodemon
```

- [ ] **Étape 3 : Créer server/.env.example**

```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=petitclapas
DB_USER=root
DB_PASS=
DB_NAME_TEST=petitclapas_test
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:contact@lepetitclapas.fr
CLIENT_URL=http://localhost:5173
GITHUB_RAW_BASE=https://raw.githubusercontent.com/akkim-djenadi/le-petit-clapas-/main/images_commerces
```

- [ ] **Étape 4 : Créer server/app.js**

```js
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

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

module.exports = app;
```

- [ ] **Étape 5 : Créer server/server.js**

```js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const { sequelize } = require('./models');

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 4000;

sequelize.authenticate()
  .then(() => {
    console.log('MySQL connecté');
    return sequelize.sync({ alter: true });
  })
  .then(() => server.listen(PORT, () => console.log(`Serveur sur :${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Étape 6 : Ajouter scripts dans server/package.json**

```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js",
  "test": "NODE_ENV=test jest --runInBand --forceExit",
  "test:watch": "NODE_ENV=test jest --watch --runInBand"
},
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/tests/**/*.test.js"]
}
```

- [ ] **Étape 7 : Copier .env.example en .env et remplir les valeurs locales**

```bash
cp .env.example .env
# Remplir DB_USER, DB_PASS, JWT_SECRET
# Générer les clés VAPID :
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"
```

- [ ] **Étape 8 : Créer les bases MySQL locales**

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS petitclapas; CREATE DATABASE IF NOT EXISTS petitclapas_test;"
```

- [ ] **Étape 9 : Commit**

```bash
cd server
git init
echo "node_modules\n.env\n.DS_Store" > .gitignore
git add .
git commit -m "feat: scaffolding projet server"
```

---

## Task 2 : Modèles Sequelize (16 tables)

**Files:**
- Create: `server/config/database.js`
- Create: `server/models/index.js`
- Create: `server/models/User.js`
- Create: `server/models/Category.js`
- Create: `server/models/Subcategory.js`
- Create: `server/models/Commerce.js`
- Create: `server/models/CommerceImage.js`
- Create: `server/models/Review.js`
- Create: `server/models/Favorite.js`
- Create: `server/models/Offer.js`
- Create: `server/models/MerchantProfile.js`
- Create: `server/models/CreditTransaction.js`
- Create: `server/models/TicketOffer.js`
- Create: `server/models/UserTicket.js`
- Create: `server/models/Game.js`
- Create: `server/models/Notification.js`
- Create: `server/models/UserNotification.js`
- Create: `server/models/PushSubscription.js`
- Test: `server/tests/models.test.js`

- [ ] **Étape 1 : Créer server/config/database.js**

```js
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize(
  isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;
```

- [ ] **Étape 2 : Créer server/models/User.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: true },
  google_id: { type: DataTypes.STRING(255), allowNull: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  avatar_url: { type: DataTypes.STRING(500), allowNull: true },
  role: { type: DataTypes.ENUM('user', 'merchant', 'admin'), defaultValue: 'user' },
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = User;
```

- [ ] **Étape 3 : Créer server/models/Category.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  icon: { type: DataTypes.STRING(50), allowNull: true },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'categories', timestamps: false });

module.exports = Category;
```

- [ ] **Étape 4 : Créer server/models/Subcategory.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subcategory = sequelize.define('Subcategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  icon: { type: DataTypes.STRING(50), allowNull: true },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'subcategories', timestamps: false });

module.exports = Subcategory;
```

- [ ] **Étape 5 : Créer server/models/Commerce.js**

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commerce = sequelize.define('Commerce', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  subcategory_id: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  address: { type: DataTypes.STRING(500), allowNull: true },
  lat: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
  lng: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  website: { type: DataTypes.STRING(500), allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: true },
  hours: { type: DataTypes.JSON, allowNull: true },
  is_sponsored: { type: DataTypes.BOOLEAN, defaultValue: false },
  sponsor_rank: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'commerces', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Commerce;
```

- [ ] **Étape 6 : Créer les modèles restants**

`server/models/CommerceImage.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CommerceImage = sequelize.define('CommerceImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  cloudinary_url: { type: DataTypes.STRING(500), allowNull: false },
  cloudinary_public_id: { type: DataTypes.STRING(255), allowNull: false },
  is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'commerce_images', timestamps: false });
module.exports = CommerceImage;
```

`server/models/Review.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.TINYINT, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
}, { tableName: 'reviews', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Review;
```

`server/models/Favorite.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Favorite = sequelize.define('Favorite', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true },
  commerce_id: { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: 'favorites', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Favorite;
```

`server/models/Offer.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Offer = sequelize.define('Offer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  valid_from: { type: DataTypes.DATEONLY, allowNull: true },
  valid_until: { type: DataTypes.DATEONLY, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'offers', timestamps: false });
module.exports = Offer;
```

`server/models/MerchantProfile.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MerchantProfile = sequelize.define('MerchantProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  commerce_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  tickets_balance: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'merchant_profiles', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = MerchantProfile;
```

`server/models/CreditTransaction.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CreditTransaction = sequelize.define('CreditTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  merchant_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false },
  note: { type: DataTypes.STRING(500), allowNull: true },
  price_paid: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'credit_transactions', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = CreditTransaction;
```

`server/models/TicketOffer.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const TicketOffer = sequelize.define('TicketOffer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  advantage: { type: DataTypes.TEXT, allowNull: false },
  quantity_total: { type: DataTypes.INTEGER, allowNull: false },
  quantity_remaining: { type: DataTypes.INTEGER, allowNull: false },
  valid_until: { type: DataTypes.DATEONLY, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'ticket_offers', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = TicketOffer;
```

`server/models/UserTicket.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserTicket = sequelize.define('UserTicket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  ticket_offer_id: { type: DataTypes.INTEGER, allowNull: false },
  qr_code: { type: DataTypes.STRING(36), unique: true, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'used', 'expired'), defaultValue: 'pending' },
  won_at: { type: DataTypes.DATE, allowNull: false },
  used_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'user_tickets', timestamps: false });
module.exports = UserTicket;
```

`server/models/Game.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Game = sequelize.define('Game', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('quiz', 'enigme', 'flappy'), allowNull: false },
  content: { type: DataTypes.JSON, allowNull: true },
  ticket_offer_id: { type: DataTypes.INTEGER, allowNull: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('scheduled', 'active', 'ended'), defaultValue: 'scheduled' },
  winner_id: { type: DataTypes.INTEGER, allowNull: true },
  starts_at: { type: DataTypes.DATE, allowNull: false },
  ends_at: { type: DataTypes.DATE, allowNull: false },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'games', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Game;
```

`server/models/Notification.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('game_live', 'ticket_won', 'offer_new', 'announcement'), allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  game_id: { type: DataTypes.INTEGER, allowNull: true },
  commerce_id: { type: DataTypes.INTEGER, allowNull: true },
  is_broadcast: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'notifications', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = Notification;
```

`server/models/UserNotification.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserNotification = sequelize.define('UserNotification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  notification_id: { type: DataTypes.INTEGER, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'user_notifications', timestamps: false });
module.exports = UserNotification;
```

`server/models/PushSubscription.js`:
```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PushSubscription = sequelize.define('PushSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  endpoint: { type: DataTypes.TEXT, allowNull: false },
  p256dh: { type: DataTypes.TEXT, allowNull: false },
  auth: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'push_subscriptions', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = PushSubscription;
```

- [ ] **Étape 7 : Créer server/models/index.js avec toutes les associations**

```js
const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Subcategory = require('./Subcategory');
const Commerce = require('./Commerce');
const CommerceImage = require('./CommerceImage');
const Review = require('./Review');
const Favorite = require('./Favorite');
const Offer = require('./Offer');
const MerchantProfile = require('./MerchantProfile');
const CreditTransaction = require('./CreditTransaction');
const TicketOffer = require('./TicketOffer');
const UserTicket = require('./UserTicket');
const Game = require('./Game');
const Notification = require('./Notification');
const UserNotification = require('./UserNotification');
const PushSubscription = require('./PushSubscription');

// Catégories
Category.hasMany(Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
Subcategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Commerces
Category.hasMany(Commerce, { foreignKey: 'category_id' });
Commerce.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Subcategory.hasMany(Commerce, { foreignKey: 'subcategory_id' });
Commerce.belongsTo(Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });
Commerce.hasMany(CommerceImage, { foreignKey: 'commerce_id', as: 'images' });
CommerceImage.belongsTo(Commerce, { foreignKey: 'commerce_id' });
Commerce.hasMany(Review, { foreignKey: 'commerce_id', as: 'reviews' });
Commerce.hasMany(Offer, { foreignKey: 'commerce_id', as: 'offers' });
Commerce.hasMany(TicketOffer, { foreignKey: 'commerce_id', as: 'ticketOffers' });
Commerce.hasOne(MerchantProfile, { foreignKey: 'commerce_id' });

// Users
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(MerchantProfile, { foreignKey: 'user_id', as: 'merchantProfile' });
MerchantProfile.belongsTo(User, { foreignKey: 'user_id' });
MerchantProfile.belongsTo(Commerce, { foreignKey: 'commerce_id', as: 'commerce' });
User.hasMany(UserTicket, { foreignKey: 'user_id', as: 'tickets' });
UserTicket.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(PushSubscription, { foreignKey: 'user_id' });

// Favorites (many-to-many)
User.belongsToMany(Commerce, { through: Favorite, foreignKey: 'user_id', as: 'favorites' });
Commerce.belongsToMany(User, { through: Favorite, foreignKey: 'commerce_id' });

// TicketOffers & UserTickets
TicketOffer.hasMany(UserTicket, { foreignKey: 'ticket_offer_id', as: 'userTickets' });
UserTicket.belongsTo(TicketOffer, { foreignKey: 'ticket_offer_id', as: 'ticketOffer' });

// Games
Game.belongsTo(TicketOffer, { foreignKey: 'ticket_offer_id', as: 'ticketOffer' });
Game.belongsTo(User, { foreignKey: 'winner_id', as: 'winner' });

// Notifications
Notification.hasMany(UserNotification, { foreignKey: 'notification_id' });
UserNotification.belongsTo(Notification, { foreignKey: 'notification_id', as: 'notification' });
User.hasMany(UserNotification, { foreignKey: 'user_id' });

module.exports = {
  sequelize, User, Category, Subcategory, Commerce, CommerceImage,
  Review, Favorite, Offer, MerchantProfile, CreditTransaction,
  TicketOffer, UserTicket, Game, Notification, UserNotification, PushSubscription,
};
```

- [ ] **Étape 8 : Écrire le test de synchronisation**

`server/tests/models.test.js`:
```js
const { sequelize } = require('../models');

describe('Database sync', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('syncs all tables without error', async () => {
    await expect(sequelize.sync({ force: true })).resolves.not.toThrow();
  });
});
```

- [ ] **Étape 9 : Lancer le test**

```bash
cd server && npm test -- tests/models.test.js
```

Résultat attendu : `PASS tests/models.test.js`

- [ ] **Étape 10 : Commit**

```bash
git add models/ config/database.js tests/models.test.js
git commit -m "feat: modèles Sequelize 16 tables avec associations"
```

---

## Task 3 : Auth Backend (JWT + bcrypt + Google OAuth)

**Files:**
- Create: `server/config/passport.js`
- Create: `server/middleware/auth.js`
- Create: `server/services/auth.js`
- Create: `server/routes/auth.js`
- Test: `server/tests/auth.test.js`

- [ ] **Étape 1 : Créer server/config/passport.js**

```js
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !user.password_hash) return done(null, false, { message: 'Identifiants invalides' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return done(null, false, { message: 'Identifiants invalides' });
      return done(null, user);
    } catch (err) { return done(err); }
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ where: { google_id: profile.id } });
      if (!user) {
        user = await User.findOne({ where: { email } });
        if (user) {
          await user.update({ google_id: profile.id, avatar_url: profile.photos[0]?.value });
        } else {
          user = await User.create({
            email,
            google_id: profile.id,
            name: profile.displayName,
            avatar_url: profile.photos[0]?.value,
          });
        }
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));
};
```

- [ ] **Étape 2 : Créer server/services/auth.js**

```js
const jwt = require('jsonwebtoken');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

module.exports = { signToken };
```

- [ ] **Étape 3 : Créer server/middleware/auth.js**

```js
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
```

- [ ] **Étape 4 : Écrire le test (failing)**

`server/tests/auth.test.js`:
```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User } = require('../models');

beforeAll(async () => { await sequelize.sync({ force: true }); });
afterAll(async () => { await sequelize.close(); });
afterEach(async () => { await User.destroy({ where: {} }); });

describe('POST /api/auth/register', () => {
  test('crée un utilisateur et retourne un token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice', email: 'alice@test.com', password: 'secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('rejette un email dupliqué', async () => {
    await User.create({ name: 'Alice', email: 'alice@test.com', password_hash: 'x' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice2', email: 'alice@test.com', password: 'secret123',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  test('retourne un token avec identifiants valides', async () => {
    const hash = await bcrypt.hash('secret123', 12);
    await User.create({ name: 'Bob', email: 'bob@test.com', password_hash: hash });
    const res = await request(app).post('/api/auth/login').send({
      email: 'bob@test.com', password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejette un mauvais mot de passe', async () => {
    const hash = await bcrypt.hash('correct', 12);
    await User.create({ name: 'Bob', email: 'bob@test.com', password_hash: hash });
    const res = await request(app).post('/api/auth/login').send({
      email: 'bob@test.com', password: 'wrong',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('retourne le profil si token valide', async () => {
    const hash = await bcrypt.hash('secret123', 12);
    await User.create({ name: 'Carol', email: 'carol@test.com', password_hash: hash });
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'carol@test.com', password: 'secret123' });
    const token = loginRes.body.token;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('carol@test.com');
  });

  test('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Étape 5 : Lancer le test (doit échouer)**

```bash
npm test -- tests/auth.test.js
```

Résultat attendu : FAIL — `Cannot find module '../routes/auth'`

- [ ] **Étape 6 : Créer server/routes/auth.js**

```js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { signToken } = require('../services/auth');
const { requireAuth } = require('../middleware/auth');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').notEmpty().trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, name } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });
    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password_hash, name });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Identifiants invalides' });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  })(req, res, next);
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/connexion?error=oauth` }), (req, res) => {
  const token = signToken(req.user);
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
```

- [ ] **Étape 7 : Relancer le test (doit passer)**

```bash
npm test -- tests/auth.test.js
```

Résultat attendu : `PASS tests/auth.test.js` — 6 tests passent.

- [ ] **Étape 8 : Commit**

```bash
git add config/passport.js middleware/auth.js services/auth.js routes/auth.js tests/auth.test.js
git commit -m "feat: authentification JWT + Google OAuth"
```

---

## Task 4 : API Catégories & Commerces

**Files:**
- Create: `server/routes/categories.js`
- Create: `server/routes/commerces.js`
- Create: `server/services/slugify.js`
- Test: `server/tests/commerces.test.js`

- [ ] **Étape 1 : Créer server/services/slugify.js**

```js
const slugify = (str) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

module.exports = { slugify };
```

- [ ] **Étape 2 : Écrire les tests (failing)**

`server/tests/commerces.test.js`:
```js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const { sequelize, User, Category, Commerce } = require('../models');
const { signToken } = require('../services/auth');

let adminToken, userToken, adminUser;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('admin123', 12);
  adminUser = await User.create({ name: 'Admin', email: 'admin@test.com', password_hash: hash, role: 'admin' });
  adminToken = signToken(adminUser);
  const u = await User.create({ name: 'User', email: 'user@test.com', password_hash: hash, role: 'user' });
  userToken = signToken(u);
  await Category.create({ name: 'Restauration', slug: 'restauration' });
});

afterAll(async () => { await sequelize.close(); });

describe('GET /api/commerces', () => {
  test('retourne une liste paginée', async () => {
    const res = await request(app).get('/api/commerces');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });
});

describe('POST /api/commerces', () => {
  test('crée un commerce (admin)', async () => {
    const res = await request(app)
      .post('/api/commerces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Le Bistrot', category_id: 1, address: '1 rue de la Paix', lat: 43.6, lng: 3.88 });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('le-bistrot');
  });

  test('refuse un user normal', async () => {
    const res = await request(app)
      .post('/api/commerces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test', category_id: 1 });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/commerces/map', () => {
  test('retourne uniquement les coordonnées GPS', async () => {
    const res = await request(app).get('/api/commerces/map');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('lat');
      expect(res.body[0]).toHaveProperty('lng');
      expect(res.body[0]).not.toHaveProperty('description');
    }
  });
});
```

- [ ] **Étape 3 : Lancer (doit échouer)**

```bash
npm test -- tests/commerces.test.js
```

Résultat attendu : FAIL — `Cannot find module '../routes/commerces'`

- [ ] **Étape 4 : Créer server/routes/categories.js**

```js
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

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });
    await cat.update(req.body);
    res.json(cat);
  } catch (err) { next(err); }
});

router.put('/reorder', requireAdmin, async (req, res, next) => {
  try {
    const { order } = req.body; // [{ id, order_index }]
    await Promise.all(order.map(({ id, order_index }) => Category.update({ order_index }, { where: { id } })));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Étape 5 : Créer server/routes/commerces.js**

```js
const router = require('express').Router();
const { Op } = require('sequelize');
const { Commerce, Category, Subcategory, CommerceImage, Review, Offer } = require('../models');
const { requireAuth, requireAdmin, requireMerchant } = require('../middleware/auth');
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
```

- [ ] **Étape 6 : Créer les routes vides restantes (pour que app.js compile)**

```bash
for route in reviews favorites ticketOffers games userTickets admin notifications; do
  echo "const router = require('express').Router(); module.exports = router;" > routes/${route}.js
done
```

- [ ] **Étape 7 : Relancer les tests (doivent passer)**

```bash
npm test -- tests/commerces.test.js
```

Résultat attendu : `PASS tests/commerces.test.js` — 3 tests passent.

- [ ] **Étape 8 : Commit**

```bash
git add routes/categories.js routes/commerces.js routes/reviews.js routes/favorites.js routes/ticketOffers.js routes/games.js routes/userTickets.js routes/admin.js routes/notifications.js services/slugify.js tests/commerces.test.js
git commit -m "feat: API catégories et commerces avec pagination et filtres"
```
