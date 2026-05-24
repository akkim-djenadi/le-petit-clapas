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
