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
  await MerchantProfile.create({ user_id: adminUser.id, commerce_id: commerce.id, tickets_balance: 0 });
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
