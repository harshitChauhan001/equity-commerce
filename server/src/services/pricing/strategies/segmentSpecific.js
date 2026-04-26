const { SegmentPrice } = require('../../../models');

async function resolve({ variant, variantId, customerId }) {
  if (!customerId) return null;

  const { User } = require('../../../models');
  const user = await User.findByPk(customerId, { attributes: ['id', 'segmentId'] });
  if (!user || !user.segmentId) return null;

  const entry = await SegmentPrice.findOne({ where: { segmentId: user.segmentId, variantId } });
  if (entry) return parseFloat(entry.price);

  const { Segment } = require('../../../models');
  const segment = await Segment.findByPk(user.segmentId, { attributes: ['priceMultiplier'] });

  if (segment && parseFloat(segment.priceMultiplier) !== 1.0) {
    return parseFloat((parseFloat(variant.basePrice) * parseFloat(segment.priceMultiplier)).toFixed(2));
  }

  return null;
}

module.exports = { name: 'segment_specific', resolve };
