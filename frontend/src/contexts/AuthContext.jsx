import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      setUserRole(null);
      setUserData(null);
      return;
    }
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserRole(data.role);
        setUserData(data);
      } else {
        console.warn("No Firestore doc found for user:", user.uid);
        setUserRole(null);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
      setUserData(null);
    }
  }, []);

  // Public method: re-read the Firestore doc for the current user
  // Call this after creating/updating the user's Firestore doc
  const refreshUser = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      setLoading(true);
      await fetchUserData(user);
      setCurrentUser(user);
      setLoading(false);
    }
  }, [fetchUserData]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserRole(null);
        setUserData(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserData]);

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    refreshUser,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
