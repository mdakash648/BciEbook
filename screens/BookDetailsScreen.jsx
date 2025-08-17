import React, { useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Linking, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { deleteBook, updateBookWithFiles } from '../services/bookService';
import * as DocumentPicker from 'react-native-document-picker';

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

  const { user } = useContext(AuthContext);
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);
  const [updating, setUpdating] = useState(false);
  
  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [title, setTitle] = useState(book.title || '');
  const [category, setCategory] = useState(book.category || '');
  const [author, setAuthor] = useState(book.author || '');
  const [edition, setEdition] = useState(book.edition || '');
  const [pages, setPages] = useState(String(book.pages ?? ''));
  const [language, setLanguage] = useState(book.language || '');
  const [publisher, setPublisher] = useState(book.publisher || '');
  const [country, setCountry] = useState(book.country || '');

  const info = [
    { label: 'Name', value: title },
    { label: 'Category', value: category },
    { label: 'Author', value: author },
    { label: 'Edition', value: edition },
    { label: 'Pages', value: String(pages) },
    { label: 'Language', value: language },
    { label: 'Publisher', value: publisher },
    { label: 'Country', value: country },
  ];

  const openPdf = async () => {
    const url = book?.pdfUrl || book?.pdfFileId || '';
    if (!url) {
      Alert.alert('PDF', 'No PDF available for this book.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('PDF', 'Cannot open the PDF link on this device.');
      }
    } catch (e) {
      Alert.alert('PDF', e?.message || 'Failed to open PDF');
    }
  };
  const openEditModal = () => {
    // Reset form values to current book data
    setTitle(book.title || '');
    setCategory(book.category || '');
    setAuthor(book.author || '');
    setEdition(book.edition || '');
    setPages(String(book.pages ?? ''));
    setLanguage(book.language || '');
    setPublisher(book.publisher || '');
    setCountry(book.country || '');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
  };

  const saveInfo = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }
    try {
      setUpdating(true);
      const doc = book.raw || { $id: book.id, coverFileId: book.cover, pdfFileId: book.pdfUrl };
      await updateBookWithFiles(doc, {
        title,
        category,
        author,
        edition,
        pages,
        language,
        publisher,
        country,
      });
      closeEditModal();
      Alert.alert('Saved', 'Book information updated successfully');
      // Update the book object to reflect changes
      Object.assign(book, {
        title,
        category,
        author,
        edition,
        pages: Number(pages) || 0,
        language,
        publisher,
        country,
      });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };


  const confirmDelete = () => {
    Alert.alert('Delete Book', 'Are you sure you want to delete this book?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBook(book.raw || { $id: book.id, coverFileId: book.pdfUrl ? book.cover : book.coverFileId, pdfFileId: book.pdfUrl || book.pdfFileId });
            Alert.alert('Deleted', 'Book removed');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const pickNewFile = async (type) => {
    if (type === 'cover') {
      try {
        const res = await DocumentPicker.pickSingle({ type: DocumentPicker.types.images });
        return { uri: res.uri, name: res.name, type: res.type };
      } catch (e) { if (!DocumentPicker.isCancel(e)) Alert.alert('Cover', 'Could not choose image'); }
    } else {
      try {
        const res = await DocumentPicker.pickSingle({ type: DocumentPicker.types.pdf });
        return { uri: res.uri, name: res.name, type: res.type };
      } catch (e) { if (!DocumentPicker.isCancel(e)) Alert.alert('PDF', 'Could not choose file'); }
    }
    return null;
  };

  const replaceFile = async (kind) => {
    const file = await pickNewFile(kind === 'cover' ? 'cover' : 'pdf');
    if (!file) return;
    try {
      setUpdating(true);
      const data = { title: book.title };
      const opts = kind === 'cover' ? { coverFile: file } : { pdfFile: file };
      const doc = book.raw || { $id: book.id, coverFileId: book.cover, pdfFileId: book.pdfUrl };
      await updateBookWithFiles(doc, data, opts);
      Alert.alert('Updated', `${kind === 'cover' ? 'Cover' : 'PDF'} replaced`);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

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
          <Text style={styles.desc}>{book.description || ''}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={openPdf}>
              <Text style={styles.primaryBtnText}>Open & Read</Text>
            </TouchableOpacity>
            {isAdmin ? (
              <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={confirmDelete} disabled={updating}>
                <Text style={styles.dangerBtnText}>{updating ? 'Working…' : 'Delete Book'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]}> 
                <Text style={styles.secondaryBtnText}>Add to Favorites</Text>
              </TouchableOpacity>
            )}
          </View>

          {isAdmin && (
            <View style={[styles.actionsRow, { marginTop: 0 }]}>
              <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => replaceFile('cover')} disabled={updating}>
                <Text style={styles.secondaryBtnText}>Replace Cover</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => replaceFile('pdf')} disabled={updating}>
                <Text style={styles.secondaryBtnText}>Replace PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          {isAdmin && (
            <TouchableOpacity style={styles.modernEditBtn} onPress={openEditModal} activeOpacity={0.8}>
              <View style={styles.editBtnIconContainer}>
                <Icon name="create-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.editBtnTextContainer}>
                <Text style={styles.modernEditBtnTitle}>Edit Information</Text>
                <Text style={styles.modernEditBtnSubtitle}>Modify book details</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#4A90E2" />
            </TouchableOpacity>
          )}

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

      {/* Edit Book Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Book Information</Text>
              <TouchableOpacity onPress={closeEditModal} style={styles.modalCloseBtn}>
                <Icon name="close" size={20} color="#212529" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter book title"
                    placeholderTextColor="#6C757D"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Author</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter author name"
                    placeholderTextColor="#6C757D"
                    value={author}
                    onChangeText={setAuthor}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter category"
                    placeholderTextColor="#6C757D"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Edition</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter edition"
                    placeholderTextColor="#6C757D"
                    value={edition}
                    onChangeText={setEdition}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pages</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter number of pages"
                    placeholderTextColor="#6C757D"
                    value={pages}
                    onChangeText={setPages}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Language</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter language"
                    placeholderTextColor="#6C757D"
                    value={language}
                    onChangeText={setLanguage}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Publisher</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter publisher"
                    placeholderTextColor="#6C757D"
                    value={publisher}
                    onChangeText={setPublisher}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter country"
                    placeholderTextColor="#6C757D"
                    value={country}
                    onChangeText={setCountry}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeEditModal}
                disabled={updating}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={saveInfo}
                disabled={updating}
                activeOpacity={0.8}
              >
                <Icon name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {updating ? 'Saving…' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dangerBtn: { backgroundColor: '#FDECEC' },
  dangerBtnText: { color: '#D7263D', fontWeight: '700' },
  editBtn: { backgroundColor: '#E3F2FD', flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtnText: { color: '#4A90E2', fontWeight: '700' },
  
  // Modern Edit Button Styles
  modernEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginVertical: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  editBtnIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  editBtnTextContainer: {
    flex: 1,
  },
  modernEditBtnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  modernEditBtnSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '400',
  },

  form: { gap: 12 },
  inputGroup: { marginBottom: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#212529', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

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

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#212529' },
  modalCloseBtn: { padding: 4 },
  modalBody: {
    maxHeight: 400,
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  cancelBtn: { backgroundColor: '#E9ECEF' },
  cancelBtnText: { color: '#495057', fontWeight: '600' },
  saveBtn: { backgroundColor: '#4A90E2' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
});


