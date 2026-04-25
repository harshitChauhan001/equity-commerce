const { CustomerPrice } = require('../../../models');

/**
 * Customer-specific pricing strategy.
 * Returns the custom price if one is set for this customer+variant, else null.
 */
async function resolve({ variantId, customerId }) {
  if (!customerId) return null;

  const entry = await CustomerPrice.findOne({
    where: { variantId, customerId },
  });

  return entry ? parseFloat(entry.price) : null;
}

module.exports = { name: 'customer_specific', resolve };
