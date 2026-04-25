import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  checkoutCart,
  clearCheckout,
} from '../store/slices/cartSlice';
import { validateOffer, clearOffer } from '../store/slices/orderSlice';
import '../styles/Cart.css';

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, shippingFee, freeShippingThreshold, loading, checkoutLoading, lastCheckout } =
    useSelector((s) => s.cart);
  const { offer } = useSelector((s) => s.order);
  const { user } = useSelector((s) => s.auth);
  const [offerCode, setOfferCode] = useState('');
  const [bankOffers, setBankOffers] = useState([]);

  useEffect(() => {
    dispatch(fetchCart());
    dispatch(clearOffer());
    dispatch(clearCheckout());
    // Fetch bank-specific + universal offers for this user
    api.get('/offers/available').then((res) => {
      const d = res.data.data;
      // Response shape: { bankCode, offers } OR array
      setBankOffers(Array.isArray(d) ? d : (d?.offers || []));
    }).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (lastCheckout) {
      toast.success(`🎉 Order placed! ${lastCheckout.orders.length} item(s) confirmed.`);
      navigate('/orders');
    }
  }, [lastCheckout, navigate]);

  const handleQtyChange = (itemId, newQty) => {
    if (newQty < 1) return;
    dispatch(updateCartItem({ itemId, quantity: newQty })).then(() => dispatch(fetchCart()));
  };

  const handleRemove = (itemId) => {
    dispatch(removeFromCart(itemId)).then(() => dispatch(fetchCart()));
  };

  const handleApplyOffer = (code) => {
    const c = (code || offerCode).trim();
    if (!c) return;
    setOfferCode(c.toUpperCase());
    dispatch(validateOffer({ code: c, orderAmount: totalAmount }));
  };

  const handleCheckout = async () => {
    try {
      await dispatch(checkoutCart({ offerCode: offerCode.trim() || undefined })).unwrap();
    } catch (err) {
      toast.error(err || 'Checkout failed');
      dispatch(fetchCart());
    }
  };

  // Discount preview
  let discountAmount = 0;
  if (offer) {
    if (offer.discountType === 'flat') {
      discountAmount = Math.min(parseFloat(offer.discountValue), totalAmount);
    } else {
      discountAmount = Math.round(((totalAmount * parseFloat(offer.discountValue)) / 100) * 100) / 100;
    }
    if (discountAmount > 500) discountAmount = 500;
  }
  const grandTotal = Math.max(0, totalAmount - discountAmount) + shippingFee;
  const toFreeShipping = Math.max(0, freeShippingThreshold - totalAmount);

  // Split offers: bank-specific vs universal
  const userBankCode = user?.bankCode;
  const myBankOffers = bankOffers.filter((o) => o.targetBankCode === userBankCode);
  const universalOffers = bankOffers.filter((o) => !o.targetBankCode);

  const formatOfferDesc = (o) => {
    const disc = o.discountType === 'flat'
      ? `₹${o.discountValue} off`
      : `${o.discountValue}% off`;
    const min = parseFloat(o.minOrderAmount) > 0 ? ` on ₹${o.minOrderAmount}+` : '';
    return disc + min;
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="cart-loading__spinner" />
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0 && !lastCheckout) {
    return (
      <div className="cart-empty">
        <span className="cart-empty__icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <button className="cart-empty__btn" onClick={() => navigate('/')}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart__header">
        <h1>🛒 Your Cart <span className="cart__count">({items.length} item{items.length !== 1 ? 's' : ''})</span></h1>
      </div>

      {toFreeShipping > 0 && (
        <div className="cart__shipping-banner">
          🚚 Add <strong>₹{toFreeShipping.toFixed(0)}</strong> more for <strong>FREE shipping!</strong>
        </div>
      )}
      {shippingFee === 0 && items.length > 0 && (
        <div className="cart__shipping-banner cart__shipping-banner--free">
          ✅ You qualify for <strong>FREE shipping!</strong>
        </div>
      )}

      <div className="cart__layout">
        {/* Items */}
        <div className="cart__items">
          {items.map((item) => {
            const price = parseFloat(item.variant?.basePrice || 0);
            return (
              <div key={item.id} className="cart-item">
                <img
                  className="cart-item__img"
                  src={item.variant?.product?.imageUrl}
                  alt={item.variant?.product?.name}
                />
                <div className="cart-item__info">
                  <h3 className="cart-item__product">{item.variant?.product?.name}</h3>
                  <p className="cart-item__variant">{item.variant?.name}</p>
                  <p className="cart-item__price">₹{price} each</p>
                </div>
                <div className="cart-item__controls">
                  <div className="cart-item__qty">
                    <button onClick={() => handleQtyChange(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQtyChange(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <p className="cart-item__subtotal">₹{(price * item.quantity).toFixed(0)}</p>
                  <button className="cart-item__remove" onClick={() => handleRemove(item.id)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="cart__summary">
          <h2 className="cart__summary-title">Order Summary</h2>

          {/* Bank Offers Section */}
          {myBankOffers.length > 0 && (
            <div className="cart__bank-offers">
              <div className="cart__bank-offers-header">
                <div className="cart__bank-offers-title">
                  �� Your Bank Offers
                </div>
                <span className="cart__bank-badge">{userBankCode}</span>
              </div>
              {myBankOffers.map((bo) => {
                const isApplied = offerCode === bo.code && offer;
                return (
                  <div
                    key={bo.id}
                    className={`cart__bank-offer-card${isApplied ? ' cart__bank-offer-card--applied' : ''}`}
                    onClick={() => handleApplyOffer(bo.code)}
                  >
                    <div className="cart__bank-offer-info">
                      <div className="cart__bank-offer-code">{bo.code}</div>
                      <div className="cart__bank-offer-desc">{formatOfferDesc(bo)}</div>
                    </div>
                    <button
                      className={`cart__bank-offer-apply${isApplied ? ' cart__bank-offer-apply--applied' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleApplyOffer(bo.code); }}
                    >
                      {isApplied ? '✓ Applied' : 'Apply'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Coupon code input */}
          <div className="cart__offer">
            <label className="cart__offer-label">Coupon Code</label>
            <div className="cart__offer-row">
              <input
                className="cart__offer-input"
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE100"
              />
              <button className="cart__offer-apply" onClick={() => handleApplyOffer()}>
                Apply
              </button>
            </div>
            {offer && (
              <p className="cart__offer-success">
                ✅ {offer.discountType === 'flat' ? `₹${offer.discountValue} off` : `${offer.discountValue}% off`} applied!
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="cart__totals">
            <div className="cart__totals-row">
              <span>Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="cart__totals-row cart__totals-row--discount">
                <span>Discount</span>
                <span>−₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="cart__totals-row">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? <span className="cart__free">FREE</span> : `₹${shippingFee}`}</span>
            </div>
            <div className="cart__totals-row cart__totals-row--total">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="cart__checkout-btn"
            onClick={handleCheckout}
            disabled={checkoutLoading || items.length === 0}
          >
            {checkoutLoading ? 'Processing...' : `Pay ₹${grandTotal.toFixed(2)}`}
          </button>

          {/* Universal offers */}
          {universalOffers.length > 0 && (
            <div className="cart__available-coupons">
              <p className="cart__coupons-title">Universal Offers</p>
              {universalOffers.map((uo) => (
                <div
                  key={uo.id}
                  className="cart__coupon-tag"
                  onClick={() => handleApplyOffer(uo.code)}
                >
                  <strong>{uo.code}</strong> — {formatOfferDesc(uo)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cart;
