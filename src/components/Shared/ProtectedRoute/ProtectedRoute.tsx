import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ErrorPage from '../../ErrorPage/ErrorPage';
import Spinner from '../../Shared/Spinner/Spinner';

// Props type definition for ProtectedRoute
type ProtectedRouteProps = {
  adminOnly?: boolean;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <ErrorPage />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
