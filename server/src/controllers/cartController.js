const { CartItem, Variant, Product } = require('../models');
const { checkoutFromCart } = require('../services/orderService');
const config = require('../config');
const { ok } = require('../utils/response');

/** GET /api/cart */
async function getCart(req, res, next) {
  try {
    const items = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Variant,
          as: 'variant',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'imageUrl'] }],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const totalAmount = items.reduce(
      (sum, i) => sum + parseFloat(i.variant.basePrice) * i.quantity,
      0
    );
    const shippingFee =
      totalAmount >= config.shipping.freeThreshold ? 0 : config.shipping.flatFee;

    return ok(res, { items, totalAmount, shippingFee, freeShippingThreshold: config.shipping.freeThreshold });
  } catch (err) {
    next(err);
  }
}

/** POST /api/cart  — add or update item (upsert by variant) */
async function addToCart(req, res, next) {
  try {
    const { variantId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Check variant exists
    const variant = await Variant.findByPk(variantId);
    if (!variant) {
      return res.status(404).json({ error: { message: 'Variant not found' } });
    }
    if (variant.stock === 0) {
      return res.status(409).json({ error: { message: 'Variant is out of stock' } });
    }

    // Enforce cart max-items (unique lines) limit
    const existingCount = await CartItem.count({ where: { userId } });
    const existing = await CartItem.findOne({ where: { userId, variantId } });

    if (!existing && existingCount >= config.cart.maxItems) {
      return res.status(400).json({
        error: { message: `Cart can hold a maximum of ${config.cart.maxItems} different items` },
      });
    }

    const [item, created] = await CartItem.upsert(
      { userId, variantId, quantity },
      { returning: true }
    );

    // Re-fetch with associations for the response
    const full = await CartItem.findOne({
      where: { userId, variantId },
      include: [
        {
          model: Variant,
          as: 'variant',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'imageUrl'] }],
        },
      ],
    });

    return ok(res, full, null, created ? 201 : 200);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/cart/:itemId — update quantity */
async function updateItem(req, res, next) {
  try {
    const item = await CartItem.findOne({
      where: { id: req.params.itemId, userId: req.user.id },
    });
    if (!item) return res.status(404).json({ error: { message: 'Cart item not found' } });

    const { quantity } = req.body;
    if (quantity < 1) {
      await item.destroy();
      return ok(res, { removed: true });
    }

    item.quantity = quantity;
    await item.save();
    return ok(res, item);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/cart/:itemId — remove one item */
async function removeItem(req, res, next) {
  try {
    const deleted = await CartItem.destroy({
      where: { id: req.params.itemId, userId: req.user.id },
    });
    if (!deleted) return res.status(404).json({ error: { message: 'Cart item not found' } });
    return ok(res, { removed: true });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/cart — clear entire cart */
async function clearCart(req, res, next) {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });
    return ok(res, { cleared: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/cart/checkout */
async function checkout(req, res, next) {
  try {
    const result = await checkoutFromCart({
      customerId: req.user.id,
      offerCode: req.body.offerCode,
    });
    return ok(res, result, null, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateItem, removeItem, clearCart, checkout };
