import { useState, useEffect } from 'react';
import { account } from '../lib/appwrite';
import { ID } from 'appwrite';

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

  const login = async (email, password) => {
    try {
      // First, try to delete any existing session
      try {
        await account.deleteSession('current');
      } catch (deleteError) {
        // Ignore errors if no session exists
        console.log('No existing session to delete');
      }
      
      // Create new session
      await account.createEmailPasswordSession(email, password);
      await checkUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error?.message || 'Login failed' };
    }
  };

  const register = async (email, password, name) => {
    try {
      await account.create(ID.unique(), email, password, name);
      
      // Delete any existing session before creating new one
      try {
        await account.deleteSession('current');
      } catch (deleteError) {
        // Ignore errors if no session exists
        console.log('No existing session to delete');
      }
      
      await account.createEmailPasswordSession(email, password);
      await checkUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error?.message || 'Registration failed' };
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  return { user, loading, checkUser, logout, login, register };
};
