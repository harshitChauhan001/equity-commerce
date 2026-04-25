const sequelize = require('../db/sequelize');
const { Variant, Order, OrderItem, Offer, CartItem } = require('../models');
const { resolvePrice } = require('./pricing/pricingEngine');
const { validateOffer, calculateDiscount } = require('./offerService');
const config = require('../config');
const logger = require('../utils/logger');

// Simple sequential order number: ORD-<timestamp><random2digits>
function generateOrderNumber() {
  return 'ORD-' + Date.now() + Math.floor(Math.random() * 90 + 10);
}

/**
 * Place an order — single atomic command.
 *
 * 1. Resolve personalized price
 * 2. Validate offer (if provided)
 * 3. BEGIN TRANSACTION
 *    - SELECT variant FOR UPDATE (row lock)
 *    - Check stock
 *    - Deduct stock
 *    - Create order
 *    - Increment offer used_count
 * 4. COMMIT
 *
 * @param {{ customerId: string, variantId: string, quantity: number, offerCode?: string }} params
 * @returns {Promise<Order>}
 */
async function placeOrder({ customerId, variantId, quantity, offerCode }) {
  // ── Pre-flight checks outside transaction (cheaper) ──
  if (quantity > config.order.maxQuantity) {
    throw Object.assign(
      new Error(`Max ${config.order.maxQuantity} items per order`),
      { status: 400 }
    );
  }

  // ── Atomic transaction ──
  const result = await sequelize.transaction(async (t) => {
    // 1. Lock the variant row
    const variant = await Variant.findByPk(variantId, {
      lock: t.LOCK.UPDATE, // SELECT … FOR UPDATE
      transaction: t,
    });

    if (!variant) {
      throw Object.assign(new Error('Variant not found'), { status: 404 });
    }

    // 2. Check stock
    if (variant.stock < quantity) {
      throw Object.assign(
        new Error(`Insufficient stock. Available: ${variant.stock}`),
        { status: 409, code: 'OUT_OF_STOCK' }
      );
    }

    // 3. Resolve personalized price
    const unitPrice = await resolvePrice({
      variant,
      variantId: variant.id,
      customerId,
    });

    // 4. Offer handling
    let offer = null;
    let discount = 0;

    if (offerCode) {
      offer = await validateOffer(offerCode, {
        customerId,
        orderAmount: unitPrice * quantity,
      });
      discount = calculateDiscount(offer, unitPrice, quantity);
    }

    const finalPrice = Math.max(0, unitPrice * quantity - discount);

    // 5. Deduct stock
    variant.stock -= quantity;
    await variant.save({ transaction: t });

    // 6. Create order header
    const order = await Order.create(
      {
        orderNumber: generateOrderNumber(),
        customerId,
        offerId: offer ? offer.id : null,
        subtotal: unitPrice * quantity,
        discount,
        totalAmount: finalPrice,
        status: 'confirmed',
      },
      { transaction: t }
    );

    // 7. Create order line item
    await OrderItem.create(
      {
        orderId: order.id,
        variantId: variant.id,
        quantity,
        unitPrice,
        discount,
        finalPrice,
      },
      { transaction: t }
    );

    // 8. Increment offer usage
    if (offer) {
      await Offer.update(
        { usedCount: sequelize.literal('used_count + 1') },
        { where: { id: offer.id }, transaction: t }
      );
    }

    logger.info(
      `Order ${order.id} placed: customer=${customerId} variant=${variantId} qty=${quantity} price=${finalPrice}`
    );

    return order;
  });

  return result;
}

/**
 * Checkout all items currently in the user's cart.
 * Applies a single offer to the total, distributes discount proportionally.
 *
 * @param {{ customerId: string, offerCode?: string }} params
 * @returns {Promise<{ orders: Order[], totalAmount: number, totalDiscount: number, shippingFee: number }>}
 */
async function checkoutFromCart({ customerId, offerCode }) {
  const cartItems = await CartItem.findAll({
    where: { userId: customerId },
    include: [{ model: Variant, as: 'variant' }],
  });

  if (!cartItems.length) {
    throw Object.assign(new Error('Your cart is empty'), { status: 400 });
  }

  // Pre-flight: quantity checks
  for (const item of cartItems) {
    if (item.quantity > config.order.maxQuantity) {
      throw Object.assign(
        new Error(`Max ${config.order.maxQuantity} items per variant`),
        { status: 400 }
      );
    }
  }

  // Resolve personalized prices outside transaction (read-only)
  const itemsWithPrices = await Promise.all(
    cartItems.map(async (item) => {
      const unitPrice = await resolvePrice({
        variant: item.variant,
        variantId: item.variantId,
        customerId,
      });
      const subtotal = unitPrice * item.quantity;
      return { item, unitPrice, subtotal };
    })
  );

  const totalAmount = itemsWithPrices.reduce((sum, i) => sum + i.subtotal, 0);

  // Shipping fee
  const shippingFee =
    totalAmount >= config.shipping.freeThreshold ? 0 : config.shipping.flatFee;

  // Validate offer against cart total
  let offer = null;
  let totalDiscount = 0;
  if (offerCode) {
    offer = await validateOffer(offerCode, { customerId, orderAmount: totalAmount });
    totalDiscount = calculateDiscount(offer, totalAmount, 1);
  }

  const orders = await sequelize.transaction(async (t) => {
    const created = [];

    for (const { item, unitPrice, subtotal } of itemsWithPrices) {
      const variant = await Variant.findByPk(item.variantId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!variant) throw Object.assign(new Error('Variant not found'), { status: 404 });

      if (variant.stock < item.quantity) {
        throw Object.assign(
          new Error(`Insufficient stock for "${variant.name}". Available: ${variant.stock}`),
          { status: 409, code: 'OUT_OF_STOCK' }
        );
      }

      // Pro-rate discount proportionally by item's share of the total
      const ratio = totalAmount > 0 ? subtotal / totalAmount : 0;
      const discount = Math.round(totalDiscount * ratio * 100) / 100;
      const finalPrice = Math.max(0, subtotal - discount);

      variant.stock -= item.quantity;
      await variant.save({ transaction: t });

      const order = await Order.create(
        {
          orderNumber: generateOrderNumber(),
          customerId,
          offerId: offer ? offer.id : null,
          subtotal,
          discount,
          totalAmount: finalPrice,
          status: 'confirmed',
        },
        { transaction: t }
      );

      await OrderItem.create(
        {
          orderId: order.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice,
          discount,
          finalPrice,
        },
        { transaction: t }
      );

      created.push(order);
    }

    // Increment offer usage count once per checkout
    if (offer) {
      await Offer.update(
        { usedCount: sequelize.literal('used_count + 1') },
        { where: { id: offer.id }, transaction: t }
      );
    }

    // Clear the cart
    await CartItem.destroy({ where: { userId: customerId }, transaction: t });

    return created;
  });

  logger.info(`Cart checkout: customer=${customerId} items=${orders.length} total=${totalAmount} discount=${totalDiscount}`);
  return { orders, totalAmount, totalDiscount, shippingFee };
}

module.exports = { placeOrder, checkoutFromCart };
