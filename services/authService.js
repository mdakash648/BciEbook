import { ID } from 'appwrite';
import { account } from '../lib/appwrite';
import { saveUserToDatabase } from './userService';

/**
 * Complete signup process with database save
 * This function handles the entire registration flow:
 * 1. Creates user account in Appwrite Auth
 * 2. Creates session
 * 3. Saves user data to database
 * 4. Returns user data
 * 
 * @param {string} fullName - User's full name from registration form
 * @param {string} email - User's email address from registration form
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Success/error result with user data
 */
export const signupAndSave = async (fullName, email, password) => {
  try {
    // Step 1: Create user account in Appwrite Auth
    await account.create(ID.unique(), email, password, fullName);
    
    // Step 2: Create session and get user data
    try {
      await account.deleteSession('current');
    } catch (e) {
      // Ignore if no current session exists
    }
    
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    
    // Step 3: Extract user role from Appwrite Auth labels
    const labels = Array.isArray(currentUser?.labels) ? currentUser.labels : [];
    const role = labels.includes('admin') ? 'admin' : 'user';
    
    // Step 4: Save user data to database
    const saveResult = await saveUserToDatabase(
      fullName, // FullName from registration form
      email, // EmailAddress from registration form
      currentUser.$id, // authUserId from Appwrite Auth
      role // role from Appwrite Auth labels
    );
    
    if (!saveResult.success) {
      // If database save fails, log the error but don't fail the entire registration
      // The user is already created in Auth, so we want to handle this gracefully
      console.warn('Failed to save user to database:', saveResult.error);
      
      return {
        success: true, // Auth registration was successful
        user: {
          id: currentUser.$id,
          name: currentUser.name,
          email: currentUser.email,
          role: role,
          verified: !!currentUser.emailVerification,
        },
        databaseSaved: false,
        databaseError: saveResult.error,
        message: 'User registered successfully but database save failed'
      };
    }
    
    // Step 5: Return success with user data
    return {
      success: true,
      user: {
        id: currentUser.$id,
        name: currentUser.name,
        email: currentUser.email,
        role: role,
        verified: !!currentUser.emailVerification,
      },
      databaseSaved: true,
      userDocument: saveResult.userDocument,
      message: 'User registered and saved to database successfully'
    };
    
  } catch (error) {
    console.error('Error in signupAndSave:', error);
    return {
      success: false,
      error: error?.message || 'Registration failed',
      step: 'signup_and_save'
    };
  }
};

/**
 * Get current authenticated user with database data
 * @returns {Promise<Object>} - User data from both Auth and Database
 */
export const getCurrentUserWithDatabaseData = async () => {
  try {
    // Get current user from Appwrite Auth
    const currentUser = await account.get();
    
    // Get user data from database
    const { getUserFromDatabase } = await import('./userService');
    const dbResult = await getUserFromDatabase(currentUser.$id);
    
    return {
      success: true,
      authUser: currentUser,
      databaseUser: dbResult.success ? dbResult.user : null,
      databaseError: dbResult.success ? null : dbResult.error
    };
  } catch (error) {
    console.error('Error getting current user with database data:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get user data'
    };
  }
};
