import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { fetchProductById } from '../store/slices/productsSlice';
import { addToCart, fetchCart } from '../store/slices/cartSlice';

import '../styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { current: product, loading } = useSelector((state) => state.products);
  const { loading: cartLoading } = useSelector((state) => state.cart);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  // Fetch product on mount
  useEffect(() => {
    setSelectedVariant(null);
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  // Auto-select first variant when product loads
  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  const variant = selectedVariant || product?.variants?.[0];
  const unitPrice = variant?.personalizedPrice ?? parseFloat(variant?.basePrice || 0);
  const subtotal = unitPrice * quantity;

  const handleAddToCart = useCallback(async () => {
    if (!variant) return;
    const result = await dispatch(addToCart({ variantId: variant.id, quantity }));
    if (addToCart.fulfilled.match(result)) {
      dispatch(fetchCart());
      toast.success('🛒 Added to cart! Apply coupons at checkout.');
    } else {
      toast.error(result.payload || 'Failed to add to cart');
    }
  }, [dispatch, variant, quantity]);

  if (loading || !product) {
    return <p className="detail__loading">Loading...</p>;
  }

  return (
    <div className="detail">
      <button className="detail__back" onClick={() => navigate('/')}>
        ← Back to Products
      </button>

      <div className="detail__layout">
        <div className="detail__image-container">
          {!imgError && product.imageUrl ? (
            <img
              className="detail__image"
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="detail__image-placeholder">
              <span>🛍️</span>
              <span className="detail__image-placeholder-text">{product.name}</span>
            </div>
          )}
        </div>

        <div className="detail__info">
          <h1 className="detail__title">{product.name}</h1>
          <p className="detail__description">{product.description}</p>

          {/* Variant Picker */}
          <div className="section">
            <span className="section__label">Variant</span>
            <div className="variants">
              {product.variants.map((v) => {
                let btnClass = 'variant-btn';
                if (variant?.id === v.id) btnClass += ' variant-btn--active';
                if (v.stock === 0) btnClass += ' variant-btn--oos';

                return (
                  <button
                    key={v.id}
                    className={btnClass}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock === 0}
                  >
                    {v.name}
                    {v.lowStock && (
                      <span className="variant-btn__low-stock">
                        {' '}· Only {v.stock} left
                      </span>
                    )}
                    {v.stock === 0 && (
                      <span className="variant-btn__oos"> · Out of stock</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Display */}
          <div className="section">
            <div className="price-box">
              <span className="price-box__label">Your Price:</span>
              <span className="price-box__current">₹{unitPrice}</span>
              {unitPrice !== parseFloat(variant?.basePrice) && (
                <>
                  <span className="price-box__base">
                    ₹{parseFloat(variant?.basePrice)}
                  </span>
                  <span className="price-box__savings">
                    Save ₹{(parseFloat(variant?.basePrice) - unitPrice).toFixed(0)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="section">
            <span className="section__label">Quantity</span>
            <div className="quantity">
              <button
                className="quantity__btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span className="quantity__value">{quantity}</span>
              <button
                className="quantity__btn"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
              >
                +
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="summary">
            <div className="summary__row">
              <span>Unit Price</span>
              <span>₹{unitPrice.toFixed(2)}</span>
            </div>
            <div className="summary__row">
              <span>Quantity</span>
              <span>× {quantity}</span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <p className="summary__coupon-note">🎟 Apply coupon codes at cart checkout</p>
          </div>

          {/* Add to Cart */}
          <button
            className="order-btn"
            onClick={handleAddToCart}
            disabled={cartLoading || !variant?.inStock}
          >
            {cartLoading ? 'Adding...' : '🛒 Add to Cart'}
          </button>

          <p className="detail__cart-hint">Items are not reserved until you checkout from your cart.</p>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
