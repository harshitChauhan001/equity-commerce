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

app.use('/api', routes);
app.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    const { Category, Product, Variant, User, Segment, SegmentPrice,
            CustomerPrice, Offer, Order, OrderItem, CartItem } = require('./models');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description VARCHAR(255),
        price_multiplier DECIMAL(5,4) NOT NULL DEFAULT 1.0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE SET NULL;
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS segment_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
        variant_id UUID NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(segment_id, variant_id)
      );
    `);

    await Segment.sync({ alter: true });
    await Category.sync({ alter: true });
    await User.sync({ alter: true });
    await Product.sync({ alter: true });
    await Variant.sync({ alter: true });
    await SegmentPrice.sync({ alter: true });
    await CustomerPrice.sync({ alter: true });
    await Offer.sync({ alter: true });
    await Order.sync({ alter: true });
    await OrderItem.sync({ alter: true });
    await CartItem.sync({ alter: true });
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
