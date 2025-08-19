import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import useBookFilters from '../hooks/useBookFilters';
import FilterModal from '../components/FilterModal';

/**
 * Complete working example of multi-field book filtering
 * This component demonstrates all the filtering capabilities
 */
const BookFilterExample = ({ navigation }) => {
  const { theme } = useTheme();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Use the custom filter hook
  const {
    // State
    books,
    loading,
    error,
    hasMore,
    totalBooks,
    filters,
    searchTerm,
    filterOptions,
    filterOptionsLoading,
    
    // Computed values
    hasActiveFilters,
    hasActiveSearch,
    getFilterCount,
    getTotalFilterCount,
    
    // Actions
    toggleFilter,
    clearAllFilters,
    updateSearch,
    applyFilters,
    loadMoreBooks,
    refreshBooks
  } = useBookFilters();

  /**
   * Handle search input change
   */
  const handleSearchChange = (text) => {
    updateSearch(text);
  };

  /**
   * Handle filter modal apply
   */
  const handleApplyFilters = (newFilters) => {
    applyFilters(newFilters);
    setFilterModalVisible(false);
  };

  /**
   * Handle filter modal clear
   */
  const handleClearFilters = () => {
    clearAllFilters();
    setFilterModalVisible(false);
  };

  /**
   * Render individual book item
   */
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.bookItem, { backgroundColor: theme.surface }]}
      onPress={() => navigation.navigate('BookDetails', { book: item })}
      activeOpacity={0.7}
    >
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.bookMeta}>
          <Text style={[styles.bookMetaText, { color: theme.textMuted }]}>
            {item.category} • {item.language}
          </Text>
          <Text style={[styles.bookMetaText, { color: theme.textMuted }]}>
            {item.publisher} • {item.country}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  /**
   * Render filter chip
   */
  const renderFilterChip = (field, value) => (
    <TouchableOpacity
      key={`${field}-${value}`}
      style={[styles.filterChip, { backgroundColor: theme.primary }]}
      onPress={() => toggleFilter(field, value)}
      activeOpacity={0.7}
    >
      <Text style={styles.filterChipText}>{value}</Text>
      <Icon name="close" size={14} color="#FFFFFF" />
    </TouchableOpacity>
  );

  /**
   * Render all active filter chips
   */
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    Object.entries(filters).forEach(([field, values]) => {
      values.forEach(value => {
        activeFilters.push(renderFilterChip(field, value));
      });
    });

    if (activeFilters.length === 0) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={[styles.activeFiltersTitle, { color: theme.text }]}>
          Active Filters ({getTotalFilterCount()}):
        </Text>
        <View style={styles.filterChipsContainer}>
          {activeFilters}
        </View>
        <TouchableOpacity
          style={[styles.clearAllButton, { borderColor: theme.border }]}
          onPress={clearAllFilters}
          activeOpacity={0.7}
        >
          <Text style={[styles.clearAllText, { color: theme.textSecondary }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render loading footer
   */
  const renderFooter = () => {
    if (!loading && !hasMore) {
      return (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            ✨ All books loaded!
          </Text>
        </View>
      );
    }
    
    if (loading && books.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Loading more books...
          </Text>
        </View>
      );
    }
    
    return null;
  };

  /**
   * Handle end reached for pagination
   */
  const handleEndReached = () => {
    if (!loading && hasMore) {
      loadMoreBooks();
    }
  };

  /**
   * Handle pull to refresh
   */
  const handleRefresh = () => {
    refreshBooks();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Book Library
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {totalBooks} books available
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Icon name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search books by title, author, or category..."
          placeholderTextColor={theme.textMuted}
          value={searchTerm}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => updateSearch('')}>
            <Icon name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: hasActiveFilters ? theme.primary : theme.surface,
              borderColor: theme.border
            }
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Icon 
            name="filter" 
            size={18} 
            color={hasActiveFilters ? '#FFFFFF' : theme.textSecondary} 
          />
          <Text style={[
            styles.filterButtonText,
            { color: hasActiveFilters ? '#FFFFFF' : theme.text }
          ]}>
            Filter
            {hasActiveFilters && ` (${getTotalFilterCount()})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshBooks}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Books List */}
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={loading && books.length === 0}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Icon name="library-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {hasActiveFilters || hasActiveSearch ? 'No books found' : 'No books available'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {hasActiveFilters || hasActiveSearch 
                  ? 'Try adjusting your filters or search terms'
                  : 'Books will appear here once they are added to the library'
                }
              </Text>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      <FilterModal
        isVisible={filterModalVisible}
        searchCriteria={filters}
        onCriteriaChange={applyFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  activeFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    marginLeft: 10,
    color: '#DC2626',
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 6,
  },
  bookMeta: {
    gap: 2,
  },
  bookMetaText: {
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BookFilterExample;
