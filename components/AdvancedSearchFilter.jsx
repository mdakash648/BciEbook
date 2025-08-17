import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AdvancedSearchFilter = ({ 
  isVisible, 
  searchCriteria, 
  onCriteriaChange, 
  onApply, 
  onClear 
}) => {
  if (!isVisible) return null;

  const updateCriteria = (field, value) => {
    onCriteriaChange({
      ...searchCriteria,
      [field]: value
    });
  };

  const fields = [
    { key: 'title', label: 'Name', placeholder: 'Search by book name' },
    { key: 'category', label: 'Category', placeholder: 'Search by category' },
    { key: 'author', label: 'Author', placeholder: 'Search by author' },
    { key: 'edition', label: 'Edition', placeholder: 'Search by edition' },
    { key: 'pages', label: 'Pages', placeholder: 'Search by pages', keyboardType: 'numeric' },
    { key: 'language', label: 'Language', placeholder: 'Search by language' },
    { key: 'publisher', label: 'Publisher', placeholder: 'Search by publisher' },
    { key: 'country', label: 'Country', placeholder: 'Search by country' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advanced Search</Text>
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {fields.map((field) => (
        <View key={field.key} style={styles.inputGroup}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#9CA3AF"
            value={searchCriteria[field.key] || ''}
            onChangeText={(value) => updateCriteria(field.key, value)}
            keyboardType={field.keyboardType || 'default'}
          />
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.applyButton} onPress={onApply}>
          <Icon name="search" size={18} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AdvancedSearchFilter;