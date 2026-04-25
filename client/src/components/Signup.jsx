import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { signup, clearAuthError } from '../store/slices/authSlice';
import '../styles/Auth.css';

const BANKS = [
  { value: '', label: '— No bank / Skip —' },
  { value: 'HDFC',  label: '🏦 HDFC Bank' },
  { value: 'ICICI', label: '🏦 ICICI Bank' },
  { value: 'SBI',   label: '🏦 State Bank of India' },
  { value: 'AXIS',  label: '🏦 Axis Bank' },
  { value: 'KOTAK', label: '🏦 Kotak Mahindra Bank' },
];

function Signup() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', bankCode: '' });

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const payload = { name: form.name, email: form.email, password: form.password };
    if (form.bankCode) payload.bankCode = form.bankCode;
    dispatch(signup(payload));
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <div className="auth__brand-icon">⚡</div>
          <span className="auth__brand-name">Equity Commerce</span>
        </div>

        <div className="auth__header">
          <h1 className="auth__title">Create Account</h1>
          <p className="auth__subtitle">Join and get personalized offers</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <label className="auth__label">Full Name</label>
            <input
              className="auth__input"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

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
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="auth__field">
            <label className="auth__label">Your Bank <span style={{color:'rgba(255,255,255,0.3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(for exclusive offers)</span></label>
            <select
              className="auth__select"
              value={form.bankCode}
              onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
            >
              {BANKS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            {form.bankCode && (
              <p className="auth__bank-hint">
                🎁 You'll get exclusive {form.bankCode} bank offers at checkout!
              </p>
            )}
          </div>

          <button className="auth__submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth__footer">
          Already have an account? <Link to="/login" className="auth__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
