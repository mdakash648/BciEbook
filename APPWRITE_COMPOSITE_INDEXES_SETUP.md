# Appwrite Composite Indexes Setup Guide for Multi-Field Filtering

This guide provides step-by-step instructions for setting up both single-field and composite indexes in Appwrite to enable efficient multi-field filtering in your React Native app.

## Required Indexes

### Single-Field Indexes (You already have these)
These indexes are required for individual field filtering:

1. **Author Index**
   - **Key**: `author_index`
   - **Type**: `key`
   - **Attributes**: `author`
   - **Orders**: `ASC`
   - **Lengths**: `0`

2. **Category Index**
   - **Key**: `category_index`
   - **Type**: `key`
   - **Attributes**: `category`
   - **Orders**: `ASC`
   - **Lengths**: `0`

3. **Language Index**
   - **Key**: `language_index`
   - **Type**: `key`
   - **Attributes**: `language`
   - **Orders**: `ASC`
   - **Lengths**: `0`

4. **Publisher Index**
   - **Key**: `publisher_index`
   - **Type**: `key`
   - **Attributes**: `publisher`
   - **Orders**: `ASC`
   - **Lengths**: `0`

5. **Country Index**
   - **Key**: `country_index`
   - **Type**: `key`
   - **Attributes**: `country`
   - **Orders**: `ASC`
   - **Lengths**: `0`

### Composite Indexes (You need to add these)
These indexes enable efficient multi-field filtering:

1. **Author + Category Index**
   - **Key**: `author_category_index`
   - **Type**: `key`
   - **Attributes**: `author`, `category`
   - **Orders**: `ASC`, `ASC`
   - **Lengths**: `0`, `0`

2. **Author + Language Index**
   - **Key**: `author_language_index`
   - **Type**: `key`
   - **Attributes**: `author`, `language`
   - **Orders**: `ASC`, `ASC`
   - **Lengths**: `0`, `0`

3. **Category + Language Index**
   - **Key**: `category_language_index`
   - **Type**: `key`
   - **Attributes**: `category`, `language`
   - **Orders**: `ASC`, `ASC`
   - **Lengths**: `0`, `0`

4. **Publisher + Country Index**
   - **Key**: `publisher_country_index`
   - **Type**: `key`
   - **Attributes**: `publisher`, `country`
   - **Orders**: `ASC`, `ASC`
   - **Lengths**: `0`, `0`

5. **Author + Category + Language Index**
   - **Key**: `author_category_language_index`
   - **Type**: `key`
   - **Attributes**: `author`, `category`, `language`
   - **Orders**: `ASC`, `ASC`, `ASC`
   - **Lengths**: `0`, `0`, `0`

## How to Create Composite Indexes in Appwrite Console

### Step 1: Navigate to Your Collection
1. Go to your Appwrite Console
2. Navigate to **Databases** → **Your Database** → **Books Collection**
3. Click on the **"Indexes"** tab

### Step 2: Create Composite Indexes

#### For Author + Category Index:
1. Click **"+ Create index"**
2. Fill in the details:
   - **Key**: `author_category_index`
   - **Type**: Select `key`
   - **Attributes**: 
     - Click **"+ Add attribute"**
     - Select `author` from dropdown
     - Click **"+ Add attribute"** again
     - Select `category` from dropdown
   - **Orders**: 
     - First attribute: `ASC`
     - Second attribute: `ASC`
   - **Lengths**: Leave both as `0`
3. Click **"Create"**

#### For Author + Language Index:
1. Click **"+ Create index"**
2. Fill in the details:
   - **Key**: `author_language_index`
   - **Type**: Select `key`
   - **Attributes**: 
     - First: `author`
     - Second: `language`
   - **Orders**: Both `ASC`
   - **Lengths**: Both `0`
3. Click **"Create"**

#### For Category + Language Index:
1. Click **"+ Create index"**
2. Fill in the details:
   - **Key**: `category_language_index`
   - **Type**: Select `key`
   - **Attributes**: 
     - First: `category`
     - Second: `language`
   - **Orders**: Both `ASC`
   - **Lengths**: Both `0`
3. Click **"Create"**

#### For Publisher + Country Index:
1. Click **"+ Create index"**
2. Fill in the details:
   - **Key**: `publisher_country_index`
   - **Type**: Select `key`
   - **Attributes**: 
     - First: `publisher`
     - Second: `country`
   - **Orders**: Both `ASC`
   - **Lengths**: Both `0`
3. Click **"Create"**

#### For Author + Category + Language Index:
1. Click **"+ Create index"**
2. Fill in the details:
   - **Key**: `author_category_language_index`
   - **Type**: Select `key`
   - **Attributes**: 
     - First: `author`
     - Second: `category`
     - Third: `language`
   - **Orders**: All three `ASC`
   - **Lengths**: All three `0`
3. Click **"Create"**

## Index Building Process

After creating each index:
1. **Wait for index to build** - This may take several minutes depending on collection size
2. **Check status** - Index should show green status when ready
3. **Verify in console** - You should see all indexes listed in the Indexes tab

## Performance Optimization Tips

### 1. Index Order Matters
- Place the most frequently filtered fields first in composite indexes
- For example, if users filter by author more than category, put `author` first

### 2. Avoid Too Many Indexes
- Each index consumes storage and affects write performance
- Only create indexes for combinations that are actually used

### 3. Monitor Index Usage
- Use Appwrite's monitoring tools to see which indexes are being used
- Remove unused indexes to improve performance

### 4. Consider Data Distribution
- If certain field combinations are rarely used together, don't create composite indexes for them
- Focus on the most common filter combinations

## Testing Your Indexes

### Test Individual Field Filtering:
```javascript
// Test single author filter
const result = await listBooks(20, 0, { authors: ['John Doe'] });
```

### Test Multi-Field Filtering:
```javascript
// Test author + category filter
const result = await listBooks(20, 0, { 
  authors: ['John Doe'], 
  categories: ['Fiction'] 
});
```

### Test Multiple Values per Field:
```javascript
// Test multiple authors
const result = await listBooks(20, 0, { 
  authors: ['John Doe', 'Jane Smith'] 
});
```

## Troubleshooting

### Common Issues:

1. **Index Not Building**
   - Check if collection has data
   - Verify field names match exactly
   - Wait longer for large collections

2. **Queries Returning 0 Results**
   - Verify index is built (green status)
   - Check field values match exactly (case-sensitive)
   - Test with simpler queries first

3. **Performance Issues**
   - Ensure indexes are being used (check query logs)
   - Consider reducing number of indexes
   - Monitor query execution time

### Verification Checklist:
- [ ] All single-field indexes created and built
- [ ] All composite indexes created and built
- [ ] Index status shows green for all indexes
- [ ] Test queries return expected results
- [ ] Multi-field filtering works correctly
- [ ] Multiple values per field work correctly

## UTF8MB4 Considerations

Since you mentioned UTF8MB4 encoding:
- Appwrite handles UTF8MB4 automatically
- No special configuration needed for indexes
- All string fields support full Unicode characters
- Index lengths of `0` work correctly with UTF8MB4

This setup will provide efficient multi-field filtering for your React Native app with optimal performance!
