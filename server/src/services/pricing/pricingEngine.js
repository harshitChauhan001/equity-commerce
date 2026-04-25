const config = require('../../config');
const logger = require('../../utils/logger');

// Strategy registry
const strategyMap = {
  customer_specific: require('./strategies/customerSpecific'),
  base: require('./strategies/base'),
};

/**
 * Resolve the final unit price for a variant + customer.
 * Runs configured strategies in order; first non-null result wins.
 *
 * @param {{ variant: object, variantId: string, customerId: string }} ctx
 * @returns {Promise<number>}
 */
async function resolvePrice({ variant, variantId, customerId }) {
  const strategies = config.pricing.strategies;

  for (const name of strategies) {
    const strategy = strategyMap[name];
    if (!strategy) {
      logger.warn(`Unknown pricing strategy: ${name}`);
      continue;
    }

    const price = await strategy.resolve({ variant, variantId, customerId });
    if (price !== null && price !== undefined) {
      logger.info(`Price resolved by strategy "${name}": ${price}`);
      return price;
    }
  }

  // ultimate fallback
  return parseFloat(variant.basePrice);
}

module.exports = { resolvePrice };
