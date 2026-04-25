import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { login, clearAuthError } from '../store/slices/authSlice';
import '../styles/Auth.css';

function Login() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(login(form));
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <div className="auth__brand-icon">⚡</div>
          <span className="auth__brand-name">Equity Commerce</span>
        </div>
        <div className="auth__header">
          <h1 className="auth__title">Welcome</h1>
          <p className="auth__subtitle">Sign in to your account</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <label className="auth__label">Email</label>
            <input
              className="auth__input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input
              className="auth__input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="auth__submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth__footer">
          Don't have an account? <Link to="/signup" className="auth__link">Sign up</Link>
        </p>

        <div className="auth__demo">
          <p className="auth__demo-title">Demo Accounts</p>
          <div className="auth__demo-accounts" style={{gridTemplateColumns:'1fr 1fr'}}>
            <button className="auth__demo-btn" onClick={() => setForm({ email: 'alice@example.com', password: 'password123' })}>
              🏦 Alice — HDFC (Admin)
            </button>
            <button className="auth__demo-btn" onClick={() => setForm({ email: 'bob@example.com', password: 'password123' })}>
              🏦 Bob — ICICI
            </button>
            <button className="auth__demo-btn" onClick={() => setForm({ email: 'priya@example.com', password: 'password123' })}>
              🏦 Priya — SBI
            </button>
            <button className="auth__demo-btn" onClick={() => setForm({ email: 'rahul@example.com', password: 'password123' })}>
              🏦 Rahul — AXIS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
