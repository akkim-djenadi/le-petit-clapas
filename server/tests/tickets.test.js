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
    expect(profile.tickets_balance).toBe(5);
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

  test('refuse un QR expiré', async () => {
    const offer = await TicketOffer.create({
      commerce_id: commerce.id, title: 'Test3', advantage: 'Cadeau3',
      quantity_total: 1, quantity_remaining: 1, created_by: merchantUser.id,
    });
    const ticket = await UserTicket.create({
      user_id: normalUser.id, ticket_offer_id: offer.id,
      qr_code: 'expired-uuid-9999', status: 'expired', won_at: new Date(),
    });

    const res = await request(app)
      .put(`/api/user-tickets/${ticket.qr_code}/scan`)
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(410);
  });
});
