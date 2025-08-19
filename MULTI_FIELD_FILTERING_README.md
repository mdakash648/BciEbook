# Multi-Field Book Filtering System for React Native + Appwrite

A complete, production-ready solution for implementing efficient multi-field filtering in your React Native app with Appwrite backend.

## 🚀 Features

- ✅ **Multi-field filtering** - Filter by author, category, language, publisher, country
- ✅ **Multiple values per field** - Select multiple authors, categories, etc.
- ✅ **Composite indexes** - Optimized database queries for performance
- ✅ **Search integration** - Text search combined with filters
- ✅ **Pagination support** - Infinite scrolling with load more
- ✅ **Real-time updates** - Filter changes trigger immediate results
- ✅ **Error handling** - Comprehensive error states and retry functionality
- ✅ **Performance optimized** - Efficient query building and caching
- ✅ **UTF8MB4 support** - Full Unicode character support

## 📋 Prerequisites

- React Native CLI project
- Appwrite backend with Books collection
- Appwrite SDK installed: `npm install appwrite`

## 🗄️ Database Schema

Your Appwrite Books collection should have these fields:

```javascript
{
  title: string,
  author: string,
  category: string,
  language: string,
  publisher: string,
  country: string,
  pages: number,
  // ... other fields
}
```

## 🔧 Setup Instructions

### 1. Create Appwrite Indexes

Follow the detailed guide in `APPWRITE_COMPOSITE_INDEXES_SETUP.md` to create:

**Single-Field Indexes:**
- `author_index` → `author`
- `category_index` → `category`
- `language_index` → `language`
- `publisher_index` → `publisher`
- `country_index` → `country`

**Composite Indexes:**
- `author_category_index` → `author`, `category`
- `author_language_index` → `author`, `language`
- `category_language_index` → `category`, `language`
- `publisher_country_index` → `publisher`, `country`
- `author_category_language_index` → `author`, `category`, `language`

### 2. Install Required Dependencies

```bash
npm install react-native-vector-icons
npm install @react-navigation/native
```

### 3. Copy Files to Your Project

Copy these files to your project:

```
services/bookService.js          # Updated service with multi-field filtering
hooks/useBookFilters.js          # Custom hook for filter management
components/FilterModal.jsx       # Filter UI component
examples/BookFilterExample.jsx   # Complete working example
```

### 4. Update Your Configuration

Ensure your `constants/Config.js` has the correct Appwrite settings:

```javascript
export const CONFIG = {
  APPWRITE_ENDPOINT: 'https://your-appwrite-endpoint.com/v1',
  APPWRITE_PROJECT_ID: 'your-project-id',
  APPWRITE_DATABASE_ID: 'your-database-id',
  APPWRITE_BOOKS_COLLECTION_ID: 'books',
  APPWRITE_COVER_BUCKET_ID: 'your-bucket-id'
};
```

## 🎯 Usage Examples

### Basic Usage with Custom Hook

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import useBookFilters from '../hooks/useBookFilters';

const MyComponent = () => {
  const {
    books,
    loading,
    filters,
    toggleFilter,
    clearAllFilters,
    updateSearch
  } = useBookFilters();

  return (
    <View>
      <Text>Found {books.length} books</Text>
      {/* Your UI components */}
    </View>
  );
};
```

### Advanced Usage with Filter Modal

```javascript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import useBookFilters from '../hooks/useBookFilters';
import FilterModal from '../components/FilterModal';

const AdvancedExample = () => {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const {
    books,
    filters,
    applyFilters,
    clearAllFilters,
    getTotalFilterCount
  } = useBookFilters();

  const handleApplyFilters = (newFilters) => {
    applyFilters(newFilters);
    setFilterModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
        <Text>Filter ({getTotalFilterCount()})</Text>
      </TouchableOpacity>

      <FilterModal
        isVisible={filterModalVisible}
        searchCriteria={filters}
        onCriteriaChange={applyFilters}
        onApply={handleApplyFilters}
        onClear={clearAllFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
};
```

### Programmatic Filter Usage

```javascript
import useBookFilters from '../hooks/useBookFilters';

const FilterExample = () => {
  const {
    addFilter,
    removeFilter,
    toggleFilter,
    clearFieldFilters,
    getFilterCount
  } = useBookFilters();

  // Add a specific author filter
  const filterByAuthor = () => {
    addFilter('authors', 'John Doe');
  };

  // Remove a specific category filter
  const removeCategory = () => {
    removeFilter('categories', 'Fiction');
  };

  // Toggle a language filter
  const toggleLanguage = () => {
    toggleFilter('languages', 'English');
  };

  // Clear all author filters
  const clearAuthors = () => {
    clearFieldFilters('authors');
  };

  // Get count of active author filters
  const authorCount = getFilterCount('authors');

  return (
    <View>
      <Text>Active author filters: {authorCount}</Text>
      {/* Your filter buttons */}
    </View>
  );
};
```

## 🔍 API Reference

### useBookFilters Hook

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `books` | Array | Array of filtered books |
| `loading` | Boolean | Loading state |
| `error` | String | Error message if any |
| `hasMore` | Boolean | Whether more books are available |
| `totalBooks` | Number | Total number of books in collection |
| `filters` | Object | Current active filters |
| `searchTerm` | String | Current search term |
| `filterOptions` | Object | Available filter options |

#### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `hasActiveFilters` | Boolean | Whether any filters are active |
| `hasActiveSearch` | Boolean | Whether search term is active |
| `getFilterCount(field)` | Function | Get count of active filters for a field |
| `getTotalFilterCount()` | Function | Get total count of all active filters |

#### Actions

| Method | Parameters | Description |
|--------|------------|-------------|
| `addFilter(field, value)` | String, String | Add a filter value |
| `removeFilter(field, value)` | String, String | Remove a filter value |
| `toggleFilter(field, value)` | String, String | Toggle a filter value |
| `clearAllFilters()` | None | Clear all filters |
| `clearFieldFilters(field)` | String | Clear filters for a specific field |
| `updateSearch(term)` | String | Update search term |
| `applyFilters(filters)` | Object | Apply new filter object |
| `loadMoreBooks()` | None | Load more books (pagination) |
| `refreshBooks()` | None | Refresh current book list |

### FilterModal Component

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isVisible` | Boolean | Yes | Whether modal is visible |
| `searchCriteria` | Object | Yes | Current filter criteria |
| `onCriteriaChange` | Function | Yes | Called when criteria changes |
| `onApply` | Function | Yes | Called when filters are applied |
| `onClear` | Function | Yes | Called when filters are cleared |
| `onClose` | Function | Yes | Called when modal is closed |

## 🚀 Performance Optimization Tips

### 1. Index Strategy
- Create composite indexes for frequently used filter combinations
- Monitor index usage and remove unused indexes
- Place most frequently filtered fields first in composite indexes

### 2. Query Optimization
- Use the built-in query optimization in `bookService.js`
- Limit the number of concurrent filter requests
- Implement proper error handling and retry logic

### 3. UI Optimization
- Debounce search input to avoid excessive API calls
- Use pagination to limit initial load
- Cache filter options when possible

### 4. Large Collections
- Consider implementing server-side aggregation for filter options
- Use pagination for filter options if there are many unique values
- Monitor query performance in Appwrite console

## 🐛 Troubleshooting

### Common Issues

1. **Filters returning 0 results**
   - Check if indexes are built (green status in Appwrite console)
   - Verify field names match exactly (case-sensitive)
   - Test with simpler queries first

2. **Performance issues**
   - Ensure composite indexes are being used
   - Check query execution time in Appwrite logs
   - Consider reducing number of concurrent filters

3. **Filter options not loading**
   - Check network connectivity
   - Verify Appwrite permissions
   - Check console for error messages

### Debug Mode

Enable debug logging by adding this to your `bookService.js`:

```javascript
// Add this at the top of the file
const DEBUG = true;

// Then use it in your functions
if (DEBUG) {
  console.log('Query details:', queries);
}
```

## 📱 Complete Example

See `examples/BookFilterExample.jsx` for a complete working example that demonstrates:

- Search functionality
- Multi-field filtering
- Active filter display
- Pagination
- Error handling
- Loading states
- Pull-to-refresh

## 🔄 Migration from Old System

If you're migrating from a simpler filtering system:

1. **Backup your current code**
2. **Update your bookService.js** with the new version
3. **Create the required indexes** in Appwrite
4. **Replace your filter logic** with the new hook
5. **Test thoroughly** with your existing data

## 📄 License

This solution is provided as-is for educational and commercial use.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the Appwrite documentation
3. Test with the provided examples
4. Check console logs for detailed error messages

---

**Happy Filtering! 🎉**
