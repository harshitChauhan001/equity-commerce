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
  const [segments, setSegments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentPrices, setSegmentPrices] = useState([]);
  const [newSegment, setNewSegment] = useState({ name: '', description: '', priceMultiplier: '1.0' });
  const [showNewSegmentForm, setShowNewSegmentForm] = useState(false);
  const [newSegmentPrice, setNewSegmentPrice] = useState({ variantId: '', price: '' });
  const [statsLoading, setStatsLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState(null);
  const [newOffer, setNewOffer] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', firstOrderOnly: false, targetBankCode: '' });
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingStock, setEditingStock] = useState({}); // { [variantId]: newStockValue }

  const loadAll = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, offersRes, inventoryRes, segmentsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/offers'),
        api.get('/admin/inventory'),
        api.get('/admin/segments'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data.data);
      setOffers(offersRes.data.data);
      setInventory(inventoryRes.data.data);
      setSegments(segmentsRes.data.data);
      setUsers(usersRes.data.data);
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
      setNewOffer({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', firstOrderOnly: false, targetBankCode: '' });
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

  const handleCreateSegment = async () => {
    if (!newSegment.name.trim()) { toast.error('Segment name required'); return; }
    try {
      const discountPct = parseFloat(newSegment.priceMultiplier) || 0;
      const multiplier = parseFloat((1 - discountPct / 100).toFixed(4));
      const res = await api.post('/admin/segments', {
        name: newSegment.name.toUpperCase(),
        description: newSegment.description,
        priceMultiplier: multiplier,
      });
      setSegments((prev) => [...prev, { ...res.data.data, users: [] }]);
      setNewSegment({ name: '', description: '', priceMultiplier: '1.0' });
      setShowNewSegmentForm(false);
      toast.success('Segment created!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Create failed');
    }
  };

  const handleSelectSegment = async (seg) => {
    setSelectedSegment(seg);
    setNewSegmentPrice({ variantId: '', price: '' });
    try {
      const res = await api.get(`/admin/segments/${seg.id}/prices`);
      setSegmentPrices(res.data.data);
    } catch {
      toast.error('Failed to load segment prices');
    }
  };

  const handleUpsertSegmentPrice = async () => {
    if (!newSegmentPrice.variantId || !newSegmentPrice.price) { toast.error('Select a variant and enter price'); return; }
    try {
      const res = await api.post(`/admin/segments/${selectedSegment.id}/prices`, {
        variantId: newSegmentPrice.variantId,
        price: parseFloat(newSegmentPrice.price),
      });
      setSegmentPrices((prev) => {
        const idx = prev.findIndex((p) => p.variantId === res.data.data.variantId);
        if (idx >= 0) { const n = [...prev]; n[idx] = res.data.data; return n; }
        return [...prev, res.data.data];
      });
      setNewSegmentPrice({ variantId: '', price: '' });
      toast.success('Price saved!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Save failed');
    }
  };

  const handleDeleteSegmentPrice = async (priceId) => {
    try {
      await api.delete(`/admin/segments/${selectedSegment.id}/prices/${priceId}`);
      setSegmentPrices((prev) => prev.filter((p) => p.id !== priceId));
      toast.success('Price override removed');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAssignUserSegment = async (userId, segmentId) => {
    try {
      await api.put(`/admin/users/${userId}/segment`, { segmentId: segmentId || null });
      setUsers((prev) => prev.map((u) => {
        if (u.id !== userId) return u;
        const seg = segments.find((s) => s.id === segmentId) || null;
        return { ...u, segmentId: segmentId || null, segment: seg ? { id: seg.id, name: seg.name } : null };
      }));
      toast.success('User segment updated');
    } catch {
      toast.error('Update failed');
    }
  };

  // Flat list of all variants from inventory for segment price form
  const allVariants = inventory.flatMap((p) =>
    (p.variants || []).map((v) => ({ ...v, productName: p.name }))
  );

  return (
    <div className="admin">
      <div className="admin__header">
        <h1>⚡ Admin Dashboard</h1>
        <p className="admin__subtitle">Manage coupons, monitor orders, track revenue</p>
      </div>

      {/* Tabs */}
      <div className="admin__tabs">
        {['overview', 'coupons', 'inventory', 'segments', 'orders'].map((tab) => (
          <button
            key={tab}
            className={`admin__tab ${activeTab === tab ? 'admin__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'coupons' ? '🎟 Coupons' : tab === 'inventory' ? '📦 Inventory' : tab === 'segments' ? '🏷 Segments' : '🧾 Orders'}
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
                <label>Target Bank (leave empty for all users)
                  <select value={newOffer.targetBankCode} onChange={(e) => setNewOffer({ ...newOffer, targetBankCode: e.target.value })}>
                    <option value="">All Banks / Universal</option>
                    <option value="HDFC">HDFC</option>
                    <option value="ICICI">ICICI</option>
                    <option value="SBI">SBI</option>
                    <option value="AXIS">AXIS</option>
                    <option value="KOTAK">KOTAK</option>
                  </select>
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

      {/* SEGMENTS TAB */}
      {activeTab === 'segments' && (
        <div className="admin__segments">
          <div className="admin__segments-layout">

            {/* Left — segment list + create */}
            <div className="admin__segments-sidebar">
              <div className="admin__section-header">
                <h2>Pricing Segments</h2>
                <button className="admin__btn admin__btn--primary" onClick={() => setShowNewSegmentForm((v) => !v)}>
                  {showNewSegmentForm ? '✕ Cancel' : '+ New'}
                </button>
              </div>

              {showNewSegmentForm && (
                <div className="admin__new-offer" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>Name
                      <input value={newSegment.name} onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value.toUpperCase() })} placeholder="e.g. PREMIUM" />
                    </label>
                    <label>% Discount (e.g. 10 = 10% off)
                      <input type="number" step="1" min="0" max="90" value={newSegment.priceMultiplier}
                        onChange={(e) => setNewSegment({ ...newSegment, priceMultiplier: e.target.value })}
                        placeholder="0 = no discount, 10 = 10% off" />
                    </label>
                    <label>Description
                      <input value={newSegment.description} onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })} placeholder="Optional" />
                    </label>
                  </div>
                  <button className="admin__btn admin__btn--success" style={{ marginTop: '0.75rem', width: '100%' }} onClick={handleCreateSegment}>Create Segment</button>
                </div>
              )}

              <div className="admin__segment-list">
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    className={`admin__segment-card ${selectedSegment?.id === seg.id ? 'admin__segment-card--active' : ''}`}
                    onClick={() => handleSelectSegment(seg)}
                  >
                    <div className="admin__segment-name">{seg.name}</div>
                    <div className="admin__segment-meta">
                      <span className="admin__tag">{seg.users?.length || 0} users</span>
                      <span className="admin__tag" style={{ background: parseFloat(seg.priceMultiplier) < 1 ? '#dcfce7' : '#f1f5f9', color: parseFloat(seg.priceMultiplier) < 1 ? '#16a34a' : '#64748b' }}>
                        {parseFloat(seg.priceMultiplier) < 1 ? `${Math.round((1 - parseFloat(seg.priceMultiplier)) * 100)}% off` : 'No discount'}
                      </span>
                    </div>
                    {seg.description && <div className="admin__segment-desc">{seg.description}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — segment detail (prices + users) */}
            {selectedSegment ? (
              <div className="admin__segments-detail">
                <h3>🏷 {selectedSegment.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
                  Global discount: <strong style={{ color: '#6366f1' }}>
                    {selectedSegment.priceMultiplier < 1
                      ? `${Math.round((1 - parseFloat(selectedSegment.priceMultiplier)) * 100)}% off all products`
                      : 'No discount (×1.00)'}
                  </strong>
                  {' '}— applies automatically to every product variant for users in this segment.
                </p>

                {/* Users in segment */}
                <div className="admin__section-header" style={{ marginTop: '1.5rem' }}>
                  <h4>Users in this segment</h4>
                </div>
                <div className="admin__inv-variants">
                  {users.filter((u) => u.segmentId === selectedSegment.id).length === 0 && (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '8px 0' }}>No users assigned yet.</p>
                  )}
                  {users.filter((u) => u.segmentId === selectedSegment.id).map((u) => (
                    <div key={u.id} className="admin__inv-row">
                      <span className="admin__inv-variant-name">{u.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{u.email}</span>
                      {u.bankCode && <span className="admin__tag">{u.bankCode}</span>}
                      <span className="admin__inv-actions">
                        <button className="admin__btn admin__btn--xs admin__btn--danger" onClick={() => handleAssignUserSegment(u.id, null)}>Remove</button>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Assign user */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    style={{ flex: 1, height: 38, borderRadius: 6, border: '1px solid #e2e8f0', padding: '0 0.5rem' }}
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) handleAssignUserSegment(e.target.value, selectedSegment.id); e.target.value = ''; }}
                  >
                    <option value="">Assign user to {selectedSegment.name}…</option>
                    {users.filter((u) => u.segmentId !== selectedSegment.id).map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email}){u.segment ? ` — currently ${u.segment.name}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="admin__segments-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                ← Select a segment to manage prices and users
              </div>
            )}
          </div>
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
