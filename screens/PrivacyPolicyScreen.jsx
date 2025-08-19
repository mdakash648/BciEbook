import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { loadPublicData } from '../services/demoPolicyService';

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme } = useTheme();
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const loadPrivacyPolicy = async () => {
    setLoading(true);
    try {
      const data = await loadPublicData();
      const value = (data?.privacyPolicy || '').trim();
      setPrivacyPolicy(value || 'No privacy policy has been set yet.');
      setMetadata(null);
    } catch (_) {
      setPrivacyPolicy('No privacy policy has been set yet.');
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacyPolicy();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Privacy Policy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Database metadata removed */}

          <Text style={[styles.policyContent, { color: theme.text }]}>{privacyPolicy}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 16,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 6,
  },
  contactInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  metadataContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  databaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#E9F5EB',
    padding: 8,
    borderRadius: 6,
  },
  databaseIndicatorText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#28A745',
    fontWeight: '600',
  },
  policyContent: {
    fontSize: 15,
    lineHeight: 24,
  },
});
