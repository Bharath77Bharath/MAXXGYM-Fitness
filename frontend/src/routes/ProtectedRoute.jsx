import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      setAuthorized(false);
      return;
    }

    if (!currentUser) {
      // Not logged in — go to the appropriate auth page
      if (allowedRole === 'trainer') {
        navigate('/trainer/auth', { replace: true });
      } else if (allowedRole === 'client') {
        navigate('/client/auth', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    if (allowedRole && userRole && userRole !== allowedRole) {
      // Logged in with wrong role — go to correct dashboard
      if (userRole === 'trainer') {
        navigate('/trainer/dashboard', { replace: true });
      } else if (userRole === 'client') {
        navigate('/client/dashboard', { replace: true });
      }
      return;
    }

    if (currentUser && userRole === allowedRole) {
      // Fully authenticated with correct role
      setAuthorized(true);
    }
  }, [loading, currentUser, userRole, allowedRole, navigate]);

  // Show spinner while loading or while checking authorization
  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[#888888]">Loading...</span>
        </div>
      </div>
    );
  }

  return children;
};
