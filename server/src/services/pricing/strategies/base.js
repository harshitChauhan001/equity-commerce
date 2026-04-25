/**
 * Base pricing strategy — simply returns the variant's base_price.
 * This is the fallback and should always be last in the strategy chain.
 */
async function resolve({ variant }) {
  return parseFloat(variant.basePrice);
}

module.exports = { name: 'base', resolve };
