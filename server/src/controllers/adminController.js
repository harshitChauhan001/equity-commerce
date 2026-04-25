const { Product, Variant, Order, Offer, User } = require('../models');
const sequelize = require('../db/sequelize');
const { ok } = require('../utils/response');

/** GET /api/admin/stats */
async function stats(req, res, next) {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueResult, activeOffers] =
      await Promise.all([
        User.count(),
        Product.count({ where: { active: true } }),
        Order.count({ where: { status: 'confirmed' } }),
        Order.findOne({
          attributes: [[sequelize.fn('SUM', sequelize.col('final_price')), 'total']],
          where: { status: 'confirmed' },
          raw: true,
        }),
        Offer.count({ where: { active: true } }),
      ]);

    return ok(res, {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: parseFloat(revenueResult?.total || 0),
      activeOffers,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/orders */
async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Variant,
          as: 'variant',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Offer, as: 'offer', attributes: ['id', 'code', 'discountType', 'discountValue'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
    return ok(res, orders);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/offers */
async function listOffers(req, res, next) {
  try {
    const offers = await Offer.findAll({ order: [['createdAt', 'DESC']] });
    return ok(res, offers);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/offers/:id — update discount value, active status, etc. */
async function updateOffer(req, res, next) {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) return res.status(404).json({ error: { message: 'Offer not found' } });

    const allowed = [
      'discountValue', 'discountType', 'minOrderAmount', 'maxUses',
      'perCustomerLimit', 'active', 'validFrom', 'validUntil',
      'firstOrderOnly', 'code', 'targetBankCode',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await offer.update(updates);
    return ok(res, offer);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/inventory — all products with variant stock levels */
async function listInventory(req, res, next) {
  try {
    const products = await Product.findAll({
      include: [{
        model: Variant,
        as: 'variants',
        attributes: ['id', 'name', 'sku', 'stock', 'basePrice'],
      }],
      order: [['name', 'ASC'], [{ model: Variant, as: 'variants' }, 'name', 'ASC']],
    });
    return ok(res, products);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/variants/:id/stock
 * Body: { stock } — set absolute value, or { delta } — add/subtract relative
 */
async function updateStock(req, res, next) {
  try {
    const variant = await Variant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ error: { message: 'Variant not found' } });

    if (req.body.stock !== undefined) {
      const val = parseInt(req.body.stock, 10);
      if (isNaN(val) || val < 0)
        return res.status(400).json({ error: { message: 'stock must be a non-negative integer' } });
      variant.stock = val;
    } else if (req.body.delta !== undefined) {
      const delta = parseInt(req.body.delta, 10);
      if (isNaN(delta))
        return res.status(400).json({ error: { message: 'delta must be an integer' } });
      variant.stock = Math.max(0, variant.stock + delta);
    } else {
      return res.status(400).json({ error: { message: 'Provide stock or delta' } });
    }

    await variant.save();
    return ok(res, { id: variant.id, name: variant.name, sku: variant.sku, stock: variant.stock });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, getAllOrders, listOffers, updateOffer, listInventory, updateStock };
