import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../api';
import { fetchAllOrders } from '../store/slices/orderHistorySlice';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const dispatch = useDispatch();
  const { allOrders, loading: ordersLoading } = useSelector((s) => s.orderHistory);

  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState(null);
  const [newOffer, setNewOffer] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', firstOrderOnly: false });
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingStock, setEditingStock] = useState({}); // { [variantId]: newStockValue }

  const loadAll = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, offersRes, inventoryRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/offers'),
        api.get('/admin/inventory'),
      ]);
      setStats(statsRes.data.data);
      setOffers(offersRes.data.data);
      setInventory(inventoryRes.data.data);
      dispatch(fetchAllOrders());
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setStatsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUpdateOffer = async (id, updates) => {
    try {
      const res = await api.put(`/admin/offers/${id}`, updates);
      setOffers((prev) => prev.map((o) => (o.id === id ? res.data.data : o)));
      setEditingOffer(null);
      toast.success('Coupon updated!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed');
    }
  };

  const handleToggleActive = (offer) => {
    handleUpdateOffer(offer.id, { active: !offer.active });
  };

  const handleCreateOffer = async () => {
    try {
      const body = {
        ...newOffer,
        discountValue: parseFloat(newOffer.discountValue),
        minOrderAmount: parseFloat(newOffer.minOrderAmount) || 0,
      };
      const res = await api.post('/admin/offers', body);
      setOffers((prev) => [res.data.data, ...prev]);
      setShowNewForm(false);
      setNewOffer({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', firstOrderOnly: false });
      toast.success('Coupon created!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Create failed');
    }
  };

  const handleUpdateStock = async (variantId, newStock) => {
    const val = parseInt(newStock, 10);
    if (isNaN(val) || val < 0) { toast.error('Stock must be 0 or more'); return; }
    try {
      const res = await api.put(`/admin/variants/${variantId}/stock`, { stock: val });
      const updated = res.data.data;
      setInventory((prev) => prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) => v.id === variantId ? { ...v, stock: updated.stock } : v),
      })));
      setEditingStock((prev) => { const n = { ...prev }; delete n[variantId]; return n; });
      toast.success(`Stock updated to ${updated.stock}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Stock update failed');
    }
  };

  const totalRevenue = stats?.totalRevenue || 0;

  return (
    <div className="admin">
      <div className="admin__header">
        <h1>⚡ Admin Dashboard</h1>
        <p className="admin__subtitle">Manage coupons, monitor orders, track revenue</p>
      </div>

      {/* Tabs */}
      <div className="admin__tabs">
        {['overview', 'coupons', 'inventory', 'orders'].map((tab) => (
          <button
            key={tab}
            className={`admin__tab ${activeTab === tab ? 'admin__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'coupons' ? '🎟 Coupons' : tab === 'inventory' ? '📦 Inventory' : '🧾 Orders'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          {statsLoading ? (
            <div className="admin__loading"><div className="admin__spinner" /></div>
          ) : (
            <div className="admin__stats">
              <div className="admin__stat-card admin__stat-card--purple">
                <div className="admin__stat-icon">💰</div>
                <div className="admin__stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <div className="admin__stat-label">Total Revenue</div>
              </div>
              <div className="admin__stat-card admin__stat-card--blue">
                <div className="admin__stat-icon">📦</div>
                <div className="admin__stat-value">{stats?.totalOrders || 0}</div>
                <div className="admin__stat-label">Total Orders</div>
              </div>
              <div className="admin__stat-card admin__stat-card--green">
                <div className="admin__stat-icon">👥</div>
                <div className="admin__stat-value">{stats?.totalUsers || 0}</div>
                <div className="admin__stat-label">Registered Users</div>
              </div>
              <div className="admin__stat-card admin__stat-card--orange">
                <div className="admin__stat-icon">🎟</div>
                <div className="admin__stat-value">{stats?.activeOffers || 0}</div>
                <div className="admin__stat-label">Active Coupons</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="admin__coupons">
          <div className="admin__section-header">
            <h2>Coupon Management</h2>
            <button className="admin__btn admin__btn--primary" onClick={() => setShowNewForm((v) => !v)}>
              {showNewForm ? '✕ Cancel' : '+ New Coupon'}
            </button>
          </div>

          {showNewForm && (
            <div className="admin__new-offer">
              <h3>Create New Coupon</h3>
              <div className="admin__form-grid">
                <label>Code
                  <input value={newOffer.code} onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
                </label>
                <label>Type
                  <select value={newOffer.discountType} onChange={(e) => setNewOffer({ ...newOffer, discountType: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </label>
                <label>Discount {newOffer.discountType === 'percentage' ? '%' : '₹'}
                  <input type="number" value={newOffer.discountValue} onChange={(e) => setNewOffer({ ...newOffer, discountValue: e.target.value })} placeholder="10" />
                </label>
                <label>Min Order (₹)
                  <input type="number" value={newOffer.minOrderAmount} onChange={(e) => setNewOffer({ ...newOffer, minOrderAmount: e.target.value })} placeholder="0" />
                </label>
                <label className="admin__form-checkbox">
                  <input type="checkbox" checked={newOffer.firstOrderOnly} onChange={(e) => setNewOffer({ ...newOffer, firstOrderOnly: e.target.checked })} />
                  First-order only
                </label>
              </div>
              <button className="admin__btn admin__btn--success" onClick={handleCreateOffer}>Create Coupon</button>
            </div>
          )}

          <div className="admin__offers-table">
            <div className="admin__table-head">
              <span>Code</span>
              <span>Discount</span>
              <span>Min Order</span>
              <span>Used</span>
              <span>Restrictions</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {offers.map((offer) => (
              <div key={offer.id} className={`admin__table-row ${!offer.active ? 'admin__table-row--inactive' : ''}`}>
                <span className="admin__offer-code">{offer.code}</span>
                <span>
                  {editingOffer?.id === offer.id ? (
                    <input
                      type="number"
                      className="admin__inline-input"
                      value={editingOffer.discountValue}
                      onChange={(e) => setEditingOffer({ ...editingOffer, discountValue: e.target.value })}
                    />
                  ) : (
                    <span className={`admin__discount-badge admin__discount-badge--${offer.discountType}`}>
                      {offer.discountType === 'flat' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}
                    </span>
                  )}
                </span>
                <span>₹{parseFloat(offer.minOrderAmount || 0).toFixed(0)}+</span>
                <span>{offer.usedCount}{offer.maxUses ? `/${offer.maxUses}` : ''}</span>
                <span className="admin__restrictions">
                  {offer.firstOrderOnly && <span className="admin__tag">1st order</span>}
                  {offer.perCustomerLimit && <span className="admin__tag">{offer.perCustomerLimit}x/user</span>}
                  {offer.validUntil && new Date(offer.validUntil) < new Date() && <span className="admin__tag admin__tag--red">Expired</span>}
                </span>
                <span>
                  <span className={`admin__status-dot ${offer.active ? 'admin__status-dot--on' : 'admin__status-dot--off'}`} />
                  {offer.active ? 'Active' : 'Paused'}
                </span>
                <span className="admin__actions">
                  {editingOffer?.id === offer.id ? (
                    <>
                      <button className="admin__btn admin__btn--xs admin__btn--success"
                        onClick={() => handleUpdateOffer(offer.id, { discountValue: parseFloat(editingOffer.discountValue) })}>
                        Save
                      </button>
                      <button className="admin__btn admin__btn--xs" onClick={() => setEditingOffer(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="admin__btn admin__btn--xs admin__btn--outline"
                        onClick={() => setEditingOffer({ id: offer.id, discountValue: offer.discountValue })}>
                        Edit %
                      </button>
                      <button
                        className={`admin__btn admin__btn--xs ${offer.active ? 'admin__btn--danger' : 'admin__btn--success'}`}
                        onClick={() => handleToggleActive(offer)}
                      >
                        {offer.active ? 'Pause' : 'Activate'}
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="admin__inventory">
          <div className="admin__section-header">
            <h2>Inventory Management</h2>
            <button className="admin__btn admin__btn--outline" onClick={loadAll}>↺ Refresh</button>
          </div>
          {inventory.map((product) => (
            <div key={product.id} className="admin__inv-product">
              <div className="admin__inv-product-name">{product.name}</div>
              <div className="admin__inv-variants">
                {product.variants.map((v) => {
                  const isEditing = editingStock[v.id] !== undefined;
                  const stockVal = isEditing ? editingStock[v.id] : v.stock;
                  const stockClass = v.stock === 0 ? 'oos' : v.stock <= 5 ? 'low' : 'ok';
                  return (
                    <div key={v.id} className="admin__inv-row">
                      <span className="admin__inv-variant-name">{v.name}</span>
                      <span className="admin__inv-sku">{v.sku || '—'}</span>
                      <span className={`admin__inv-stock admin__inv-stock--${stockClass}`}>
                        {v.stock === 0 ? '⛔ Out of stock' : v.stock <= 5 ? `⚠️ ${v.stock} left` : `✅ ${v.stock} in stock`}
                      </span>
                      {isEditing ? (
                        <span className="admin__inv-actions">
                          <input
                            type="number"
                            min="0"
                            className="admin__inline-input"
                            value={stockVal}
                            onChange={(e) => setEditingStock((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          />
                          <button className="admin__btn admin__btn--xs admin__btn--success"
                            onClick={() => handleUpdateStock(v.id, editingStock[v.id])}>
                            Save
                          </button>
                          <button className="admin__btn admin__btn--xs"
                            onClick={() => setEditingStock((prev) => { const n = { ...prev }; delete n[v.id]; return n; })}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span className="admin__inv-actions">
                          <button className="admin__btn admin__btn--xs admin__btn--outline"
                            onClick={() => setEditingStock((prev) => ({ ...prev, [v.id]: String(v.stock) }))}>
                            ✏️ Edit Stock
                          </button>
                          <button className="admin__btn admin__btn--xs admin__btn--success"
                            onClick={() => handleUpdateStock(v.id, v.stock + 10)}>
                            +10
                          </button>
                          <button className="admin__btn admin__btn--xs admin__btn--success"
                            onClick={() => handleUpdateStock(v.id, v.stock + 50)}>
                            +50
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="admin__orders">
          <h2>All Orders ({allOrders.length})</h2>
          {ordersLoading ? (
            <div className="admin__loading"><div className="admin__spinner" /></div>
          ) : (
            <div className="admin__orders-table">
              <div className="admin__table-head">
                <span>Order ID</span>
                <span>Customer</span>
                <span>Product</span>
                <span>Qty</span>
                <span>Unit ₹</span>
                <span>Discount</span>
                <span>Final ₹</span>
                <span>Coupon</span>
                <span>Date</span>
                <span>Status</span>
              </div>
              {allOrders.map((order) => (
                <div key={order.id} className="admin__table-row">
                  <span className="admin__order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span>{order.user?.email || '—'}</span>
                  <span>{order.variant?.product?.name} / {order.variant?.name}</span>
                  <span>{order.quantity}</span>
                  <span>₹{parseFloat(order.unitPrice).toFixed(0)}</span>
                  <span className={parseFloat(order.discount) > 0 ? 'admin__discount-cell' : ''}>
                    {parseFloat(order.discount) > 0 ? `−₹${parseFloat(order.discount).toFixed(0)}` : '—'}
                  </span>
                  <span><strong>₹{parseFloat(order.finalPrice).toFixed(0)}</strong></span>
                  <span>{order.offer?.code || '—'}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                  <span className={`admin__status-badge admin__status-badge--${order.status}`}>{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
