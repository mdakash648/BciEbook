import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { testFiltering, listBooks, getFilterOptions } from '../services/bookService';

/**
 * Simple debug component to test filtering functionality
 */
const FilterDebugger = () => {
  const { theme } = useTheme();
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    try {
      setLoading(true);
      const results = await testFiltering();
      setTestResults(results);
      Alert.alert('Test Complete', 'Check console for detailed logs');
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSingleFilter = async () => {
    try {
      setLoading(true);
      console.log('Testing single author filter...');
      const result = await listBooks(10, 0, { authors: ['John Doe'] });
      console.log('Single filter result:', result);
      Alert.alert('Single Filter Test', `Found ${result.documents.length} books`);
    } catch (error) {
      console.error('Single filter test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testMultiFilter = async () => {
    try {
      setLoading(true);
      console.log('Testing multi-field filter...');
      const result = await listBooks(10, 0, { 
        authors: ['John Doe'], 
        categories: ['Fiction'] 
      });
      console.log('Multi filter result:', result);
      Alert.alert('Multi Filter Test', `Found ${result.documents.length} books`);
    } catch (error) {
      console.error('Multi filter test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testFilterOptions = async () => {
    try {
      setLoading(true);
      console.log('Testing filter options...');
      const options = await getFilterOptions();
      console.log('Filter options:', options);
      Alert.alert('Filter Options Test', `Loaded ${Object.keys(options).length} categories`);
    } catch (error) {
      console.error('Filter options test failed:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Filter Debugger</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={runTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.secondary }]}
          onPress={testSingleFilter}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Single Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.secondary }]}
          onPress={testMultiFilter}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Multi Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.secondary }]}
          onPress={testFilterOptions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Filter Options</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={[styles.resultsContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.resultsTitle, { color: theme.text }]}>Test Results:</Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            All Books: {testResults.allBooks}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            Author Filter: {testResults.authorFilter}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            Category Filter: {testResults.categoryFilter}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            Multi Filter: {testResults.multiFilter}
          </Text>
          <Text style={[styles.resultText, { color: theme.text }]}>
            Multiple Values: {testResults.multipleValues}
          </Text>
        </View>
      )}

      <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>Debugging Tips:</Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          1. Check console logs for detailed information
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          2. Verify your Appwrite indexes are built (green status)
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          3. Check field names match exactly (case-sensitive)
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          4. Ensure your collection has data
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  },
  infoContainer: {
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default FilterDebugger;
