require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const sequelize = require('./db/sequelize');

// Import models to register associations
require('./models');

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api', routes);

// ── Error handler ──
app.use(errorHandler);

// ── Start ──
async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    // In production: sync({force:false}) — never wipe data
    // In development: alter:true keeps schema in sync
    const isProd = process.env.NODE_ENV === 'production';
    await sequelize.sync(isProd ? { force: false } : { alter: true });
    logger.info('Tables synced');

    app.listen(config.app.port, () => {
      logger.info(`Server running on http://localhost:${config.app.port}`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

start();
