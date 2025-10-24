import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { db } from '@/utils/firebaseConfig';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter()

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

      // পাসওয়ার্ড চেক করুন
      if (userData.role !== 'admin') {
        throw new Error('INVALID_ROLE');
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
        errorMessage = 'User not Found!';
      } else if (error.message === 'INVALID_PASSWORD') {
        errorMessage = 'Wrong Password!';
      } else if (error.message === 'INVALID_ROLE') {
        errorMessage = 'Only Admin Can Log In!';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = (updatedUser) => {
    // সঠিকভাবে state আপডেট করুন
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/')
  };

  return {
    user,
    login,
    updateUserData,
    logout,
    loading
  };
}