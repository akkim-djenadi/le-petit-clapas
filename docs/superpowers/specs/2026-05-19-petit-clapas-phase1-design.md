# Le Petit Clapas — Spécification Phase 1 : Socle + City Guide

**Date :** 2026-05-19  
**Domaine :** `lepetitclapas.lagenceduclapas.fr`  
**Périmètre :** Phase 1 sur 4 — Fondations + City Guide complet + Système tickets/jeux/notifications

---

## 1. Vision & Objectif

Le Petit Clapas est un city guide sélectif dédié aux commerces authentiques et lieux secrets de Montpellier. La Phase 1 livre un produit complet et monétisable : exploration de commerces, fiches détaillées, système de tickets d'avantages liés à des jeux en temps réel, et notifications push.

**Phases suivantes (hors scope Phase 1) :**
- Phase 2 : Gamification complète (Hall of Fame, points, Flash Games avancés)
- Phase 3 : Dashboard admin complet + portail commerçant évolué + Stripe
- Phase 4 : Apps React Native iOS + Android

---

## 2. Architecture Technique

### Stack

| Couche | Technologie | Hébergement |
|--------|-------------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons | Vercel (free) |
| Backend | Node.js, Express, Socket.io, Passport.js, web-push | Railway (free) |
| Base de données | MySQL + Sequelize ORM | Railway (free) |
| Images | Cloudinary SDK | Cloudinary (free 25 GB) |
| Carte | Leaflet + OpenStreetMap | CDN public |
| Auth | JWT (email/mdp) + OAuth2 Google | — |

### Déploiement

- **Frontend :** `lepetitclapas.lagenceduclapas.fr` → Vercel, CDN mondial, déploiement auto sur push `main`
- **API :** `api.lepetitclapas.lagenceduclapas.fr` → Railway, déploiement auto sur push `main`
- **CI/CD :** GitHub → Vercel + Railway (webhooks natifs, zéro configuration)

### Flux de données

```
Navigateur → Vercel CDN (React) → fetch/Axios → Railway API (Express) → MySQL
                                                                       ↗ Cloudinary (images)
                                 ← Socket.io (temps réel jeux/notifs)
```

---

## 3. Modèle de Données (MySQL — 16 tables)

### 3.1 Utilisateurs & Rôles

```sql
-- Trois rôles : user | merchant | admin
users (
  id INT PK AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),     -- nullable pour OAuth
  google_id VARCHAR(255),         -- nullable pour email/mdp
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  role ENUM('user','merchant','admin') DEFAULT 'user',
  created_at DATETIME
)

-- Lien merchant ↔ commerce (1:1)
merchant_profiles (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users UNIQUE,
  commerce_id INT FK commerces UNIQUE,
  tickets_balance INT DEFAULT 0,  -- solde de tickets achetés
  created_at DATETIME
)
```

**Rôles :**
- `user` : favoris, avis, jeux, coffre de tickets
- `merchant` : portail pro, créer offres, gérer tickets, voir ses stats
- `admin` : accès complet, import CSV, créditer marchands, modération

### 3.2 Catalogue

```sql
categories (
  id INT PK AUTO_INCREMENT,
  name VARCHAR(100),       -- Restauration, Shopping, Nuit, Loisirs, Culture
  slug VARCHAR(100) UNIQUE,
  icon VARCHAR(50),
  order_index INT
)

subcategories (
  id INT PK AUTO_INCREMENT,
  category_id INT FK categories,
  name VARCHAR(100),
  slug VARCHAR(100) UNIQUE,
  icon VARCHAR(50),
  order_index INT
)

commerces (
  id INT PK AUTO_INCREMENT,
  name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  category_id INT FK categories,
  subcategory_id INT FK subcategories,  -- nullable
  description TEXT,
  address VARCHAR(500),
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  phone VARCHAR(30),
  website VARCHAR(500),
  email VARCHAR(255),
  hours JSON,              -- { lun: "9h-19h", mar: "9h-19h", ... }
  is_sponsored BOOLEAN DEFAULT false,
  sponsor_rank INT,        -- ordre d'affichage en tête de liste
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME,
  updated_at DATETIME
)

commerce_images (
  id INT PK AUTO_INCREMENT,
  commerce_id INT FK commerces,
  cloudinary_url VARCHAR(500),
  cloudinary_public_id VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  order_index INT
)
```

### 3.3 Social

```sql
reviews (
  id INT PK AUTO_INCREMENT,
  commerce_id INT FK commerces,
  user_id INT FK users,
  rating TINYINT,          -- 1 à 5
  comment TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at DATETIME
)

favorites (
  user_id INT FK users,
  commerce_id INT FK commerces,
  created_at DATETIME,
  PRIMARY KEY (user_id, commerce_id)
)

offers (
  id INT PK AUTO_INCREMENT,
  commerce_id INT FK commerces,
  title VARCHAR(255),
  description TEXT,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true
)
```

### 3.4 Système Tickets & Abonnements

```sql
-- Historique des crédits achetés par les marchands
credit_transactions (
  id INT PK AUTO_INCREMENT,
  merchant_id INT FK users,
  amount INT,              -- positif = crédit, négatif = débit
  type ENUM('credit','debit'),
  note VARCHAR(500),       -- ex: "Pack Pro 50 tickets - Mai 2026"
  price_paid DECIMAL(8,2), -- nullable (débit = 0)
  created_by INT FK users, -- admin qui a crédité
  created_at DATETIME
)

-- Offres tickets créées par marchands (puisent dans tickets_balance)
ticket_offers (
  id INT PK AUTO_INCREMENT,
  commerce_id INT FK commerces,
  title VARCHAR(255),
  advantage TEXT,          -- libre : "Café offert", "−20%", "1 acheté = 1 offert"…
  quantity_total INT,
  quantity_remaining INT,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_by INT FK users,
  created_at DATETIME
)

-- Tickets gagnés par les utilisateurs (QR usage unique)
user_tickets (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users,
  ticket_offer_id INT FK ticket_offers,
  qr_code VARCHAR(36) UNIQUE,  -- UUID v4
  status ENUM('pending','used','expired') DEFAULT 'pending',
  won_at DATETIME,
  used_at DATETIME             -- nullable, renseigné au scan
)
```

**Flux crédit :**  
Commerçant paie (hors app Phase 1) → Admin crédite `tickets_balance` via `/admin/credits` + entrée dans `credit_transactions` → Commerçant crée une `ticket_offer` de quantité N → `tickets_balance` décrémenté de N → Utilisateur gagne → QR UUID généré dans `user_tickets` → Commerçant scanne → `status = used`, `used_at` renseigné → QR invalide définitivement.

### 3.5 Jeux & Notifications

```sql
games (
  id INT PK AUTO_INCREMENT,
  title VARCHAR(255),
  type ENUM('quiz','enigme','flappy'),
  content JSON,            -- questions/réponses pour quiz, texte pour énigme, config pour flappy
  ticket_offer_id INT FK ticket_offers,  -- lot à gagner (nullable : tirage aléatoire si absent)
  commerce_id INT FK commerces,          -- nullable (jeu admin global)
  status ENUM('scheduled','active','ended') DEFAULT 'scheduled',
  winner_id INT FK users,                -- nullable jusqu'à fin du jeu
  starts_at DATETIME,
  ends_at DATETIME,
  created_by INT FK users,
  created_at DATETIME
)

notifications (
  id INT PK AUTO_INCREMENT,
  type ENUM('game_live','ticket_won','offer_new','announcement'),
  title VARCHAR(255),
  message TEXT,
  game_id INT FK games,              -- nullable
  commerce_id INT FK commerces,      -- nullable
  is_broadcast BOOLEAN DEFAULT true,
  created_at DATETIME
)

user_notifications (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users,
  notification_id INT FK notifications,
  is_read BOOLEAN DEFAULT false,
  read_at DATETIME
)

push_subscriptions (
  id INT PK AUTO_INCREMENT,
  user_id INT FK users,  -- nullable (avant connexion)
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  created_at DATETIME
)
```

**Flux jeu :**  
Admin/commerçant crée un jeu lié à une `ticket_offer` (ou tirage aléatoire parmi offres actives) → Statut passe à `active` → Socket.io émet `game:live` à tous les clients connectés + Web Push aux abonnés hors-app → Bannière animée apparaît → Utilisateur joue → Gagnant désigné → `user_ticket` créé avec QR UUID → `status = ended`.

---

## 4. Pages Frontend (React Router)

### Espace Public
| Route | Contenu |
|-------|---------|
| `/` | Hero avec commerces sponsorisés, barre recherche, raccourcis catégories, sélection éditoriale |
| `/explorer` | Toggle Vue Liste ↔ Vue Carte (Leaflet), filtres catégorie + sous-catégorie, tri, infinite scroll |
| `/commerce/:slug` | Galerie Cloudinary, infos complètes, horaires, carte mini Leaflet, bouton itinéraire, avis, offres, bouton Favori |
| `/connexion` | Email + mdp, bouton Google |
| `/inscription` | Email + mdp + nom, bouton Google |

### Espace Utilisateur (protégé JWT)
| Route | Contenu |
|-------|---------|
| `/profil` | Avatar, nom, mes avis, historique |
| `/favoris` | Commerces sauvegardés |
| `/coffre` | Tickets gagnés avec QR code, statut (pending/used/expired) |

### Espace Admin (role=admin)
| Route | Contenu |
|-------|---------|
| `/admin` | Dashboard : stats vues/favoris/avis, commerces récents, modération en attente |
| `/admin/commerces` | Liste + recherche + CRUD |
| `/admin/import` | Import CSV 4 étapes : upload → mappage → prévisualisation → import+images |
| `/admin/avis` | File de modération (approuver / rejeter) |
| `/admin/categories` | CRUD catégories + sous-catégories, réordonnancement drag & drop |
| `/admin/abonnements` | Soldes marchands, créditer, historique transactions, alerte solde faible |
| `/admin/jeux` | Créer / suivre les jeux flash, voir gagnants |

### Portail Commerçant (role=merchant)
| Route | Contenu |
|-------|---------|
| `/pro/dashboard` | Stats de sa fiche : vues, favoris, tickets actifs, solde restant |
| `/pro/tickets` | Créer / modifier / désactiver ses ticket_offers |
| `/pro/offres` | Gérer ses offres spéciales |
| `/pro/avis` | Consulter ses avis clients |
| `/pro/scanner` | Scanner QR codes clients *(Phase 2)* |

**Navigation mobile :** Bottom navigation bar 4 onglets — Accueil · Explorer · Favoris · Profil.

---

## 5. API REST (Express)

Toutes les routes JSON. Auth via header `Authorization: Bearer <jwt>`. Middleware de rôle : `requireAuth`, `requireMerchant`, `requireAdmin`.

### Auth — `/api/auth`
- `POST /register` — Inscription email
- `POST /login` — Connexion email → JWT
- `GET /google` — Redirect OAuth2
- `GET /google/callback` — Callback → JWT
- `GET /me` — Profil connecté `[user]`

### Commerces — `/api/commerces`
- `GET /` — Liste paginée, params: `?category=&subcategory=&search=&sort=&page=`
- `GET /map` — Tous les points GPS (léger)
- `GET /sponsored` — Commerces sponsorisés
- `GET /:slug` — Fiche complète
- `POST /` `[admin]`
- `PUT /:id` `[admin|merchant]`
- `DELETE /:id` `[admin]`

### Catégories — `/api/categories`
- `GET /` — Arbre complet catégories + sous-catégories
- `POST /` `[admin]`
- `PUT /:id` `[admin]`
- `DELETE /:id` `[admin]`
- `POST /:id/subcategories` `[admin]`
- `PUT /reorder` `[admin]`

### Avis — `/api/reviews`
- `GET /commerce/:id` — Avis approuvés d'un commerce
- `POST /` `[user]`
- `PUT /:id/moderate` `[admin]` — `{ status: 'approved'|'rejected' }`
- `DELETE /:id` `[admin]`

### Favoris — `/api/favorites`
- `GET /mine` `[user]`
- `POST /:commerce_id` `[user]`
- `DELETE /:commerce_id` `[user]`

### Tickets & Jeux — `/api/ticket-offers` · `/api/games` · `/api/user-tickets`
- `POST /ticket-offers` `[merchant|admin]` — Crée offre, débite `tickets_balance`
- `GET /ticket-offers/mine` `[merchant]`
- `PUT /ticket-offers/:id` `[merchant|admin]`
- `POST /games` `[admin|merchant]` — Lance un jeu. Si `ticket_offer_id` absent, le backend sélectionne aléatoirement une `ticket_offer` active du commerce (ou du pool global si jeu admin). Émet `game:live` via Socket.io + Web Push.
- `GET /games/active` — Jeu en cours
- `POST /games/:id/play` `[user]` — Soumettre réponse, désigner gagnant, créer `user_ticket`
- `GET /user-tickets/mine` `[user]` — Mon coffre
- `PUT /user-tickets/:qr/scan` `[merchant]` — Valider QR → `status = used` (usage unique)

### Admin — `/api/admin`
- `POST /credits` `[admin]` — Créditer un merchant
- `GET /credits/:merchant_id` `[admin]` — Historique transactions
- `POST /import-csv` `[admin]` — Import CSV multipart → parse → BDD → images GitHub→Cloudinary
- `GET /stats` `[admin]` — KPIs globaux

### Notifications — `/api/notifications`
- `GET /` `[user]` — Mes notifications non lues
- `PUT /read` `[user]` — Marquer toutes lues
- `POST /push/subscribe` — Enregistrer clés Web Push

---

## 6. Temps Réel (Socket.io)

**Événements serveur → clients :**
- `game:live` — `{ game_id, title, type, ticket_offer: { advantage }, ends_at }` — Bannière animée
- `game:ended` — `{ game_id, winner_name }` — Annonce gagnant
- `notification:new` — Générique pour toute nouvelle notification

**Événements clients → serveur :**
- `user:connected` — Authentifie la socket avec JWT pour notifications ciblées

---

## 7. Import CSV — Moteur Intelligent

**Étape 1 — Upload :** Multipart/form-data, encodage auto-détecté (UTF-8 / Latin-1), lib `csv-parse`.

**Étape 2 — Mappage :** Détection automatique des colonnes par similarité de nom (`nom` ≈ `name`, `adresse` ≈ `address`, `lat`/`latitude`…). Interface de correction si ambiguïté. Colonnes attendues : nom, adresse, lat, lng, catégorie, sous-catégorie, téléphone, site, email, description, image (nom de fichier).

**Étape 3 — Prévisualisation :** Retourne les 5 premières lignes parsées + rapport d'erreurs (lignes invalides, coordonnées manquantes).

**Étape 4 — Import :** Pour chaque ligne valide :
1. Upsert commerce (slug auto-généré depuis nom)
2. Résolution catégorie/sous-catégorie (créée si inexistante)
3. Pour chaque nom de fichier image : construire URL raw GitHub → `https://raw.githubusercontent.com/akkim-djenadi/le-petit-clapas-/main/images_commerces/<filename>` → télécharger → upload Cloudinary → stocker URL dans `commerce_images`

---

## 8. Identité Visuelle

**Direction :** Méditerranée Éditoriale

| Élément | Valeur |
|---------|--------|
| Couleur principale | `#1C3A5E` — Bleu nuit méditerranéen |
| Couleur accent | `#C4603A` — Terre cuite |
| Couleur secondaire | `#F2C078` — Sable doré |
| Fond | `#F2EDE4` — Crème |
| Typographie titres | Playfair Display (Google Fonts, Serif) |
| Typographie corps | Inter (Google Fonts, Sans-Serif) |
| Animations | Framer Motion — transitions de pages, entrées de cartes |
| Icônes | Lucide React |

**Mobile-first :** Design responsive, bottom navigation bar, touch targets ≥ 44px.

---

## 9. Sécurité

- Mots de passe : `bcrypt` (salt rounds = 12)
- JWT : expiration 7j, refresh token en cookie httpOnly
- Validation entrées : `express-validator` sur toutes les routes POST/PUT
- QR code : UUID v4 côté serveur, validation stricte côté `PUT /scan` (status = pending requis)
- CORS : whitelist `lepetitclapas.lagenceduclapas.fr` uniquement
- Rate limiting : `express-rate-limit` sur `/api/auth` (5 req/min)
- Images : seuls les fichiers image sont acceptés en upload (validation MIME type)

---

## 10. Décomposition des Phases

| Phase | Périmètre | Dépendances |
|-------|-----------|-------------|
| **1 — Ce document** | Socle + City Guide + Tickets + Jeux de base + Notifications | — |
| **2 — Gamification** | Flash Games complets (Flappy Bird goéland, Quiz avancé), Points, Hall of Fame, scanner QR | Phase 1 |
| **3 — Admin & Pro complets** | Stripe abonnements, stats avancées, portail commerçant évolué | Phase 1-2 |
| **4 — Mobile natif** | React Native iOS + Android | Phase 1-2 |
