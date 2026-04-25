const { placeOrder } = require('../services/orderService');
const { Order, OrderItem, Variant, Product, Offer } = require('../models');
const { ok } = require('../utils/response');

/**
 * POST /api/orders
 * Body: { variantId, quantity, offerCode? }
 * customerId comes from JWT (req.user.id)
 */
async function create(req, res, next) {
  try {
    const order = await placeOrder({ ...req.body, customerId: req.user.id });
    return ok(res, order, null, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/history
 * Returns the logged-in user's orders with product/variant details.
 */
async function history(req, res, next) {
  try {
    const orders = await Order.findAll({
      where: { customerId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Variant,
              as: 'variant',
              include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'imageUrl'] }],
            },
          ],
        },
        { model: Offer, as: 'offer', attributes: ['id', 'code', 'discountType', 'discountValue'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return ok(res, orders);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, history };

