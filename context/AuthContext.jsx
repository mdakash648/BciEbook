import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { ID } from 'appwrite';
import { account } from '../lib/appwrite';
import RNFS from 'react-native-fs';
import { saveUserToDatabase, syncUserRoleFromLabels, checkAndSyncUserRole } from '../services/userService';

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
      
      // Check and sync user role from labels on every user check
      const labels = Array.isArray(currentUser?.labels) ? currentUser.labels : [];
      const syncResult = await checkAndSyncUserRole(currentUser.$id, labels, currentUser.email);
      
      if (syncResult.success && syncResult.roleChanged) {
        console.log('Role synced during user check:', syncResult.message);
        // If role changed, we need to re-fetch the user data to get updated role
        const updatedUser = await account.get();
        setUser(mapAppwriteUser(updatedUser));
      } else {
        setUser(mapAppwriteUser(currentUser));
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLogoCache = async () => {
    try {
      const p = `${RNFS.CachesDirectoryPath}/app_logo_preview.jpg`;
      const exists = await RNFS.exists(p);
      if (exists) await RNFS.unlink(p);
    } catch (_) {}
  };

  const logout = useCallback(async () => {
    try {
      try {
        await account.deleteSession('current');
      } catch (e) {
        // ignore if already guest/no active session
      }
    } finally {
      setUser(null);
      // Bust cached logo so it refreshes after logout
      clearLogoCache();
      // Optional global cache-bust seed that consumers can use
      globalThis.__APP_LOGO_CB__ = Date.now();
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
      // Step 1: Create user account in Appwrite Auth
      await account.create(ID.unique(), email, password, name);
      
      // Step 2: Create session and get user data
      try {
        await account.deleteSession('current');
      } catch (e) {}
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      
      // Step 3: Extract user role from labels
      const labels = Array.isArray(currentUser?.labels) ? currentUser.labels : [];
      const role = labels.includes('admin') ? 'admin' : 'user';
      
      // Step 4: Save user data to database
      const saveResult = await saveUserToDatabase(
        name, // FullName from registration form
        email, // EmailAddress from registration form
        currentUser.$id, // authUserId from Appwrite Auth
        role // role from Appwrite Auth labels
      );
      
      if (!saveResult.success) {
        // If database save fails, we should handle this gracefully
        // The user is already created in Auth, so we don't want to fail completely
        console.warn('Failed to save user to database:', saveResult.error);
        // You might want to implement a retry mechanism here
      }
      
      // Step 5: Map and set user data
      const mapped = mapAppwriteUser(currentUser);
      setUser(mapped);
      
      return { 
        success: true, 
        user: mapped,
        databaseSaved: saveResult.success,
        databaseError: saveResult.error
      };
    } catch (error) {
      return { success: false, error: error?.message || 'Registration failed' };
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const syncUserRole = useCallback(async () => {
    try {
      const currentUser = await account.get();
      const labels = Array.isArray(currentUser?.labels) ? currentUser.labels : [];
      
      const syncResult = await syncUserRoleFromLabels(
        currentUser.$id, 
        labels, 
        currentUser.email // Pass email for fallback lookup
      );
      
      if (syncResult.success && syncResult.roleChanged) {
        // Re-fetch user data to get updated role
        const updatedUser = await account.get();
        setUser(mapAppwriteUser(updatedUser));
        return {
          success: true,
          roleChanged: true,
          message: syncResult.message
        };
      } else {
        return {
          success: true,
          roleChanged: false,
          message: syncResult.message
        };
      }
    } catch (error) {
      console.error('Error syncing user role:', error);
      return {
        success: false,
        error: error?.message || 'Failed to sync user role'
      };
    }
  }, []);

  const value = useMemo(() => ({ 
    user, 
    loading, 
    checkUser, 
    logout, 
    login, 
    register, 
    syncUserRole 
  }), [user, loading, checkUser, logout, login, register, syncUserRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


