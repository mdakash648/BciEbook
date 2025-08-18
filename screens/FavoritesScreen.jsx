import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserFavorites, removeFromFavorites } from '../services/favoritesService';

export default function FavoritesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Load user's favorite books
  const loadFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const result = await getUserFavorites();
      if (result.success) {
        setFavorites(result.favorites);
      } else {
        console.error('Error loading favorites:', result.error);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load favorites when component mounts or user changes
  useEffect(() => {
    loadFavorites();
  }, [user]);

  // Refresh favorites
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  // Remove book from favorites
  const removeFavorite = async (favoriteId, bookId, bookTitle) => {
    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove "${bookTitle}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(favoriteId);
            try {
              const result = await removeFromFavorites(bookId);
              if (result.success) {
                // Remove from local state
                setFavorites(prev => prev.filter(fav => fav.$id !== favoriteId));
                Alert.alert('Success', 'Book removed from favorites');
              } else {
                Alert.alert('Error', result.error || 'Failed to remove from favorites');
              }
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setRemovingId(null);
            }
          }
        }
      ]
    );
  };

  // Navigate to book details
  const openBookDetails = (favorite) => {
    // Create a book object from favorite data
    const book = {
      id: favorite.bookId, // Use 'id' to match HomeScreen format
      title: favorite.bookTitle,
      author: favorite.bookAuthor,
      // Add other book properties as needed
    };
    
    navigation.navigate('BookDetails', { book });
  };

  // Show login prompt if user is not logged in
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Icon name="heart-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.title, { color: theme.text }]}>BCI E-LIBRARY Favorites</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Please login to view your favorite books</Text>
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: theme.primary }]} 
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Icon name="heart-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.title, { color: theme.text }]}>BCI E-LIBRARY Favorites</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Loading your favorite books...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>BCI E-LIBRARY Favorites</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {favorites.length} {favorites.length === 1 ? 'book' : 'books'} in your collection
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.center}>
          <Icon name="heart-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.title, { color: theme.text }]}>No Favorite Books Yet</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start exploring books and add them to your favorites to see them here
          </Text>
          <TouchableOpacity 
            style={[styles.browseBtn, { backgroundColor: theme.primary }]} 
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseBtnText}>Browse Books</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {favorites.map((favorite) => (
            <TouchableOpacity
              key={favorite.$id}
              style={[styles.favoriteCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
              onPress={() => openBookDetails(favorite)}
              activeOpacity={0.7}
            >
              <View style={styles.favoriteContent}>
                <View style={styles.bookInfo}>
                  <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                    {favorite.bookTitle}
                  </Text>
                  <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                    by {favorite.bookAuthor}
                  </Text>
                  <Text style={[styles.addedDate, { color: theme.textMuted }]}>
                    Added {new Date(favorite.addedAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.favoriteActions}>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFavorite(favorite.$id, favorite.bookId, favorite.bookTitle)}
                    disabled={removingId === favorite.$id}
                  >
                    <Icon 
                      name={removingId === favorite.$id ? "hourglass-outline" : "trash-outline"} 
                      size={20} 
                      color="#FF6B6B" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  browseBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  favoriteActions: {
    alignItems: 'center',
  },
  removeBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
  },
});
