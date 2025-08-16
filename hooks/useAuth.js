import { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser({
        id: currentUser.$id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        role: 'user', // You can set this based on your app logic
        address: currentUser.prefs?.address || '',
      });
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  return { user, loading, checkUser, logout };
};
