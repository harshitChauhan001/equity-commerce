import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

import '../styles/Header.css';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (name) =>
    name
      ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
      : '?';

  return (
    <header className="header">
      <div className="header__left">
        <Link to="/" className="header__logo-link">
          <h2 className="header__logo">⚡ Equity Commerce</h2>
        </Link>
        {user && (
          <nav className="header__nav">
            <Link to="/" className="header__nav-link">🏪 Store</Link>
            <Link to="/orders" className="header__nav-link">📦 My Orders</Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="header__nav-link header__nav-link--admin">⚡ Admin</Link>
            )}
          </nav>
        )}
      </div>
      {user && (
        <div className="header__right">
          <Link to="/cart" className="header__cart">
            🛒
            {cartCount > 0 && <span className="header__cart-badge">{cartCount}</span>}
          </Link>
          {user.bankCode && (
            <span className="header__bank-badge">🏦 {user.bankCode}</span>
          )}
          <div className="header__user-info">
            <div className="header__avatar">{getInitials(user.name)}</div>
            <div className="header__user-details">
              <span className="header__user-name">{user.name}</span>
              <span className="header__user-email">{user.email}</span>
            </div>
          </div>
          <button className="header__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
