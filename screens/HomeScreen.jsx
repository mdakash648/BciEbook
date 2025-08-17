import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { listBooks } from '../services/bookService';

const MOCK_BOOKS = [];

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);

  const loadInitialBooks = async () => {
    try {
      setLoading(true);
      setBooks([]);
      setCurrentOffset(0);
      setHasMore(true);
      
      let result;
      try {
        result = await listBooks(6, 0); // Load initial 6 books
        console.log('Initial books loaded:', result);
      } catch (paginationError) {
        console.log('Pagination failed, trying without limit:', paginationError);
        // Fallback to old method if pagination fails
        result = await listBooks();
        console.log('Fallback books loaded:', result);
      }
      
      const refreshKey = Date.now();
      setImageRefreshKey(refreshKey);
      
      // Handle both new format (with documents/total) and old format (array)
      const documents = Array.isArray(result) ? result : (result.documents || []);
      const total = Array.isArray(result) ? result.length : (result.total || 0);
      
      const formattedBooks = documents.map((d) => ({
        id: d.$id,
        title: d.title,
        author: d.author,
        cover: d.coverFileId ? `${d.coverFileId}${d.coverFileId.includes('?') ? '&' : '?'}refresh=${refreshKey}` : d.coverFileId,
        category: d.category,
        edition: d.edition,
        pages: d.pages,
        language: d.language,
        publisher: d.publisher,
        country: d.country,
        pdfUrl: d.pdfFileId,
        raw: d,
      }));
      
      console.log('Formatted books:', formattedBooks.length);
      
      setBooks(formattedBooks);
      setTotalBooks(total);
      
      if (Array.isArray(result)) {
        // Old format - disable pagination
        setCurrentOffset(formattedBooks.length);
        setHasMore(false);
      } else {
        // New format - enable pagination
        setCurrentOffset(6);
        setHasMore(documents.length === 6 && total > 6);
      }
      
    } catch (error) {
      console.log('Error loading books:', error);
      setBooks([]);
      setTotalBooks(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreBooks = async () => {
    if (loadingMore || !hasMore) return;
    
    console.log(`🔄 AJAX Loading: Fetching next 4 books (offset: ${currentOffset})`);
    
    try {
      setLoadingMore(true);
      const result = await listBooks(4, currentOffset); // Load next 4 books
      const refreshKey = imageRefreshKey;
      
      const formattedBooks = result.documents.map((d) => ({
        id: d.$id,
        title: d.title,
        author: d.author,
        cover: d.coverFileId ? `${d.coverFileId}${d.coverFileId.includes('?') ? '&' : '?'}refresh=${refreshKey}` : d.coverFileId,
        category: d.category,
        edition: d.edition,
        pages: d.pages,
        language: d.language,
        publisher: d.publisher,
        country: d.country,
        pdfUrl: d.pdfFileId,
        raw: d,
      }));
      
      setBooks(prevBooks => {
        const newBooks = [...prevBooks, ...formattedBooks];
        console.log(`✅ AJAX Success: Added ${formattedBooks.length} books. Total: ${newBooks.length}`);
        return newBooks;
      });
      setCurrentOffset(prev => prev + 4);
      setHasMore(result.documents.length === 4 && currentOffset + 4 < result.total);
      
    } catch (error) {
      console.log('Error loading more books:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadInitialBooks();
    }, [])
  );

  const filtered = useMemo(() => {
    const src = books.length ? books : MOCK_BOOKS;
    if (!query.trim()) return src;
    const q = query.toLowerCase();
    return src.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [query, books]);

  const renderBook = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('BookDetails', { book: item })}
    >
      <View style={styles.coverWrap}>
        <Image 
          source={{ uri: item.cover }} 
          style={styles.cover}
          key={`${item.id}-${imageRefreshKey}`} // Force re-render with refresh key
        />
      </View>
      <Text numberOfLines={2} style={styles.bookTitle}>{item.title}</Text>
      <Text numberOfLines={1} style={styles.bookAuthor}>{item.author}</Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!query.trim() && hasMore && !loading) {
      return (
        <View style={styles.loadingFooter}>
          {loadingMore ? (
            <>
              <Text style={styles.loadingText}>Loading next 4 books...</Text>
              <View style={styles.loadingDots}>
                <Text style={styles.loadingDot}>•</Text>
                <Text style={styles.loadingDot}>•</Text>
                <Text style={styles.loadingDot}>•</Text>
              </View>
            </>
          ) : (
            <Text style={styles.scrollHint}>Scroll down to load more books</Text>
          )}
        </View>
      );
    }
    
    if (!query.trim() && !hasMore && books.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <Text style={styles.endText}>✨ All books loaded!</Text>
        </View>
      );
    }
    
    return null;
  };

  const handleEndReached = () => {
    // Only load more if not searching (for search, we show all filtered results)
    if (!query.trim() && hasMore && !loadingMore && !loading) {
      loadMoreBooks();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}> 
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.filterChip}
          activeOpacity={0.8}
          onPress={() => setFilterOpen((v) => !v)}
        >
          <Text style={styles.filterText}>Filter</Text>
          <Icon name={filterOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color="#6C757D" />
        <TextInput
          placeholder="Search for books"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {/* Book Count Section */}
      <View style={styles.bookCountSection}>
        <View style={styles.bookCountContainer}>
          <Icon name="library-outline" size={20} color="#4A90E2" />
          <Text style={styles.bookCountText}>
            {loading ? 'Loading...' : `${filtered.length} book${filtered.length !== 1 ? 's' : ''} ${query.trim() ? 'found' : 'available'}`}
          </Text>
        </View>
        {query.trim() && (
          <Text style={styles.totalBooksText}>
            Total: {totalBooks} book{totalBooks !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Grid */}
      <FlatList
        contentContainerStyle={styles.grid}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        renderItem={renderBook}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  toolbar: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  filterChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 16,
  },
  filterText: {
    color: '#4A4A4A',
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212529',
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  coverWrap: {
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E9ECEF',
    marginBottom: 10,
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  bookAuthor: {
    marginTop: 2,
    fontSize: 12,
    color: '#6C757D',
  },
  bookCountSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  bookCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  totalBooksText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
    marginLeft: 28,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingDot: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  scrollHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  endText: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
  },
});
