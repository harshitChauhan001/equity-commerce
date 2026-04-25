const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: (msg) => logger.debug(msg),
      pool: { min: 2, max: 10, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      config.db.name,
      config.db.user,
      config.db.password,
      {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
          min: config.db.pool.min,
          max: config.db.pool.max,
          acquire: config.db.pool.acquire,
          idle: config.db.pool.idle,
        },
      }
    );

module.exports = sequelize;
