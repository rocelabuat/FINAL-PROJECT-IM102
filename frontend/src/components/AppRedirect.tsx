// src/components/AppRedirect.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AppRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // wait until user is loaded

    if (!user) return; // guest, no redirect

    switch (user.role) {
      case 'customer':
        navigate('/customer/dashboard', { replace: true });
        break;
      case 'staff':
        navigate('/staff/dashboard', { replace: true });
        break;
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
    }
  }, [user, loading, navigate]);

  return null; // this component does not render anything
};
