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

  test('refuse sans auth', async () => {
    const res = await request(app).post('/api/reviews').send({ commerce_id: 1, rating: 4 });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/reviews/:id/moderate', () => {
  test('admin peut approuver un avis', async () => {
    const review = await Review.create({ commerce_id: commerce.id, user_id: 1, rating: 3, status: 'pending' });
    const res = await request(app)
      .put(`/api/reviews/${review.id}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  test('user normal ne peut pas modérer', async () => {
    const review = await Review.create({ commerce_id: commerce.id, user_id: 1, rating: 3, status: 'pending' });
    const res = await request(app)
      .put(`/api/reviews/${review.id}/moderate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });
});
