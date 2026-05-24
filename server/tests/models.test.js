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
