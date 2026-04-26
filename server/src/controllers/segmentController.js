const { Segment, SegmentPrice, User, Variant, Product } = require('../models');
const { ok } = require('../utils/response');

/** GET /api/admin/segments — list all segments with user count */
async function listSegments(req, res, next) {
  try {
    const segments = await Segment.findAll({
      include: [{ model: User, as: 'users', attributes: ['id', 'name', 'email'] }],
      order: [['name', 'ASC']],
    });
    return ok(res, segments);
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/segments — create a new segment */
async function createSegment(req, res, next) {
  try {
    const { name, description, priceMultiplier } = req.body;
    const segment = await Segment.create({
      name: name.toUpperCase(),
      description,
      priceMultiplier: priceMultiplier ?? 1.0,
    });
    return ok(res, segment);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/segments/:id — update segment */
async function updateSegment(req, res, next) {
  try {
    const segment = await Segment.findByPk(req.params.id);
    if (!segment) return res.status(404).json({ error: { message: 'Segment not found' } });

    const { description, priceMultiplier } = req.body;
    if (description !== undefined) segment.description = description;
    if (priceMultiplier !== undefined) segment.priceMultiplier = priceMultiplier;
    await segment.save();
    return ok(res, segment);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/users/:id/segment — assign user to a segment */
async function assignUserSegment(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

    const { segmentId } = req.body;

    // segmentId: null = remove from segment
    if (segmentId) {
      const segment = await Segment.findByPk(segmentId);
      if (!segment) return res.status(404).json({ error: { message: 'Segment not found' } });
    }

    user.segmentId = segmentId || null;
    await user.save();

    return ok(res, { userId: user.id, name: user.name, email: user.email, segmentId: user.segmentId });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/segments/:id/prices — get all segment prices for a segment */
async function listSegmentPrices(req, res, next) {
  try {
    const prices = await SegmentPrice.findAll({
      where: { segmentId: req.params.id },
      include: [{
        model: Variant,
        as: 'variant',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
      }],
      order: [[{ model: Variant, as: 'variant' }, 'name', 'ASC']],
    });
    return ok(res, prices);
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/segments/:id/prices — upsert a segment price for a variant */
async function upsertSegmentPrice(req, res, next) {
  try {
    const { variantId, price } = req.body;
    const segmentId = req.params.id;

    const segment = await Segment.findByPk(segmentId);
    if (!segment) return res.status(404).json({ error: { message: 'Segment not found' } });

    const variant = await Variant.findByPk(variantId);
    if (!variant) return res.status(404).json({ error: { message: 'Variant not found' } });

    const [entry, created] = await SegmentPrice.findOrCreate({
      where: { segmentId, variantId },
      defaults: { price },
    });

    if (!created) {
      entry.price = price;
      await entry.save();
    }

    return ok(res, entry);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/segments/:id/prices/:priceId — remove a segment price override */
async function deleteSegmentPrice(req, res, next) {
  try {
    const entry = await SegmentPrice.findOne({
      where: { id: req.params.priceId, segmentId: req.params.id },
    });
    if (!entry) return res.status(404).json({ error: { message: 'Price not found' } });
    await entry.destroy();
    return ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users — list users with their segment */
async function listUsers(req, res, next) {
  try {
    const users = await User.findAll({
      include: [{ model: Segment, as: 'segment', attributes: ['id', 'name'] }],
      attributes: ['id', 'name', 'email', 'role', 'bankCode', 'segmentId'],
      order: [['name', 'ASC']],
    });
    return ok(res, users);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSegments,
  createSegment,
  updateSegment,
  assignUserSegment,
  listSegmentPrices,
  upsertSegmentPrice,
  deleteSegmentPrice,
  listUsers,
};
