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
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const docs = await listBooks();
          // Add cache busting to cover images
          const refreshKey = Date.now();
          setImageRefreshKey(refreshKey);
          
          setBooks(
            Array.isArray(docs)
              ? docs.map((d) => ({
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
                }))
              : []
          );
        } catch (_) {
          setBooks([]);
        } finally {
          setLoading(false);
        }
      };
      load();
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
            Total: {books.length} book{books.length !== 1 ? 's' : ''}
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
});
