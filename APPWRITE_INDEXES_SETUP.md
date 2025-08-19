# Appwrite Multipass Index System Setup Guide

This guide explains how to set up the multipass index system in Appwrite for efficient filtering of books by category, author, language, publisher, and country.

## Required Indexes

Based on the images provided, you need to create the following indexes in your Appwrite `books` collection:

### 1. Author Index
- **Key**: `author_index`
- **Type**: `key`
- **Attributes**: `author`
- **Orders**: `ASC`
- **Lengths**: `0`

### 2. Language Index
- **Key**: `language_index`
- **Type**: `key`
- **Attributes**: `language`
- **Orders**: `ASC`
- **Lengths**: `0`

### 3. Publisher Index
- **Key**: `publisher_index`
- **Type**: `key`
- **Attributes**: `publisher`
- **Orders**: `ASC`
- **Lengths**: `0`

### 4. Country Index
- **Key**: `country_index`
- **Type**: `key`
- **Attributes**: `country`
- **Orders**: `ASC`
- **Lengths**: `0`

### 5. Category Index
- **Key**: `category_index`
- **Type**: `key`
- **Attributes**: `category`
- **Orders**: `ASC`
- **Lengths**: `0`

## How to Create Indexes in Appwrite Console

1. **Navigate to your Appwrite Console**
2. **Go to your Database** → **books collection**
3. **Click on the "Indexes" tab**
4. **Click "+ Create index" button**
5. **Fill in the details for each index:**

### For Author Index:
- **Key**: `author_index`
- **Type**: Select `key`
- **Attributes**: Select `author` from dropdown
- **Orders**: Select `ASC`
- **Lengths**: Leave as `0`

### For Language Index:
- **Key**: `language_index`
- **Type**: Select `key`
- **Attributes**: Select `language` from dropdown
- **Orders**: Select `ASC`
- **Lengths**: Leave as `0`

### For Publisher Index:
- **Key**: `publisher_index`
- **Type**: Select `key`
- **Attributes**: Select `publisher` from dropdown
- **Orders**: Select `ASC`
- **Lengths**: Leave as `0`

### For Country Index:
- **Key**: `country_index`
- **Type**: Select `key`
- **Attributes**: Select `country` from dropdown
- **Orders**: Select `ASC`
- **Lengths**: Leave as `0`

### For Category Index:
- **Key**: `category_index`
- **Type**: Select `key`
- **Attributes**: Select `category` from dropdown
- **Orders**: Select `ASC`
- **Lengths**: Leave as `0`

## Why Multipass Index System?

The multipass index system provides several benefits:

1. **Efficient Filtering**: Each filter field has its own index, allowing fast queries
2. **Multiple Selections**: Users can select multiple values for each filter (e.g., multiple authors)
3. **Combined Filters**: Multiple filters can be combined efficiently using OR conditions
4. **Scalability**: As your book collection grows, queries remain fast

## How It Works in the Code

The `listBooks` function in `services/bookService.js` uses these indexes:

```javascript
// For multiple values (e.g., multiple authors selected)
if (Array.isArray(value) && value.length > 0) {
    // Create OR conditions using the index
    const orQueries = value.map((val) => Query.equal(key, val));
    queries.push(Query.or(orQueries));
}
```

This creates queries like:
```javascript
Query.or([
    Query.equal('author', 'Author 1'),
    Query.equal('author', 'Author 2'),
    Query.equal('author', 'Author 3')
])
```

## Performance Benefits

- **Fast Queries**: Indexes make filtering operations O(log n) instead of O(n)
- **Reduced Server Load**: Efficient queries use less CPU and memory
- **Better User Experience**: Filter results appear instantly
- **Scalable**: Performance remains consistent as data grows

## Verification

After creating all indexes:

1. **Check the Indexes tab** in your Appwrite console
2. **Verify all 5 indexes are listed** with correct attributes
3. **Test the filter functionality** in your React Native app
4. **Monitor query performance** in Appwrite console logs

## Troubleshooting

If filters are not working:

1. **Check index status**: Ensure all indexes are built (green status)
2. **Verify attribute names**: Make sure they match your collection schema
3. **Check query logs**: Look for errors in Appwrite console
4. **Test individual queries**: Try filtering by one field at a time

## Additional Indexes (Optional)

For even better performance, consider adding:

- **Title Index**: For text search functionality
- **Created Date Index**: For sorting by date
- **Composite Indexes**: For frequently combined filters

This multipass index system ensures your book filtering is fast, efficient, and scalable!
