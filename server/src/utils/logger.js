const pino = require('pino');
const config = require('../config');

const logger = pino({
  level: config.app.env === 'production' ? 'info' : 'debug',
  transport:
    config.app.env !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

module.exports = logger;
