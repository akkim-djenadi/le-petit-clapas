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
    return sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
  })
  .then(() => server.listen(PORT, () => console.log(`Serveur sur :${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
