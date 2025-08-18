# User Database Integration System

This document explains the implementation of the user database integration system that saves user data to Appwrite database after successful registration.

## Overview

The system automatically saves user data to the `users` collection in Appwrite database after successful registration, linking the database document to the Appwrite Auth user via `authUserId`.

## Database Schema

**Collection ID:** `users`  
**Database ID:** `68a0e8730015131520a3`

### Attributes:
- `FullName` (string) - User's full name from registration form
- `EmailAddress` (string) - User's email address from registration form  
- `PhoneNuber` (string) - Phone number (updated later via account form)
- `Address` (string) - Address (updated later via account form)
- `role` (string) - User role from Appwrite Auth labels
- `createdAt` (datetime) - Registration timestamp
- `authUserId` (string) - Appwrite Auth user ID (links to Auth user)

## Implementation Files

### 1. `services/userService.js`
Contains database operations for user data:
- `saveUserToDatabase()` - Saves user data after registration
- `getUserFromDatabase()` - Retrieves user data by authUserId
- `updateUserInDatabase()` - Updates user data in database
- `signupAndSave()` - Combined registration and database save

### 2. `services/authService.js`
Contains the main `signupAndSave()` function that handles the complete registration flow.

### 3. `context/AuthContext.jsx`
Updated to automatically save user data to database after successful registration.

## Usage Examples

### Basic Registration with Database Save

```javascript
import { signupAndSave } from '../services/authService';

const handleRegistration = async () => {
  const result = await signupAndSave(fullName, email, password);
  
  if (result.success) {
    console.log('User registered successfully');
    console.log('Database saved:', result.databaseSaved);
    console.log('User data:', result.user);
  } else {
    console.error('Registration failed:', result.error);
  }
};
```

### Using the Updated AuthContext

The existing `register()` function in AuthContext now automatically saves to database:

```javascript
import { useAuth } from '../hooks/useAuth';

const { register } = useAuth();

const handleRegister = async () => {
  const result = await register(email, password, fullName);
  
  if (result.success) {
    console.log('Registration successful');
    console.log('Database saved:', result.databaseSaved);
    if (result.databaseError) {
      console.warn('Database save warning:', result.databaseError);
    }
  }
};
```

### Getting User Data from Database

```javascript
import { getUserFromDatabase } from '../services/userService';

const getUserData = async (authUserId) => {
  const result = await getUserFromDatabase(authUserId);
  
  if (result.success) {
    console.log('User data:', result.user);
  } else {
    console.error('Failed to get user data:', result.error);
  }
};
```

### Updating User Data

```javascript
import { updateUserInDatabase } from '../services/userService';

const updateUser = async (documentId, updateData) => {
  const result = await updateUserInDatabase(documentId, {
    PhoneNuber: '+1234567890',
    Address: '123 Main St, City, Country'
  });
  
  if (result.success) {
    console.log('User updated successfully');
  } else {
    console.error('Update failed:', result.error);
  }
};
```

## Error Handling

The system includes comprehensive error handling:

1. **Graceful Database Failures**: If database save fails after successful Auth registration, the user is still registered but a warning is logged.

2. **Retry Mechanisms**: You can implement retry logic for failed database saves.

3. **Detailed Error Messages**: Each function returns detailed error information.

## Permissions

Make sure your `users` collection has the following permissions:
- **Users role**: Create, Read, Update, Delete = true

## Configuration

Update your `constants/Config.js` to include:

```javascript
export const CONFIG = {
  // ... existing config
  APPWRITE_USERS_COLLECTION_ID: 'users',
  // ... rest of config
};
```

## Key Features

1. **Automatic Database Save**: User data is automatically saved after registration
2. **Auth-Database Linking**: Uses `authUserId` to link Auth users with database documents
3. **Role Management**: Automatically extracts user role from Appwrite Auth labels
4. **Error Resilience**: Handles database failures gracefully
5. **Clean API**: Provides simple, well-documented functions
6. **Async/Await**: Uses modern JavaScript patterns with proper error handling

## Testing

To test the system:

1. Register a new user through your existing registration form
2. Check the Appwrite console to verify the user document was created in the `users` collection
3. Verify the `authUserId` field matches the Auth user ID
4. Test updating user data through the account update form

## Notes

- The system maintains backward compatibility with your existing authentication system
- Database save failures don't prevent user registration (graceful degradation)
- All functions include detailed inline comments for maintainability
- The implementation follows React Native and Appwrite best practices
