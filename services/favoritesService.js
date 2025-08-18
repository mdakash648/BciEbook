import { ID } from 'appwrite';
import { databases, account } from '../lib/appwrite';
import { Query } from 'appwrite';
import { CONFIG } from '../constants/Config';

// Database configuration
const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
const FAVORITES_COLLECTION_ID = CONFIG.APPWRITE_FAVORITES_COLLECTION_ID;

/**
 * Add a book to user's favorites
 * @param {string} bookId - The book document ID
 * @param {string} bookTitle - The book title
 * @param {string} bookAuthor - The book author
 * @returns {Promise<Object>} - Success/error result
 */
export const addToFavorites = async (bookId, bookTitle, bookAuthor) => {
  try {
    // Validate required parameters
    if (!bookId || !bookTitle || !bookAuthor) {
      return {
        success: false,
        error: 'Missing required book information (ID, title, or author)'
      };
    }

    // Get current user
    const currentUser = await account.get();
    const userId = currentUser.$id;

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Check if book is already in favorites
    const existingFavorite = await databases.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('bookId', bookId)
      ]
    );

    if (existingFavorite.documents.length > 0) {
      return {
        success: false,
        error: 'Book is already in your favorites'
      };
    }

    // Add book to favorites
    const favoriteDocument = await databases.createDocument(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      ID.unique(),
      {
        userId: userId,
        bookId: bookId,
        bookTitle: bookTitle,
        bookAuthor: bookAuthor,
        addedAt: new Date().toISOString()
      }
    );

    return {
      success: true,
      favoriteDocument: favoriteDocument,
      message: 'Book added to favorites successfully'
    };
  } catch (error) {
    console.error('Error adding book to favorites:', error);
    return {
      success: false,
      error: error?.message || 'Failed to add book to favorites'
    };
  }
};

/**
 * Remove a book from user's favorites
 * @param {string} bookId - The book document ID
 * @returns {Promise<Object>} - Success/error result
 */
export const removeFromFavorites = async (bookId) => {
  try {
    // Validate required parameters
    if (!bookId) {
      return {
        success: false,
        error: 'Book ID is required'
      };
    }

    // Get current user
    const currentUser = await account.get();
    const userId = currentUser.$id;

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Find the favorite document
    const existingFavorites = await databases.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('bookId', bookId)
      ]
    );

    if (existingFavorites.documents.length === 0) {
      return {
        success: false,
        error: 'Book is not in your favorites'
      };
    }

    // Remove the favorite
    await databases.deleteDocument(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      existingFavorites.documents[0].$id
    );

    return {
      success: true,
      message: 'Book removed from favorites successfully'
    };
  } catch (error) {
    console.error('Error removing book from favorites:', error);
    return {
      success: false,
      error: error?.message || 'Failed to remove book from favorites'
    };
  }
};

/**
 * Get all favorite books for the current user
 * @returns {Promise<Object>} - List of favorite books or error
 */
export const getUserFavorites = async () => {
  try {
    // Get current user
    const currentUser = await account.get();
    const userId = currentUser.$id;

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
        favorites: [],
        total: 0
      };
    }

    // Get user's favorites
    const favorites = await databases.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('addedAt')
      ]
    );

    return {
      success: true,
      favorites: favorites.documents || [],
      total: favorites.total || 0
    };
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get favorites',
      favorites: [],
      total: 0
    };
  }
};

/**
 * Check if a book is in user's favorites
 * @param {string} bookId - The book document ID
 * @returns {Promise<Object>} - Boolean result indicating if book is favorited
 */
export const isBookFavorited = async (bookId) => {
  try {
    // Validate required parameters
    if (!bookId) {
      return {
        success: false,
        error: 'Book ID is required',
        isFavorited: false
      };
    }

    // Get current user
    const currentUser = await account.get();
    const userId = currentUser.$id;

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
        isFavorited: false
      };
    }

    // Check if book is in favorites
    const existingFavorites = await databases.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('bookId', bookId)
      ]
    );

    return {
      success: true,
      isFavorited: existingFavorites.documents.length > 0,
      favoriteId: existingFavorites.documents[0]?.$id || null
    };
  } catch (error) {
    console.error('Error checking if book is favorited:', error);
    return {
      success: false,
      error: error?.message || 'Failed to check favorite status',
      isFavorited: false
    };
  }
};

/**
 * Get favorite count for a specific book
 * @param {string} bookId - The book document ID
 * @returns {Promise<Object>} - Count of users who favorited this book
 */
export const getBookFavoriteCount = async (bookId) => {
  try {
    // Validate required parameters
    if (!bookId) {
      return {
        success: false,
        error: 'Book ID is required',
        count: 0
      };
    }

    const favorites = await databases.listDocuments(
      DATABASE_ID,
      FAVORITES_COLLECTION_ID,
      [
        Query.equal('bookId', bookId)
      ]
    );

    return {
      success: true,
      count: favorites.total || 0
    };
  } catch (error) {
    console.error('Error getting book favorite count:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get favorite count',
      count: 0
    };
  }
};
