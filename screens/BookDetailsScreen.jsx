import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

export default function BookDetailsScreen({ navigation, route }) {
  const book = route?.params?.book || {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    description:
      'A gripping psychological thriller about a famous painter who shoots her husband and then refuses to speak, and the psychotherapist who becomes obsessed with unraveling the mystery behind her silence.',
    cover:
      'https://images.unsplash.com/photo-1544716278-fbf89a162c2a?q=80&w=1200&auto=format&fit=crop',
    category: 'Thriller',
    edition: 'First Edition',
    pages: 325,
    language: 'English',
    publisher: 'Celadon Books',
    country: 'United States',
  };

  const info = [
    { label: 'Name', value: book.title },
    { label: 'Category', value: book.category },
    { label: 'Author', value: book.author },
    { label: 'Edition', value: book.edition },
    { label: 'Pages', value: String(book.pages) },
    { label: 'Language', value: book.language },
    { label: 'Publisher', value: book.publisher },
    { label: 'Country', value: book.country },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={22} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Details</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-outline" size={20} color="#212529" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: book.cover }} style={styles.heroImage} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.desc}>{book.description}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}>
              <Text style={styles.primaryBtnText}>Open & Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]}> 
              <Text style={styles.secondaryBtnText}>Add to Favorites</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Book Information</Text>

          <View style={styles.infoTable}>
            {info.map((row, idx) => (
              <View key={row.label} style={[styles.infoRow, idx % 2 === 0 && styles.infoRowSplit]}>
                <View style={styles.infoCell}> 
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212529' },

  hero: { height: 220, backgroundColor: '#F8F9FA' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  body: { paddingHorizontal: 16, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#212529', marginBottom: 12 },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
    marginBottom: 12,
  },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtn: { backgroundColor: '#4A90E2' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#EEF2F7' },
  secondaryBtnText: { color: '#212529', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212529', marginTop: 8, marginBottom: 10 },

  infoTable: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  infoRowSplit: {},
  infoCell: {},
  infoLabel: { fontSize: 12, color: '#6C757D', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#212529' },
});


