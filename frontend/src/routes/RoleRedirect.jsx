import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const RoleRedirect = () => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      navigate('/', { replace: true });
      return;
    }

    if (userRole === 'trainer') {
      navigate('/trainer/dashboard', { replace: true });
    } else if (userRole === 'client') {
      navigate('/client/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [loading, currentUser, userRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
      <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
