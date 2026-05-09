import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleGuard = ({ children, allowedRoles, requiredRole }) => {
  const userStr = localStorage.getItem('user');
  const userRole = userStr ? JSON.parse(userStr)?.role : null;

  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleGuard;