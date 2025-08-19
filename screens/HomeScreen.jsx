import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { listBooks } from '../services/bookService';
import FilterModal from '../components/FilterModal';
import { CONFIG } from '../constants/Config';

const MOCK_BOOKS = [];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({});
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [hasMore, setHasMore] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [logoUri, setLogoUri] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Auto-refresh logo URL with cache busting (same as AuthScreen)
  const headerLogoUri = useMemo(() => {
    const seed = globalThis.__APP_LOGO_CB__ || Date.now();
    return `${CONFIG.APP_LOGO_FALLBACK_URL}${CONFIG.APP_LOGO_FALLBACK_URL.includes('?') ? '&' : '?'}cb=${seed}`;
  }, []);

  // Load app logo (simplified since we use auto-refresh)
  const loadAppLogo = async () => {
    try {
      setLogoLoading(true);
      // Logo URL is now handled by useMemo with cache busting
      setLogoUri(headerLogoUri);
    } catch (error) {
      console.log('Failed to load app logo:', error);
    } finally {
      setLogoLoading(false);
    }
  };

  const handleSearchCriteriaChange = (criteria) => {
    setSearchCriteria(criteria);
  };

  const applySearchFilters = () => {
    console.log('Applying search filters:', searchCriteria);
    console.log('Search criteria keys:', Object.keys(searchCriteria));
    console.log('Search criteria values:', Object.values(searchCriteria));
    loadInitialBooks(searchCriteria);
  };

  const clearSearchFilters = () => {
    setSearchCriteria({});
    setQuery('');
    loadInitialBooks(null);
  };

  const loadInitialBooks = async (searchCriteria = null) => {
    try {
      setLoading(true);
      setBooks([]);
      setCurrentOffset(0);
      setHasMore(true);
      
      let result;
      try {
        result = await listBooks(null, 0, searchCriteria || null);
        console.log('Books loaded with criteria:', searchCriteria, result);
      } catch (error) {
        console.log('Failed to load books:', error);
        result = { documents: [], total: 0 };
      }
      
      const refreshKey = Date.now();
      setImageRefreshKey(refreshKey);
      
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
      
      setCurrentOffset(formattedBooks.length);
      setHasMore(false);
      
    } catch (error) {
      console.log('Error loading books:', error);
      setBooks([]);
      setTotalBooks(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreBooks = async () => {
    return;
  };

  useFocusEffect(
    React.useCallback(() => {
      loadInitialBooks(searchCriteria);
      // Refresh logo when screen comes into focus
      loadAppLogo();
    }, [searchCriteria])
  );

  // Load logo on component mount and when headerLogoUri changes
  useEffect(() => {
    loadAppLogo();
  }, [headerLogoUri]);

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
      style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      onPress={() => navigation.navigate('BookDetails', { book: item })}
    >
      <View style={styles.coverWrap}>
        <Image 
          source={{ uri: item.cover }} 
          style={styles.cover}
          key={`${item.id}-${imageRefreshKey}`}
        />
      </View>
      <Text numberOfLines={2} style={[styles.bookTitle, { color: theme.text }]}>{item.title}</Text>
      <Text numberOfLines={1} style={[styles.bookAuthor, { color: theme.textSecondary }]}>{item.author}</Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (books.length > 0 && !loading) {
      return (
        <View style={styles.loadingFooter}>
          <Text style={[styles.endText, { color: theme.textSecondary }]}>✨ All books loaded!</Text>
        </View>
      );
    }
    
    return null;
  };

  const handleEndReached = () => {
    return;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {logoLoading ? (
              <View style={[styles.logoPlaceholder, { backgroundColor: theme.surface }]}>
                <Icon name="refresh-outline" size={20} color={theme.primary} />
              </View>
            ) : (
              <Image
                source={{ uri: headerLogoUri }}
                style={styles.logoImage}
                resizeMode="contain"
                key={headerLogoUri} // Force re-render when URL changes
              />
            )}
          </View>
          
                     {/* Title and Subtitle */}
           <View style={styles.titleContainer}>
             <Text style={[styles.headerTitle, { color: theme.text }]}>BCI E-Library</Text>
             <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Discover amazing books</Text>
           </View>
        </View>
      </View>



      {/* Filter Button */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: theme.secondary }]}
          activeOpacity={0.8}
          onPress={() => setFilterOpen((v) => !v)}
        >
          <Text style={[styles.filterText, { color: theme.text }]}>Filter</Text>
          <Icon name={filterOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.text} />
        </TouchableOpacity>
        
        {/* Clear Button - Only show when filters are applied */}
        {(Object.keys(searchCriteria).length > 0) && (
          <TouchableOpacity
            style={[styles.clearChip, { backgroundColor: theme.error + '15' }]}
            activeOpacity={0.8}
            onPress={clearSearchFilters}
          >
            <Icon name="close-circle" size={16} color={theme.error} />
            <Text style={[styles.clearText, { color: theme.error }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="search" size={18} color={theme.textSecondary} />
        <TextInput
          placeholder="Search for books"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
        />
      </View>

      {/* Filter Modal */}
      <FilterModal
        isVisible={filterOpen}
        searchCriteria={searchCriteria}
        onCriteriaChange={handleSearchCriteriaChange}
        onApply={() => {
          applySearchFilters();
          setFilterOpen(false);
        }}
        onClear={() => {
          clearSearchFilters();
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      {/* Book Count Section */}
      {(query.trim() || Object.keys(searchCriteria).length > 0) && (
        <View style={styles.bookCountSection}>
          <View style={styles.bookCountContainer}>
            <Icon name="search-outline" size={16} color={theme.primary} />
            <Text style={[styles.bookCountText, { color: theme.text }]}>
              {loading ? 'Loading...' : `${filtered.length} book${filtered.length !== 1 ? 's' : ''} found`}
            </Text>
          </View>
        </View>
      )}

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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  titleContainer: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },

  toolbar: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterChip: {
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
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
  },
  clearText: {
    color: '#DC3545',
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
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
  },
  totalBooksText: {
    fontSize: 14,
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
