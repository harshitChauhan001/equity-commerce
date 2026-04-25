import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchOrderHistory } from '../store/slices/orderHistorySlice';
import '../styles/OrderHistory.css';

function OrderHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useSelector((s) => s.orderHistory);

  useEffect(() => { dispatch(fetchOrderHistory()); }, [dispatch]);

  if (loading) {
    return (
      <div className="orders__loading">
        <div className="orders__spinner" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders" style={{ paddingTop: 60 }}>
        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>⚠️ {error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders__empty">
        <span className="orders__empty-icon">📦</span>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No orders yet</h2>
        <p>Your confirmed orders will appear here.</p>
        <button className="orders__empty-btn" onClick={() => navigate('/')}>Start Shopping</button>
      </div>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
  const totalSaved = orders.reduce((s, o) => s + parseFloat(o.discount || 0), 0);

  return (
    <div className="orders">
      <div className="orders__header">
        <h1 className="orders__title">📦 My Orders</h1>
        <span className="orders__count">{orders.length} orders</span>
      </div>

      <div className="orders__list">
        {orders.map((order) => {
          const discount = parseFloat(order.discount || 0);
          const totalAmount = parseFloat(order.totalAmount || 0);
          const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          });
          const items = order.items || [];
          return (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <div className="order-card__left">
                  <span className="order-card__id">{order.orderNumber || '#' + order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="order-card__date">{date}</span>
                </div>
                <span className={`order-card__status order-card__status--${order.status}`}>
                  {order.status === 'confirmed' ? '✅' : order.status === 'delivered' ? '📦' : '❌'} {order.status}
                </span>
              </div>

              {items.map((item) => {
                const product = item.variant?.product;
                const unitPrice = parseFloat(item.unitPrice);
                const itemDiscount = parseFloat(item.discount || 0);
                const finalPrice = parseFloat(item.finalPrice);
                return (
                  <div key={item.id} className="order-card__body">
                    <img
                      className="order-card__img"
                      src={product?.imageUrl}
                      alt={product?.name}
                    />
                    <div className="order-card__info">
                      <p className="order-card__product">{product?.name}</p>
                      <p className="order-card__variant">{item.variant?.name}</p>
                      <div className="order-card__meta">
                        <span className="order-card__qty">Qty: {item.quantity} × ₹{unitPrice.toFixed(0)}</span>
                        {itemDiscount > 0 && order.offer && (
                          <span className="order-card__offer">🏷 {order.offer.code} −₹{itemDiscount.toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="order-card__price-block">
                      <div className="order-card__final">₹{finalPrice.toFixed(0)}</div>
                      {itemDiscount > 0 && (
                        <>
                          <div className="order-card__original">₹{(unitPrice * item.quantity).toFixed(0)}</div>
                          <div className="order-card__saved">saved ₹{itemDiscount.toFixed(0)}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {discount > 0 && (
                <div className="order-card__footer">
                  <span className="order-card__total-label">Order Total</span>
                  <span className="order-card__total">₹{totalAmount.toFixed(0)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="orders__summary">
        <div className="orders__summary-item">
          <span className="orders__summary-label">Total Orders</span>
          <span className="orders__summary-value">{orders.length}</span>
        </div>
        <div className="orders__summary-item">
          <span className="orders__summary-label">Total Spent</span>
          <span className="orders__summary-value">₹{totalSpent.toFixed(0)}</span>
        </div>
        {totalSaved > 0 && (
          <div className="orders__summary-item">
            <span className="orders__summary-label">Total Saved</span>
            <span className="orders__summary-value orders__summary-value--green">₹{totalSaved.toFixed(0)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
