import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const MOCK_BOOKS = [
  {
    id: '1',
    title: 'The Silent Observer',
    author: 'Amelia Stone',
    cover: 'https://images.unsplash.com/photo-1544937950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Echoes of the Past',
    author: 'Ethan Blackwood',
    cover: 'https://images.unsplash.com/photo-1508255139162-e1f7f2ec87fc?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Whispers of the Wind',
    author: 'Olivia Reed',
    cover: 'https://images.unsplash.com/photo-1495344517868-8ebaf0a2044a?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '4',
    title: 'The Last Lighthouse Keeper',
    author: 'Daniel Hayes',
    cover: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '5',
    title: 'Secrets of the Sapphire Sea',
    author: 'Sophia Turner',
    cover: 'https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '6',
    title: 'Beneath the Crimson Sky',
    author: 'Caleb Walker',
    cover: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800&auto=format&fit=crop',
  },
];

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return MOCK_BOOKS;
    const q = query.toLowerCase();
    return MOCK_BOOKS.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [query]);

  const renderBook = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('BookDetails', { book: item })}
    >
      <View style={styles.coverWrap}>
        <Image source={{ uri: item.cover }} style={styles.cover} />
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
});
