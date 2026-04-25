import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, initialized, loading } = useSelector((state) => state.auth);

  if (!initialized || loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
