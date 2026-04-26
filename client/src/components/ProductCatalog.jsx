import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productsSlice';
import '../styles/ProductCatalog.css';

const PRODUCT_EMOJI = {
  watch: '⌚', phone: '📱', laptop: '💻', headphone: '🎧',
  earbud: '��', shoe: '👟', shirt: '👕', bag: '👜', book: '📚',
};
function getProductEmoji(name = '') {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(PRODUCT_EMOJI)) {
    if (lower.includes(k)) return v;
  }
  return '🛍️';
}

function ProductCatalog() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const [search, setSearch] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const filtered = list.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="catalog__loading-screen">
        <div className="catalog__spinner" />
        <p>Loading marketplace…</p>
      </div>
    );
  }

  return (
    <div className="catalog">
      {/* ── Hero / Welcome section ── */}
      <section className="hero">
        <div className="hero__content">
          <span className="hero__wave">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
          </span>
          <h1 className="hero__title">
            Discover Products<br />
            <span className="hero__highlight">Priced Just For You</span>
          </h1>
          <p className="hero__subtitle">
            Every customer gets personalized pricing based on their profile.
            Browse our curated collection and find your best deals.
          </p>
          <div className="hero__search">
            <span className="hero__search-icon">🔍</span>
            <input
              className="hero__search-input"
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="hero__search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <div className="hero__trust">
            <span className="hero__trust-item">✦ Personalised pricing for every buyer</span>
            <span className="hero__trust-dot" aria-hidden="true">·</span>
            <span className="hero__trust-item">🔒 Secure checkout</span>
            <span className="hero__trust-dot" aria-hidden="true">·</span>
            <span className="hero__trust-item">⚡ Real-time inventory</span>
            {user?.bankCode && (
              <>
                <span className="hero__trust-dot" aria-hidden="true">·</span>
                <span className="hero__trust-item hero__trust-item--bank">🏦 {user.bankCode} exclusive deals unlocked</span>
              </>
            )}
          </div>
        </div>
        {/* Subtle background shapes */}
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__shape hero__shape--1" />
          <div className="hero__shape hero__shape--2" />
          <div className="hero__shape hero__shape--3" />
        </div>
      </section>

      {/* ── Section header ── */}
      <div className="catalog__section-header">
        <h2 className="catalog__section-title">
          {search ? `Results for "${search}"` : 'All Products'}
        </h2>
        <span className="catalog__count">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="catalog__empty">
          <span className="catalog__empty-icon">🔎</span>
          <p>No products found for "{search}"</p>
          <button className="catalog__empty-btn" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="catalog__grid">
          {filtered.map((product) => {
            const minBase = Math.min(...product.variants.map((v) => parseFloat(v.basePrice)));
            const maxBase = Math.max(...product.variants.map((v) => parseFloat(v.basePrice)));
            const minPersonalized = Math.min(...product.variants.map((v) => parseFloat(v.personalizedPrice ?? v.basePrice)));
            const maxPersonalized = Math.max(...product.variants.map((v) => parseFloat(v.personalizedPrice ?? v.basePrice)));
            const hasDiscount = minPersonalized < minBase;
            const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
            const imgFailed = imgErrors[product.id];

            return (
              <div
                key={product.id}
                className="card"
                onClick={() => navigate(`/products/${product.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && navigate(`/products/${product.id}`)
                }
              >
                <div className="card__image-wrapper">
                  {!imgFailed && product.imageUrl ? (
                    <img
                      className="card__image"
                      src={product.imageUrl}
                      alt={product.name}
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [product.id]: true }))
                      }
                    />
                  ) : (
                    <div className="card__image-placeholder">
                      <span>{getProductEmoji(product.name)}</span>
                      <span className="card__image-placeholder-text">
                        {product.name}
                      </span>
                    </div>
                  )}
                  <div className="card__badges">
                    <span className="card__badge card__badge--variants">
                      {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                    </span>

                  </div>
                  <div className="card__overlay">
                    <span className="card__view-btn">View Details →</span>
                  </div>
                </div>

                <div className="card__body">
                  <h3 className="card__title">{product.name}</h3>
                  <p className="card__description">{product.description}</p>
                  <div className="card__meta">
                    <span className="card__stock">
                      <span
                        className={`card__stock-dot card__stock-dot--${
                          totalStock > 0 ? 'in' : 'out'
                        }`}
                      />
                      {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                    </span>
                    <span className="card__personalized">✦ Personalised</span>
                  </div>
                  <div className="card__footer">
                    <div className="card__price-range">
                      {hasDiscount && (
                        <span className="card__price-original">
                          ₹{minBase}{minBase !== maxBase ? ` – ₹${maxBase}` : ''}
                        </span>
                      )}
                      <span className="card__price">₹{minPersonalized}</span>
                      {minPersonalized !== maxPersonalized && (
                        <span className="card__price-to"> – ₹{maxPersonalized}</span>
                      )}
                      {hasDiscount && (
                        <span className="card__price-badge">
                          {Math.round((1 - minPersonalized / minBase) * 100)}% off
                        </span>
                      )}
                    </div>
                    <span className="card__arrow">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
