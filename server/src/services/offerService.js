const { Op } = require('sequelize');
const { Offer, Order, User } = require('../models');
const config = require('../config');

/**
 * Validate an offer code and return the offer if valid.
 */
async function validateOffer(code, { customerId, orderAmount }) {
  const offer = await Offer.findOne({ where: { code, active: true } });
  if (!offer) throw Object.assign(new Error('Invalid offer code'), { status: 404 });

  const now = new Date();
  if (offer.validFrom && now < new Date(offer.validFrom))
    throw Object.assign(new Error('Offer is not yet active'), { status: 400 });
  if (offer.validUntil && now > new Date(offer.validUntil))
    throw Object.assign(new Error('Offer has expired'), { status: 400 });

  if (offer.maxUses !== null && offer.usedCount >= offer.maxUses)
    throw Object.assign(new Error('Offer usage limit reached'), { status: 400 });

  // First-order-only coupon: user must have zero previous orders
  if (offer.firstOrderOnly && customerId) {
    const anyOrder = await Order.count({ where: { customerId } });
    if (anyOrder > 0)
      throw Object.assign(new Error('This offer is for first-time buyers only'), { status: 400 });
  }

  // Bank-segment check: if offer targets a specific bank, user must belong to it
  if (offer.targetBankCode && customerId) {
    const user = await User.findByPk(customerId, { attributes: ['bankCode'] });
    if (!user || user.bankCode !== offer.targetBankCode)
      throw Object.assign(
        new Error(`This offer is exclusively for ${offer.targetBankCode} Bank customers`),
        { status: 403 }
      );
  }

  if (offer.perCustomerLimit !== null && customerId) {
    const customerUses = await Order.count({
      where: { offerId: offer.id, customerId },
    });
    if (customerUses >= offer.perCustomerLimit)
      throw Object.assign(new Error('You have already used this offer'), { status: 400 });
  }

  if (orderAmount < parseFloat(offer.minOrderAmount || 0))
    throw Object.assign(
      new Error(`Minimum order amount is ₹${offer.minOrderAmount}`),
      { status: 400 }
    );

  return offer;
}

/**
 * Calculate discount amount from an offer.
 */
function calculateDiscount(offer, unitPrice, quantity) {
  const subtotal = unitPrice * quantity;

  let discount;
  if (offer.discountType === 'flat') {
    discount = Math.min(parseFloat(offer.discountValue), subtotal);
  } else {
    // percentage
    discount = Math.round(((subtotal * parseFloat(offer.discountValue)) / 100) * 100) / 100;
  }

  // Hard cap: no matter how big the order, discount won't exceed the cap
  const cap = config.offer.maxDiscountCap;
  if (cap && discount > cap) discount = cap;

  return discount;
}

module.exports = { validateOffer, calculateDiscount };
