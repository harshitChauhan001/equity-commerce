const { Router } = require('express');
const productCtrl = require('../controllers/productController');
const orderCtrl = require('../controllers/orderController');
const offerCtrl = require('../controllers/offerController');
const authCtrl = require('../controllers/authController');
const cartCtrl = require('../controllers/cartController');
const adminCtrl = require('../controllers/adminController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  placeOrderSchema,
  validateOfferSchema,
  createProductSchema,
  setCustomerPriceSchema,
  createOfferSchema,
  updateOfferSchema,
  signupSchema,
  loginSchema,
  addToCartSchema,
  checkoutSchema,
} = require('../validators');

const router = Router();

// ── Health ──
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Auth ──
router.post('/auth/signup', validate(signupSchema), authCtrl.signup);
router.post('/auth/login', validate(loginSchema), authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);

// ── Products (public list, authenticated detail) ──
router.get('/products', productCtrl.list);
router.get('/products/:id', authenticate, productCtrl.getById);

// ── Cart (authenticated) ──
router.get('/cart', authenticate, cartCtrl.getCart);
router.post('/cart', authenticate, validate(addToCartSchema), cartCtrl.addToCart);
router.put('/cart/:itemId', authenticate, cartCtrl.updateItem);
router.delete('/cart/:itemId', authenticate, cartCtrl.removeItem);
router.delete('/cart', authenticate, cartCtrl.clearCart);
router.post('/cart/checkout', authenticate, validate(checkoutSchema), cartCtrl.checkout);

// ── Orders (authenticated) ──
router.post('/orders', authenticate, validate(placeOrderSchema), orderCtrl.create);
router.get('/orders/history', authenticate, orderCtrl.history);

// ── Offers (authenticated) ──
router.get('/offers/available', authenticate, offerCtrl.getAvailableOffers);
router.post('/offers/validate', authenticate, validate(validateOfferSchema), offerCtrl.validate);

// ── Admin ──
router.get('/admin/stats', authenticate, authorize('admin'), adminCtrl.stats);
router.get('/admin/orders', authenticate, authorize('admin'), adminCtrl.getAllOrders);
router.get('/admin/offers', authenticate, authorize('admin'), adminCtrl.listOffers);
router.put('/admin/offers/:id', authenticate, authorize('admin'), validate(updateOfferSchema), adminCtrl.updateOffer);
router.get('/admin/inventory', authenticate, authorize('admin'), adminCtrl.listInventory);
router.put('/admin/variants/:id/stock', authenticate, authorize('admin'), adminCtrl.updateStock);
router.post('/admin/products', authenticate, authorize('admin'), validate(createProductSchema), productCtrl.create);
router.post('/admin/offers', authenticate, authorize('admin'), validate(createOfferSchema), offerCtrl.create);
router.post('/admin/customer-prices', authenticate, authorize('admin'), validate(setCustomerPriceSchema), offerCtrl.setCustomerPrice);

module.exports = router;
