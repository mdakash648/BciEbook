import { useState, useEffect, useCallback } from 'react';
import { listBooks, getFilterOptions, searchBooks } from '../services/bookService';

/**
 * Custom hook for managing book filters and search functionality
 * Provides complete multi-field filtering with optimization
 */
export const useBookFilters = () => {
  // Filter state
  const [filters, setFilters] = useState({
    authors: [],
    categories: [],
    languages: [],
    publishers: [],
    countries: []
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Books state
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);

  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    authors: [],
    categories: [],
    languages: [],
    publishers: [],
    countries: []
  });

  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // Constants
  const ITEMS_PER_PAGE = 20;

  /**
   * Load filter options (unique values for each field)
   */
  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error loading filter options:', err);
      setError('Failed to load filter options');
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useCallback(() => {
    return Object.values(filters).some(arr => arr.length > 0);
  }, [filters]);

  /**
   * Check if search is active
   */
  const hasActiveSearch = useCallback(() => {
    return searchTerm.trim().length > 0;
  }, [searchTerm]);

  /**
   * Get active filter count for a specific field
   */
  const getFilterCount = useCallback((field) => {
    return filters[field]?.length || 0;
  }, [filters]);

  /**
   * Get total active filter count
   */
  const getTotalFilterCount = useCallback(() => {
    return Object.values(filters).reduce((total, arr) => total + arr.length, 0);
  }, [filters]);

  /**
   * Add a filter value
   */
  const addFilter = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value]
    }));
  }, []);

  /**
   * Remove a filter value
   */
  const removeFilter = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(v => v !== value)
    }));
  }, []);

  /**
   * Toggle a filter value (add if not present, remove if present)
   */
  const toggleFilter = useCallback((field, value) => {
    setFilters(prev => {
      const currentValues = prev[field] || [];
      const isPresent = currentValues.includes(value);
      
      return {
        ...prev,
        [field]: isPresent 
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      };
    });
  }, []);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilters({
      authors: [],
      categories: [],
      languages: [],
      publishers: [],
      countries: []
    });
  }, []);

  /**
   * Clear filters for a specific field
   */
  const clearFieldFilters = useCallback((field) => {
    setFilters(prev => ({
      ...prev,
      [field]: []
    }));
  }, []);

  /**
   * Load books with current filters and search
   */
  const loadBooks = useCallback(async (resetPagination = true) => {
    try {
      setLoading(true);
      setError(null);

      // Reset pagination if requested
      if (resetPagination) {
        setCurrentPage(0);
        setHasMore(true);
      }

      const offset = resetPagination ? 0 : currentPage * ITEMS_PER_PAGE;

      let result;

      if (hasActiveSearch()) {
        // Use search functionality
        result = await searchBooks(searchTerm, ITEMS_PER_PAGE, offset);
      } else if (hasActiveFilters()) {
        // Use filter functionality
        result = await listBooks(ITEMS_PER_PAGE, offset, filters);
      } else {
        // Load all books
        result = await listBooks(ITEMS_PER_PAGE, offset, null);
      }

      const newBooks = result.documents || [];
      
      if (resetPagination) {
        setBooks(newBooks);
      } else {
        setBooks(prev => [...prev, ...newBooks]);
      }

      setTotalBooks(result.total || 0);
      setHasMore(newBooks.length === ITEMS_PER_PAGE);

    } catch (err) {
      console.error('Error loading books:', err);
      setError('Failed to load books');
      if (resetPagination) {
        setBooks([]);
        setTotalBooks(0);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, hasActiveFilters, hasActiveSearch, currentPage]);

  /**
   * Load more books (pagination)
   */
  const loadMoreBooks = useCallback(async () => {
    if (loading || !hasMore) return;

    setCurrentPage(prev => prev + 1);
    await loadBooks(false);
  }, [loading, hasMore, loadBooks]);

  /**
   * Refresh books (reload with current filters)
   */
  const refreshBooks = useCallback(async () => {
    await loadBooks(true);
  }, [loadBooks]);

  /**
   * Update search term and reload books
   */
  const updateSearch = useCallback(async (term) => {
    setSearchTerm(term);
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      loadBooks(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [loadBooks]);

  /**
   * Apply filters and reload books
   */
  const applyFilters = useCallback(async (newFilters) => {
    setFilters(newFilters);
    // The useEffect will handle reloading books
  }, []);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Reload books when filters or search change
  useEffect(() => {
    loadBooks(true);
  }, [filters, searchTerm]);

  return {
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
    hasActiveFilters: hasActiveFilters(),
    hasActiveSearch: hasActiveSearch(),
    getFilterCount,
    getTotalFilterCount,

    // Actions
    addFilter,
    removeFilter,
    toggleFilter,
    clearAllFilters,
    clearFieldFilters,
    updateSearch,
    applyFilters,
    loadMoreBooks,
    refreshBooks,
    loadFilterOptions
  };
};

export default useBookFilters;
