import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ClientAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [trainerCode, setTrainerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { currentUser, userRole, loading: authLoading, refreshUser, signInWithGoogle } = useAuth();

  // If already fully authenticated, redirect immediately
  if (!authLoading && currentUser && userRole === 'client') {
    navigate('/client/dashboard', { replace: true });
  } else if (!authLoading && currentUser && userRole === 'trainer') {
    navigate('/trainer/dashboard', { replace: true });
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const user = await signInWithGoogle();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // If new user via Google, register as client
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName || user.email.split('@')[0],
          email: user.email,
          role: 'client',
          trainerId: '',
          createdAt: new Date().toISOString()
        });
      }
      
      const updatedDoc = await getDoc(doc(db, 'users', user.uid));
      const role = updatedDoc.data()?.role || 'client';
      
      await refreshUser();
      toast.success('Signed in with Google!');
      
      if (role === 'trainer') {
        navigate('/trainer/dashboard', { replace: true });
      } else {
        navigate('/client/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName || email.split('@')[0],
            email: user.email,
            role: 'client',
            trainerId: '',
            createdAt: new Date().toISOString()
          });
        }

        await refreshUser();
        const role = (userDoc.exists() ? userDoc.data().role : 'client');
        toast.success('Welcome back!');

        if (role === 'client') {
          navigate('/client/dashboard', { replace: true });
        } else if (role === 'trainer') {
          navigate('/trainer/dashboard', { replace: true });
        }
      } else {
        // 1. Create the user first (so they are authenticated for the next step)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Now that we are authenticated, look up the trainer
        const trainersQuery = query(
          collection(db, 'users'),
          where('trainerId', '==', trainerCode.toLowerCase().replace(/\s+/g, ''))
        );
        const trainersSnap = await getDocs(trainersQuery);
        const trainerDoc = trainersSnap.docs.find(d => d.data().role === 'trainer');
        
        let actualTrainerUid = trainerCode; 
        if (trainerDoc) {
          actualTrainerUid = trainerDoc.id;
        } else {
          // If trainer not found, we still create the user but warn them
          toast.error('Trainer not found. You can link to your trainer later in your profile.');
          actualTrainerUid = null;
        }

        // 3. Create the user document
        await setDoc(doc(db, 'users', user.uid), {
          displayName: name,
          email: user.email,
          role: 'client',
          trainerId: actualTrainerUid,
          createdAt: new Date().toISOString()
        });

        await signOut(auth);
        toast.success('Account created! Please sign in.');
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setName('');
        setTrainerCode('');
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'This email is already in use.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
        <div className="w-10 h-10 border-4 border-[#FFD000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0B0B0B]">
      {/* Desktop Branding Panel — matches Trainer layout */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#141414] border-r border-[#2A2A2A] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FFD000 0, #FFD000 1px, transparent 0, transparent 50%)', backgroundSize: '30px 30px' }}></div>
        <Dumbbell size={80} className="text-[#FFD000] mb-6 relative z-10" />
        <h2 className="text-6xl font-display text-[#F5F5F5] mb-4 relative z-10">Client Portal</h2>
        <p className="text-xl text-[#888888] text-center max-w-md relative z-10">View your workout plan, track your progress, and stay connected with your trainer.</p>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-[#141414] w-full max-w-md p-8 rounded-xl border border-[#2A2A2A] shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <Dumbbell size={32} className="text-[#FFD000]" />
            <h1 className="text-4xl font-display text-[#F5F5F5]">MaxxGym</h1>
          </div>
          
          <h3 className="text-2xl font-bold mb-6 text-center text-[#F5F5F5]">
            {isLogin ? 'Client Login' : 'Join Your Trainer'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm text-[#888888] mb-1">Full Name</label>
                  <input type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded p-3 text-[#F5F5F5] focus:outline-none focus:border-[#FFD000] transition-colors"
                    placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-1">Trainer Code</label>
                  <input type="text" required value={trainerCode}
                    onChange={(e) => setTrainerCode(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded p-3 text-[#F5F5F5] focus:outline-none focus:border-[#FFD000] transition-colors"
                    placeholder="Ask your trainer for this" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-[#888888] mb-1">Email</label>
              <input type="email" name="email" required value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded p-3 text-[#F5F5F5] focus:outline-none focus:border-[#FFD000] transition-colors"
                placeholder="client@example.com" />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-1">Password</label>
              <input type="password" name="password" required value={password}
                autoComplete={isLogin ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded p-3 text-[#F5F5F5] focus:outline-none focus:border-[#FFD000] transition-colors"
                placeholder="••••••••" />
            </div>

            {isLogin && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-[#1E1E1E] border-[#2A2A2A] rounded text-[#FFD000] focus:ring-[#FFD000]"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-[#888888] cursor-pointer hover:text-[#F5F5F5] transition-colors">
                  Keep me signed in
                </label>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#FFD000] text-[#0B0B0B] font-bold uppercase tracking-wider py-3 rounded mt-6 hover:bg-[#C9A200] transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t border-[#2A2A2A] w-full"></div>
              <span className="bg-[#141414] px-3 text-[#888888] text-xs uppercase tracking-widest absolute">Or</span>
            </div>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
          </div>

          <div className="mt-6 text-center text-[#888888]">
            {isLogin ? "New here? " : "Already signed up? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[#FFD000] hover:underline">
              {isLogin ? 'Create Account' : 'Login'}
            </button>
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-[#888888] hover:text-[#F5F5F5]">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAuth;
