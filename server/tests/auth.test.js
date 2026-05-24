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
