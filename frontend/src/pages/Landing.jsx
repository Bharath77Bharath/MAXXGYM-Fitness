import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Landing = () => {
  const { currentUser, userRole, loading } = useAuth();

  // Show loading while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // If already logged in, redirect to the correct dashboard
  if (currentUser && userRole === 'trainer') {
    return <Navigate to="/trainer/dashboard" replace />;
  }
  if (currentUser && userRole === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0B0B0B]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FFD000 0, #FFD000 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="flex items-center gap-3 mb-6">
          <Dumbbell size={48} className="text-[#FFD000]" />
          <h1 className="text-6xl font-display tracking-wider text-[#F5F5F5]">MaxxGym</h1>
        </div>
        
        <p className="text-xl text-[#888888] mb-12 max-w-md">Train Smarter. Track Everything. The premium platform for trainers and clients.</p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <Link 
            to="/trainer/auth" 
            className="flex-1 bg-[#FFD000] text-[#0B0B0B] font-bold uppercase tracking-wide py-4 px-8 rounded-lg hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,208,0,0.3)] transition-all text-center"
          >
            I'm a Trainer
          </Link>
          
          <Link 
            to="/client/auth" 
            className="flex-1 bg-[#1E1E1E] border border-[#2A2A2A] text-[#F5F5F5] font-bold uppercase tracking-wide py-4 px-8 rounded-lg hover:-translate-y-1 hover:border-[#FFD000] hover:text-[#FFD000] transition-all text-center"
          >
            I'm a Client
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
