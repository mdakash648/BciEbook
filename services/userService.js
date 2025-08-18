import { ID } from 'appwrite';
import { databases } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';

// Database configuration
const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = CONFIG.APPWRITE_USERS_COLLECTION_ID;

/**
 * Save user data to the database after successful registration
 * @param {string} fullName - User's full name from registration form
 * @param {string} emailAddress - User's email address from registration form
 * @param {string} authUserId - User's Appwrite Auth ID
 * @param {string} role - User's role from Appwrite Auth labels
 * @returns {Promise<Object>} - Success/error result
 */
export const saveUserToDatabase = async (fullName, emailAddress, authUserId, role) => {
  try {
    // Create user document in the database
    const userDocument = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(), // Generate unique document ID
      {
        FullName: fullName,
        EmailAddress: emailAddress,
        PhoneNuber: '', // Will be updated later via update account form
        Address: '', // Will be updated later via update account form
        role: role || 'user', // Default to 'user' if no role found
        createdAt: new Date().toISOString(),
        authUserId: authUserId // Link to Appwrite Auth user
      }
    );

    return {
      success: true,
      userDocument: userDocument,
      message: 'User data saved successfully'
    };
  } catch (error) {
    console.error('Error saving user to database:', error);
    return {
      success: false,
      error: error?.message || 'Failed to save user data to database'
    };
  }
};

/**
 * Get user data from database by auth user ID
 * @param {string} authUserId - User's Appwrite Auth ID
 * @returns {Promise<Object>} - User document or error
 */
export const getUserFromDatabase = async (authUserId) => {
  try {
    console.log('🔍 Looking for user with authUserId:', authUserId);
    
    // First, let's get all documents to see what we have
    const allResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );
    
    console.log('📋 All documents in users collection:', allResponse.documents);
    
    // Try to find user by authUserId
    const userDoc = allResponse.documents.find(doc => doc.authUserId === authUserId);
    
    if (userDoc) {
      console.log('✅ Found user by authUserId:', userDoc);
      return {
        success: true,
        user: userDoc
      };
    } else {
      console.log('❌ User not found by authUserId');
      return {
        success: false,
        error: 'User not found in database by authUserId'
      };
    }
  } catch (error) {
    console.error('Error getting user from database:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get user data from database'
    };
  }
};

/**
 * Get user data from database by email address (fallback method)
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - User document or error
 */
export const getUserFromDatabaseByEmail = async (email) => {
  try {
    console.log('🔍 Looking for user with email:', email);
    
    // Get all documents and find by email
    const allResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID
    );
    
    // Try to find user by email
    const userDoc = allResponse.documents.find(doc => doc.EmailAddress === email);
    
    if (userDoc) {
      console.log('✅ Found user by email:', userDoc);
      return {
        success: true,
        user: userDoc
      };
    } else {
      console.log('❌ User not found by email');
      return {
        success: false,
        error: 'User not found in database by email'
      };
    }
  } catch (error) {
    console.error('Error getting user from database by email:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get user data from database'
    };
  }
};

/**
 * Update user data in database
 * @param {string} documentId - Database document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Success/error result
 */
export const updateUserInDatabase = async (documentId, updateData) => {
  try {
    console.log('🔄 Updating user in database...');
    console.log('📄 Document ID:', documentId);
    console.log('📝 Update Data:', updateData);
    
    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      documentId,
      updateData
    );

    console.log('✅ User updated successfully:', updatedDocument);
    return {
      success: true,
      userDocument: updatedDocument,
      message: 'User data updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating user in database:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update user data in database'
    };
  }
};

/**
 * Update user profile data in database by auth user ID
 * This function finds the user document and updates it with new profile data
 * @param {string} authUserId - User's Appwrite Auth ID
 * @param {Object} profileData - Profile data to update (FullName, EmailAddress, PhoneNuber, Address)
 * @returns {Promise<Object>} - Success/error result
 */
export const updateUserProfileInDatabase = async (authUserId, profileData) => {
  try {
    console.log('🔄 Starting profile update in database...');
    console.log('📝 Auth User ID:', authUserId);
    console.log('📝 Profile Data:', profileData);
    
    // First, find the user document by authUserId
    const userResult = await getUserFromDatabase(authUserId);
    
    if (!userResult.success) {
      console.log('❌ User not found in database for profile update');
      return {
        success: false,
        error: 'User not found in database. Please ensure user is registered.',
        step: 'get_user'
      };
    }
    
    const currentUser = userResult.user;
    console.log('✅ Found user document:', currentUser);
    
    // Prepare update data with only the fields that need to be updated
    const updateData = {};
    
    if (profileData.FullName !== undefined) {
      updateData.FullName = profileData.FullName;
    }
    if (profileData.EmailAddress !== undefined) {
      updateData.EmailAddress = profileData.EmailAddress;
    }
    if (profileData.PhoneNuber !== undefined) {
      updateData.PhoneNuber = profileData.PhoneNuber;
    }
    if (profileData.Address !== undefined) {
      updateData.Address = profileData.Address;
    }
    
    console.log('📝 Final update data:', updateData);
    
    // Update the existing document
    const updateResult = await updateUserInDatabase(currentUser.$id, updateData);
    
    if (!updateResult.success) {
      console.log('❌ Failed to update profile in database:', updateResult.error);
      return updateResult;
    }
    
    console.log('✅ Profile updated successfully in database');
    return {
      success: true,
      userDocument: updateResult.userDocument,
      message: 'Profile updated successfully in database'
    };
    
  } catch (error) {
    console.error('❌ Error updating user profile in database:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update user profile in database',
      step: 'update_profile'
    };
  }
};

/**
 * Combined function to register user and save to database
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} authUserId - User's Appwrite Auth ID
 * @param {string} role - User's role from labels
 * @returns {Promise<Object>} - Success/error result
 */
export const signupAndSave = async (fullName, email, password, authUserId, role) => {
  try {
    // Save user data to database
    const saveResult = await saveUserToDatabase(fullName, email, authUserId, role);
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        step: 'database_save'
      };
    }

    return {
      success: true,
      userDocument: saveResult.userDocument,
      message: 'User registered and saved to database successfully'
    };
  } catch (error) {
    console.error('Error in signupAndSave:', error);
    return {
      success: false,
      error: error?.message || 'Failed to complete registration process',
      step: 'signup_and_save'
    };
  }
};

/**
 * Sync user role from Appwrite Auth labels to database
 * This function checks the current user's labels and updates the database accordingly
 * @param {string} authUserId - User's Appwrite Auth ID
 * @param {Array} currentLabels - Current labels from Appwrite Auth
 * @param {string} userEmail - User's email address (for fallback lookup)
 * @returns {Promise<Object>} - Success/error result with role update info
 */
export const syncUserRoleFromLabels = async (authUserId, currentLabels, userEmail = null) => {
  try {
    console.log('🔄 Starting role sync process...');
    console.log('📝 Auth User ID:', authUserId);
    console.log('🏷️ Current Labels:', currentLabels);
    console.log('📧 User Email:', userEmail);
    
    // Extract role from labels
    const labels = Array.isArray(currentLabels) ? currentLabels : [];
    const newRole = labels.includes('admin') ? 'admin' : 'user';
    
    console.log('🎯 Determined new role from labels:', newRole);
    
    // Try to get current user data from database by authUserId first
    let userResult = await getUserFromDatabase(authUserId);
    
    // If not found by authUserId, try by email as fallback
    if (!userResult.success && userEmail) {
      console.log('🔄 User not found by authUserId, trying email lookup...');
      userResult = await getUserFromDatabaseByEmail(userEmail);
    }
    
    if (!userResult.success) {
      console.log('❌ User not found in database');
      return {
        success: false,
        error: 'User not found in database. Please ensure user is registered.',
        step: 'get_user'
      };
    }
    
    const currentUser = userResult.user;
    const currentRole = currentUser.role || 'user';
    
    console.log('📊 Current role in database:', currentRole);
    console.log('🎯 New role from labels:', newRole);
    console.log('📄 Full user document:', currentUser);
    
    // Check if role has changed
    if (currentRole === newRole) {
      console.log('✅ Role is already up to date');
      return {
        success: true,
        roleChanged: false,
        currentRole: currentRole,
        newRole: newRole,
        message: 'User role is already up to date'
      };
    }
    
    console.log('🔄 Role needs to be updated. Updating database...');
    
    // Update role in database - only update the role field
    const updateResult = await updateUserInDatabase(currentUser.$id, {
      role: newRole
    });
    
    if (!updateResult.success) {
      console.log('❌ Failed to update role in database:', updateResult.error);
      return {
        success: false,
        error: updateResult.error,
        step: 'update_role'
      };
    }
    
    console.log('✅ Successfully updated role from', currentRole, 'to', newRole);
    console.log('📄 Updated user document:', updateResult.userDocument);
    
    return {
      success: true,
      roleChanged: true,
      currentRole: currentRole,
      newRole: newRole,
      userDocument: updateResult.userDocument,
      message: `User role updated from ${currentRole} to ${newRole}`
    };
    
  } catch (error) {
    console.error('❌ Error syncing user role from labels:', error);
    return {
      success: false,
      error: error?.message || 'Failed to sync user role from labels',
      step: 'sync_role'
    };
  }
};

/**
 * Check and sync user role on app startup
 * This function should be called when the app starts to ensure role is up to date
 * @param {string} authUserId - User's Appwrite Auth ID
 * @param {Array} currentLabels - Current labels from Appwrite Auth
 * @param {string} userEmail - User's email address (for fallback lookup)
 * @returns {Promise<Object>} - Success/error result
 */
export const checkAndSyncUserRole = async (authUserId, currentLabels, userEmail = null) => {
  try {
    const syncResult = await syncUserRoleFromLabels(authUserId, currentLabels, userEmail);
    
    if (syncResult.success && syncResult.roleChanged) {
      console.log('User role updated on startup:', syncResult.message);
    }
    
    return syncResult;
  } catch (error) {
    console.error('Error checking and syncing user role:', error);
    return {
      success: false,
      error: error?.message || 'Failed to check and sync user role',
      step: 'check_and_sync'
    };
  }
};


