const { validateOffer, calculateDiscount } = require('../services/offerService');
const { CustomerPrice, Offer, User } = require('../models');
const { Op } = require('sequelize');
const { ok } = require('../utils/response');

/**
 * GET /api/offers/available
 * Returns offers the current logged-in user is eligible for
 * (universal offers + their bank-specific offers)
 */
async function getAvailableOffers(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['bankCode'] });
    const bankCode = user?.bankCode || null;

    const where = {
      active: true,
      [Op.or]: [
        { targetBankCode: null },                            // universal
        ...(bankCode ? [{ targetBankCode: bankCode }] : []), // bank-specific
      ],
    };

    const offers = await Offer.findAll({
      where,
      attributes: ['id', 'code', 'discountType', 'discountValue', 'minOrderAmount',
                   'maxUses', 'usedCount', 'perCustomerLimit', 'validFrom', 'validUntil',
                   'firstOrderOnly', 'targetBankCode'],
      order: [['discountValue', 'DESC']],
    });

    // Filter out expired
    const now = new Date();
    const valid = offers.filter((o) => {
      if (o.validFrom && now < new Date(o.validFrom)) return false;
      if (o.validUntil && now > new Date(o.validUntil)) return false;
      if (o.maxUses !== null && o.usedCount >= o.maxUses) return false;
      return true;
    });

    return ok(res, { bankCode, offers: valid });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/offers/validate
 */
async function validate(req, res, next) {
  try {
    const { code, orderAmount } = req.body;
    const customerId = req.user.id;
    const offer = await validateOffer(code, { customerId, orderAmount });
    return ok(res, {
      id: offer.id,
      code: offer.code,
      discountType: offer.discountType,
      discountValue: parseFloat(offer.discountValue),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/offers
 */
async function create(req, res, next) {
  try {
    const offer = await Offer.create(req.body);
    return ok(res, offer, null, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/customer-prices
 */
async function setCustomerPrice(req, res, next) {
  try {
    const { variantId, customerId, price } = req.body;
    const [entry] = await CustomerPrice.upsert({ variantId, customerId, price });
    return ok(res, entry, null, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { validate, create, setCustomerPrice, getAvailableOffers };
