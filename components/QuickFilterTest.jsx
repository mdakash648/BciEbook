import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { testFiltering, listBooks } from '../services/bookService';

/**
 * Quick test component for filtering
 * Add this to your HomeScreen temporarily for testing
 */
const QuickFilterTest = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runTest = async () => {
    try {
      setLoading(true);
      const testResults = await testFiltering();
      setResults(testResults);
      
      // Show alert with key results
      const message = testResults.error 
        ? `Error: ${testResults.error}`
        : `All Books: ${testResults.allBooks}\n` +
          `Author Filter: ${testResults.authorFilter}\n` +
          `Category Filter: ${testResults.categoryFilter}\n` +
          `Multi Filter: ${testResults.multiFilter}\n` +
          `Multiple Values: ${testResults.multipleValues}`;
      
      Alert.alert('Filter Test Results', message);
      
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleFilter = async () => {
    try {
      setLoading(true);
      
      // First get all books to see what we have
      const allBooks = await listBooks(5, 0, null);
      console.log('All books:', allBooks.documents.length);
      
      if (allBooks.documents.length === 0) {
        Alert.alert('No Data', 'No books found in collection');
        return;
      }
      
      // Test with the first book's author
      const firstBook = allBooks.documents[0];
      const author = firstBook.author;
      
      console.log('Testing with author:', author);
      const filtered = await listBooks(10, 0, { authors: [author] });
      
      Alert.alert('Simple Test', 
        `Testing with author: "${author}"\n` +
        `Found: ${filtered.documents.length} books\n` +
        `Total books: ${allBooks.documents.length}`
      );
      
    } catch (error) {
      console.error('Simple test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Filter Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={runTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : 'Run Full Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.secondary }]}
          onPress={testSimpleFilter}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Simple Test</Text>
        </TouchableOpacity>
      </View>

      {results && !results.error && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.text }]}>Test Results:</Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            📚 Total Books: {results.allBooks}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            👤 Author Filter: {results.authorFilter}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            📂 Category Filter: {results.categoryFilter}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            🔍 Multi Filter: {results.multiFilter}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            📝 Multiple Values: {results.multipleValues}
          </Text>
          
          {results.sampleData && (
            <View style={styles.sampleDataContainer}>
              <Text style={[styles.sampleTitle, { color: theme.text }]}>Sample Data Used:</Text>
              <Text style={[styles.sampleText, { color: theme.textSecondary }]}>
                Author: "{results.sampleData.author}"
              </Text>
              <Text style={[styles.sampleText, { color: theme.textSecondary }]}>
                Category: "{results.sampleData.category}"
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {results && results.error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            ❌ {results.error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    maxHeight: 200,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  },
  sampleDataContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  sampleText: {
    fontSize: 12,
    marginBottom: 3,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default QuickFilterTest;
