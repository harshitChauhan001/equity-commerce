const { Product, Variant, CustomerPrice } = require('../models');
const { resolvePrice } = require('../services/pricing/pricingEngine');
const { ok, fail } = require('../utils/response');
const config = require('../config');

/**
 * GET /api/products
 */
async function list(req, res, next) {
  try {
    const products = await Product.findAll({
      where: { active: true },
      include: [{ association: 'variants', attributes: ['id', 'name', 'basePrice', 'stock', 'sku'] }],
      order: [['createdAt', 'DESC']],
    });
    return ok(res, products);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id?customer_id=xxx
 * Returns product with variants and personalized prices.
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const customerId = req.user?.id || null;

    const product = await Product.findByPk(id, {
      include: [{ association: 'variants' }],
    });

    if (!product) return fail(res, 'Product not found', 404, 'NOT_FOUND');

    // Resolve personalized price for each variant
    const variantsWithPrices = await Promise.all(
      product.variants.map(async (v) => {
        const personalizedPrice = await resolvePrice({
          variant: v,
          variantId: v.id,
          customerId,
        });
        return {
          ...v.toJSON(),
          personalizedPrice,
          lowStock: v.stock > 0 && v.stock <= config.stock.lowThreshold,
          inStock: v.stock > 0,
        };
      })
    );

    return ok(res, { ...product.toJSON(), variants: variantsWithPrices });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/products
 */
async function create(req, res, next) {
  try {
    const { name, description, imageUrl, variants } = req.body;

    const product = await Product.create(
      {
        name,
        description,
        imageUrl,
        variants: variants.map((v) => ({
          name: v.name,
          basePrice: v.basePrice,
          stock: v.stock,
          sku: v.sku || null,
        })),
      },
      { include: [{ association: 'variants' }] }
    );

    return ok(res, product, null, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create };
