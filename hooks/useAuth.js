import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { db } from '@/utils/firebaseConfig';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // শুরুতে true রাখুন

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // users collection থেকে ইউজার খুঁজে বের করুন
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('USER_NOT_FOUND');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // পাসওয়ার্ড চেক করুন
      if (userData.password !== password) {
        throw new Error('INVALID_PASSWORD');
      }

      // লগইন সফল - ইউজার তথ্য স্টোর করুন
      const userInfo = {
        id: userDoc.id,
        name: userData.name,
        username: userData.username,
        current_period: userData.current_period,
        periods: userData.periods,
        role: userData.role || 'Admin',
        section: userData.section || 'admin'
      };

      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      return { success: true, user: userInfo };
    } catch (error) {
      let errorMessage = 'লগইন ব্যর্থ হয়েছে';
      
      if (error.message === 'USER_NOT_FOUND') {
        errorMessage = 'ইউজারনেমটি存在しない';
      } else if (error.message === 'INVALID_PASSWORD') {
        errorMessage = 'পাসওয়ার্ড ভুল হয়েছে';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return {
    user,
    login,
    logout,
    loading
  };
}