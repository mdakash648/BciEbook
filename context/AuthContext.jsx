import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ID } from 'appwrite';
import { account } from '../lib/appwrite';

export const AuthContext = createContext(null);

const mapAppwriteUser = (currentUser) => {
  const labels = Array.isArray(currentUser?.labels) ? currentUser.labels : [];
  const prefsRole = currentUser?.prefs?.role;
  const computedRole = labels.includes('admin') || prefsRole === 'admin' ? 'admin' : 'user';
  return {
    id: currentUser.$id,
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    role: computedRole,
    address: currentUser.prefs?.address || '',
    verified: !!currentUser.emailVerification,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async () => {
    try {
      const currentUser = await account.get();
      setUser(mapAppwriteUser(currentUser));
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      try {
        await account.deleteSession('current');
      } catch (e) {
        // ignore if already guest/no active session
      }
    } finally {
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      try {
        await account.deleteSession('current');
      } catch (e) {}
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      const mapped = mapAppwriteUser(currentUser);
      setUser(mapped);
      return { success: true, user: mapped };
    } catch (error) {
      return { success: false, error: error?.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    try {
      await account.create(ID.unique(), email, password, name);
      try {
        await account.deleteSession('current');
      } catch (e) {}
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      const mapped = mapAppwriteUser(currentUser);
      setUser(mapped);
      return { success: true, user: mapped };
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      if (error?.code === 409 || message.includes('already exists')) {
        return { success: false, error: 'Already user is exist. please login.' };
      }
      return { success: false, error: error?.message || 'Registration failed' };
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const value = useMemo(() => ({ user, loading, checkUser, logout, login, register }), [user, loading, checkUser, logout, login, register]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


