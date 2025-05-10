import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Spinner from '../../Shared/Spinner/Spinner';

interface GuestRouteProps {
  redirectTo?: string;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ redirectTo = '/' }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

  if (loading) {
    return <Spinner />;
  }

  return !isAuthenticated ? <Outlet /> : null;
};

export default GuestRoute;
