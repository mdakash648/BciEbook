import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { getFilterOptions } from '../services/bookService';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const FilterModal = ({
  isVisible,
  searchCriteria,
  onCriteriaChange,
  onApply,
  onClear,
  onClose
}) => {
  const { theme } = useTheme();
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    authors: [],
    languages: [],
    publishers: [],
    countries: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    authors: [],
    languages: [],
    publishers: [],
    countries: []
  });
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    authors: false,
    languages: false,
    publishers: false,
    countries: false
  });

  useEffect(() => {
    if (isVisible) {
      loadFilterOptions();
      setSelectedFilters({
        categories: searchCriteria.categories || [],
        authors: searchCriteria.authors || [],
        languages: searchCriteria.languages || [],
        publishers: searchCriteria.publishers || [],
        countries: searchCriteria.countries || []
      });
    }
  }, [isVisible, searchCriteria]);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => {
      const currentValues = prev[category] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [category]: newValues
      };
    });
  };

  const isSelected = (category, value) => {
    return (selectedFilters[category] || []).includes(value);
  };

  const getSelectedCount = (category) => {
    return (selectedFilters[category] || []).length;
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedFilters).reduce((total, values) => total + values.length, 0);
  };

  const applyFilters = () => {
    const criteria = {};
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        criteria[key] = values;
      }
    });
    
    onCriteriaChange(criteria);
    onApply();
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      authors: [],
      languages: [],
      publishers: [],
      countries: []
    });
    onClear();
  };

  const renderFilterSection = (title, category, options, iconName, color) => {
    if (!options || options.length === 0) return null;
    
    const isExpanded = expandedSections[category];
    const selectedCount = getSelectedCount(category);
    
    return (
      <View style={[styles.filterSection, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(category)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
              <Icon name={iconName} size={18} color={color} />
            </View>
            <View style={styles.sectionTextContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {options.length} options available
              </Text>
            </View>
          </View>
          <View style={styles.sectionRight}>
            {selectedCount > 0 && (
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{selectedCount}</Text>
              </View>
            )}
            <Icon 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.textSecondary} 
              style={styles.chevronIcon}
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.optionsGrid}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isSelected(category, option) 
                        ? color + '20' 
                        : theme.background,
                      borderColor: isSelected(category, option) ? color : theme.border
                    }
                  ]}
                  onPress={() => toggleFilter(category, option)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    { 
                      color: isSelected(category, option) ? color : theme.text,
                      fontWeight: isSelected(category, option) ? '600' : '400'
                    }
                  ]}>
                    {option}
                  </Text>
                  {isSelected(category, option) && (
                    <Icon name="checkmark" size={14} color={color} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        {/* Modal Content */}
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Handle Bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: theme.text }]}>Filter Books</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Refine your search
              </Text>
            </View>
            <View style={styles.headerRight}>
              {getTotalSelectedCount() > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
                  <Text style={[styles.clearText, { color: theme.error }]}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading filter options...
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {renderFilterSection('Categories', 'categories', filterOptions.categories, 'grid-outline', '#6366F1')}
              {renderFilterSection('Authors', 'authors', filterOptions.authors, 'person-outline', '#10B981')}
              {renderFilterSection('Languages', 'languages', filterOptions.languages, 'language-outline', '#F59E0B')}
              {renderFilterSection('Publishers', 'publishers', filterOptions.publishers, 'business-outline', '#EF4444')}
              {renderFilterSection('Countries', 'countries', filterOptions.countries, 'flag-outline', '#8B5CF6')}
            </ScrollView>
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                {getTotalSelectedCount()} filter{getTotalSelectedCount() !== 1 ? 's' : ''} selected
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.applyButton, 
                { 
                  backgroundColor: getTotalSelectedCount() > 0 ? theme.primary : theme.border,
                  opacity: getTotalSelectedCount() > 0 ? 1 : 0.6
                }
              ]} 
              onPress={applyFilters}
              activeOpacity={0.8}
              disabled={getTotalSelectedCount() === 0}
            >
              <Icon name="search" size={18} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.applyButtonText}>
                Apply {getTotalSelectedCount() > 0 ? `(${getTotalSelectedCount()})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContainer: {
    height: screenHeight * 0.75, // 75% of screen height
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  handleBar: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
    borderRadius: 16,
    width: '98%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 36,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '400',
  },
  checkIcon: {
    marginLeft: 6,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  footerInfo: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default FilterModal;