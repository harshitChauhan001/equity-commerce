const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bankCode: z.enum(['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const placeOrderSchema = z.object({
  variantId: z.string().uuid('variantId must be a valid UUID'),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
  offerCode: z.string().optional(),
});

const validateOfferSchema = z.object({
  code: z.string().min(1, 'code is required'),
  orderAmount: z.number().min(0),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        basePrice: z.number().positive(),
        stock: z.number().int().min(0),
        sku: z.string().optional(),
      })
    )
    .min(1, 'At least one variant is required'),
});

const setCustomerPriceSchema = z.object({
  variantId: z.string().uuid(),
  customerId: z.string().min(1),
  price: z.number().positive(),
});

const createOfferSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  firstOrderOnly: z.boolean().optional(),
  targetBankCode: z.string().nullable().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

const updateOfferSchema = z.object({
  discountValue: z.number().positive().optional(),
  discountType: z.enum(['flat', 'percentage']).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  perCustomerLimit: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  firstOrderOnly: z.boolean().optional(),
  targetBankCode: z.string().nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  code: z.string().min(1).optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

const addToCartSchema = z.object({
  variantId: z.string().uuid('variantId must be a valid UUID'),
  quantity: z.number().int().min(1).optional(),
});

const checkoutSchema = z.object({
  offerCode: z.string().optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  placeOrderSchema,
  validateOfferSchema,
  createProductSchema,
  setCustomerPriceSchema,
  createOfferSchema,
  updateOfferSchema,
  addToCartSchema,
  checkoutSchema,
};
