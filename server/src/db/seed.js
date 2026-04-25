const sequelize = require('../db/sequelize');
const { Product, Variant, CustomerPrice, Offer, User, Category } = require('../models');
const logger = require('../utils/logger');

const categories = [
  { name: 'Apparel',     slug: 'apparel',     description: 'Clothing and fashion' },
  { name: 'Footwear',   slug: 'footwear',    description: 'Shoes and sandals' },
  { name: 'Electronics',slug: 'electronics', description: 'Gadgets and devices' },
  { name: 'Accessories',slug: 'accessories', description: 'Watches, bags and more' },
];

const products = [
  {
    category: 'apparel',
    name: 'Classic T-Shirt',
    description: 'Premium cotton t-shirt available in multiple colors',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
    variants: [
      { name: 'Red / S', basePrice: 599, stock: 20, sku: 'TS-RED-S' },
      { name: 'Red / M', basePrice: 599, stock: 15, sku: 'TS-RED-M' },
      { name: 'Blue / M', basePrice: 649, stock: 10, sku: 'TS-BLU-M' },
      { name: 'Blue / L', basePrice: 649, stock: 3, sku: 'TS-BLU-L' },
    ],
  },
  {
    category: 'footwear',
    name: 'Running Shoes',
    description: 'Lightweight running shoes for everyday training',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
    variants: [
      { name: 'Black / 8', basePrice: 2999, stock: 8, sku: 'SH-BLK-8' },
      { name: 'Black / 9', basePrice: 2999, stock: 12, sku: 'SH-BLK-9' },
      { name: 'White / 9', basePrice: 3199, stock: 5, sku: 'SH-WHT-9' },
    ],
  },
  {
    category: 'electronics',
    name: 'Wireless Earbuds',
    description: 'Noise-cancelling wireless earbuds with 24h battery',
    imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop',
    variants: [
      { name: 'Black', basePrice: 1499, stock: 25, sku: 'EB-BLK' },
      { name: 'White', basePrice: 1499, stock: 18, sku: 'EB-WHT' },
    ],
  },
  {
    category: 'accessories',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor and GPS',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
    variants: [
      { name: '40mm / Black', basePrice: 4999, stock: 10, sku: 'SW-BLK-40' },
      { name: '44mm / Black', basePrice: 5499, stock: 7, sku: 'SW-BLK-44' },
      { name: '44mm / Silver', basePrice: 5499, stock: 4, sku: 'SW-SLV-44' },
    ],
  },
];

const offers = [
  // ── Universal offers (all users) ──
  { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minOrderAmount: 500, maxUses: 200, perCustomerLimit: 1, firstOrderOnly: true, active: true },
  { code: 'SAVE100',   discountType: 'flat',       discountValue: 100, minOrderAmount: 2000, active: true },
  { code: 'FESTIVE20', discountType: 'percentage', discountValue: 20, minOrderAmount: 1500, maxUses: 500, active: true },
  { code: 'FLAT50',    discountType: 'flat',       discountValue: 50,  minOrderAmount: 0, active: true },
  // ── HDFC Bank exclusive ──
  { code: 'HDFC15',      discountType: 'percentage', discountValue: 15, minOrderAmount: 1000, targetBankCode: 'HDFC', active: true },
  { code: 'HDFCFLAT200', discountType: 'flat',       discountValue: 200, minOrderAmount: 3000, targetBankCode: 'HDFC', active: true },
  // ── ICICI Bank exclusive ──
  { code: 'ICICI10',     discountType: 'percentage', discountValue: 10, minOrderAmount: 800,  targetBankCode: 'ICICI', active: true },
  { code: 'ICICIFLAT150',discountType: 'flat',       discountValue: 150, minOrderAmount: 2500, targetBankCode: 'ICICI', active: true },
  // ── SBI Bank exclusive ──
  { code: 'SBI12',  discountType: 'percentage', discountValue: 12, minOrderAmount: 1200, targetBankCode: 'SBI',  active: true },
  // ── Axis Bank exclusive ──
  { code: 'AXIS18',      discountType: 'percentage', discountValue: 18, minOrderAmount: 2000, targetBankCode: 'AXIS', active: true },
  { code: 'AXISFLAT100', discountType: 'flat',       discountValue: 100, minOrderAmount: 1500, targetBankCode: 'AXIS', active: true },
  // ── Kotak Bank exclusive ──
  { code: 'KOTAK25', discountType: 'percentage', discountValue: 25, minOrderAmount: 3000, maxUses: 100, targetBankCode: 'KOTAK', active: true },
  // ── Expired demo ──
  { code: 'EXPIRED50', discountType: 'percentage', discountValue: 50, validFrom: '2025-01-01T00:00:00Z', validUntil: '2025-02-01T00:00:00Z', active: true },
];

async function seed() {
  try {
    await sequelize.authenticate();
    const isProduction = process.env.NODE_ENV === 'production';
    // In production: sync without force (preserves data), use seed only once
    await sequelize.sync({ force: !isProduction, alter: isProduction });

    // ── Categories ──
    const createdCategories = {};
    for (const c of categories) {
      const cat = await Category.create(c);
      createdCategories[cat.slug] = cat;
    }

    // Seed demo users with bank assignments
    const alice = await User.create({ name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', bankCode: 'HDFC', role: 'admin' });
    const bob   = await User.create({ name: 'Bob Smith',     email: 'bob@example.com',   password: 'password123', bankCode: 'ICICI' });
    // Additional demo users
    await User.create({ name: 'Priya Sharma',  email: 'priya@example.com',  password: 'password123', bankCode: 'SBI' });
    await User.create({ name: 'Rahul Verma',   email: 'rahul@example.com',  password: 'password123', bankCode: 'AXIS' });
    await User.create({ name: 'Sneha Patel',   email: 'sneha@example.com',  password: 'password123', bankCode: 'KOTAK' });
    await User.create({ name: 'Arjun Mehta',   email: 'arjun@example.com',  password: 'password123' }); // no bank

    // Seed products + variants
    const createdProducts = [];
    for (const p of products) {
      const product = await Product.create({
        categoryId: createdCategories[p.category]?.id || null,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
      });

      const variants = await Promise.all(
        p.variants.map((v) =>
          Variant.create({
            productId: product.id,
            name: v.name,
            basePrice: v.basePrice,
            stock: v.stock,
            sku: v.sku,
          })
        )
      );
      product.dataValues.variants = variants;
      createdProducts.push(product);
    }

    // Seed customer-specific prices
    // Alice gets cheaper T-shirts, Bob gets cheaper shoes
    const tshirtVariants = createdProducts[0].dataValues.variants;
    const shoeVariants = createdProducts[1].dataValues.variants;

    await CustomerPrice.bulkCreate([
      { variantId: tshirtVariants[0].id, customerId: alice.id, price: 399 },
      { variantId: tshirtVariants[1].id, customerId: alice.id, price: 399 },
      { variantId: shoeVariants[0].id, customerId: bob.id, price: 2499 },
      { variantId: shoeVariants[1].id, customerId: bob.id, price: 2499 },
    ]);

    // Seed offers
    await Offer.bulkCreate(offers);

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    logger.error(err, 'Seed failed');
    process.exit(1);
  }
}

seed();
