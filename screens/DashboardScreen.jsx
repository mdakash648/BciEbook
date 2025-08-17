import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import { CONFIG } from '../constants/Config';
import { loadPublicData, savePrivacyPolicyData, saveAboutData } from '../services/demoPolicyService';
import { uploadBook } from '../services/bookUploadService';
import { createCategory, listCategories } from '../services/categoryService';
import DocumentPicker from 'react-native-document-picker';
import { account } from '../lib/appwrite';
// Database features removed

const withCacheBust = (url) => {
  const seed = globalThis.__APP_LOGO_CB__ || Date.now();
  return `${url}${url.includes('?') ? '&' : '?'}cb=${seed}`;
};

export default function DashboardScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [logoHeaders, setLogoHeaders] = useState(null); // optional headers for remote rendering
  const [logoFilePath, setLogoFilePath] = useState(null);
  const [logoError, setLogoError] = useState(null);
  
  // Privacy Policy states
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [policyMetadata, setPolicyMetadata] = useState(null);
  const [aboutText, setAboutText] = useState('');
  // New Book Upload states
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [bookEdition, setBookEdition] = useState('');
  const [bookPages, setBookPages] = useState('');
  const [bookLanguage, setBookLanguage] = useState('');
  const [bookPublisher, setBookPublisher] = useState('');
  const [bookCountry, setBookCountry] = useState('');
  const [coverAsset, setCoverAsset] = useState(null);
  const [pdfAsset, setPdfAsset] = useState(null);
  const [bookUploading, setBookUploading] = useState(false);
  // Categories
  const [categoryName, setCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const buildLogoPreviewUrl = () => {
    const base = `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${CONFIG.APPWRITE_BUCKET_ID}/files/app_logo/preview`;
    return withCacheBust(`${base}?width=256&height=256&quality=80`);
  };

  const loadCurrentLogo = async () => {
    setLogoError(null);
    try {
      const fallbackBase = CONFIG.APP_LOGO_FALLBACK_URL;
      const fallbackUrl = fallbackBase ? withCacheBust(fallbackBase) : null;
      // 1) Try fallback external/public URL first if provided
      if (fallbackUrl) {
        try {
          const ping = await fetch(fallbackUrl, { method: 'HEAD' });
        	  if (ping.ok) {
            setLogoUri(fallbackUrl);
            setLogoHeaders(null);
            return;
          }
        } catch (_) {}
      }

      const previewUrl = buildLogoPreviewUrl();

      // 2) Try public storage URL
      try {
        const r = await fetch(previewUrl);
        if (r.ok) {
          setLogoUri(previewUrl);
          setLogoHeaders(null);
          return;
        }
      } catch (_) {}

      // 3) Try with JWT headers
      try {
        const { jwt } = await account.createJWT();
        const headers = { 'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID, 'X-Appwrite-JWT': jwt };
        const r2 = await fetch(previewUrl, { headers });
        if (r2.ok) {
          setLogoUri(previewUrl);
          setLogoHeaders(headers);
          return;
        }
      } catch (_) {}

      // 4) Fallback: download to file and render file://
      try {
        const headers = { 'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID };
        try {
          const { jwt } = await account.createJWT();
          headers['X-Appwrite-JWT'] = jwt;
        } catch (_) {}
        const destPath = `${RNFS.CachesDirectoryPath}/app_logo_preview.jpg`;
        const res = await RNFS.downloadFile({ fromUrl: previewUrl, headers, toFile: destPath }).promise;
        if (res.statusCode !== 200) {
          const resp = await fetch(previewUrl, { headers });
          if (!resp.ok) throw new Error(`Preview HTTP ${resp.status}`);
          const ab = await resp.arrayBuffer();
          const base64 = Buffer.from(new Uint8Array(ab)).toString('base64');
          await RNFS.writeFile(destPath, base64, 'base64');
        }
        setLogoFilePath(destPath);
        setLogoUri('file://' + destPath);
        setLogoHeaders(null);
        return;
      } catch (e) {
        setLogoError('Logo not found. Upload a logo to see it here.');
      }
    } catch (_) {
      setLogoError('Unable to load logo.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const loadPrivacyPolicy = async () => {
    try {
      const data = await loadPublicData();
      setPrivacyPolicy(data.privacyPolicy || '');
      setAboutText(data.about || '');
    } catch (_) {
      setPrivacyPolicy('');
      setAboutText('');
    }
    setPolicyMetadata(null);
  };

  const savePrivacyPolicy = async () => {
    if (!privacyPolicy.trim()) {
      Alert.alert('Error', 'Privacy policy cannot be empty.');
      return;
    }

    try {
      setSavingPrivacy(true);
      
      await savePrivacyPolicyData(privacyPolicy);
      setIsEditingPrivacy(false);
      Alert.alert('Saved', 'Privacy policy saved to database.');
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      Alert.alert('Error', 'Could not save privacy policy to database. Please try again.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  useEffect(() => {
    loadCurrentLogo();
    loadPrivacyPolicy();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoryLoading(true);
      const docs = await listCategories();
      setCategories(Array.isArray(docs) ? docs : []);
    } catch (_) {
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Category', 'Please enter a category name.');
      return;
    }
    try {
      setCategorySaving(true);
      await createCategory({ name: categoryName });
      setCategoryName('');
      await loadCategories();
      Alert.alert('Success', 'Category created');
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setCategorySaving(false);
    }
  };

  const toggleCategorySelect = (id) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const names = categories
        .filter((c) => next.includes(c.$id))
        .map((c) => c.CategorieName);
      setBookCategory(names.join(', '));
      return next;
    });
  };

  const pickImage = async () => {
    try {
      setPicking(true);
      const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (result.didCancel) return;
      const asset = result.assets && result.assets[0];
      if (!asset) return;

      setSelected({
        uri: asset.uri,
        name: asset.fileName || `logo-${Date.now()}.jpg`,
        type: asset.type || 'image/*',
        size: asset.fileSize || 0,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    } finally {
      setPicking(false);
    }
  };

  const pickCover = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (res.didCancel) return;
      const a = res.assets?.[0];
      if (!a) return;
      setCoverAsset({ uri: a.uri, name: a.fileName || `cover-${Date.now()}.jpg`, type: a.type || 'image/jpeg' });
    } catch (e) {
      Alert.alert('Cover', 'Could not choose image');
    }
  };

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: DocumentPicker.types.pdf });
      setPdfAsset({ uri: res.uri, name: res.name || `book-${Date.now()}.pdf`, type: res.type || 'application/pdf' });
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) Alert.alert('PDF', 'Could not choose file');
    }
  };

  const submitBook = async () => {
    if (!bookTitle.trim() || !coverAsset || !pdfAsset) {
      Alert.alert('Missing info', 'Please provide title, cover image, and PDF.');
      return;
    }
    try {
      setBookUploading(true);
      const selectedNames = categories
        .filter((c) => selectedCategoryIds.includes(c.$id))
        .map((c) => c.CategorieName);
      const categoryString = selectedNames.join(', ');
      await uploadBook({
        title: bookTitle,
        author: bookAuthor,
        category: categoryString,
        edition: bookEdition,
        pages: bookPages,
        language: bookLanguage,
        publisher: bookPublisher,
        country: bookCountry,
        coverFile: coverAsset,
        pdfFile: pdfAsset,
      });
      setBookTitle('');
      setBookAuthor('');
      setBookCategory('');
      setBookEdition('');
      setBookPages('');
      setBookLanguage('');
      setBookPublisher('');
      setBookCountry('');
      setSelectedCategoryIds([]);
      setCoverAsset(null);
      setPdfAsset(null);
      Alert.alert('Success', 'Book uploaded successfully');
    } catch (e) {
      Alert.alert('Upload Failed', e?.message || String(e));
    } finally {
      setBookUploading(false);
    }
  };

  const upload = async () => {
    if (!selected) {
      Alert.alert('Select image', 'Please choose an image first.');
      return;
    }

    const fileId = 'app_logo';

    try {
      setUploading(true);

      const { jwt } = await account.createJWT();

      const postCreate = async () => {
        const formData = new FormData();
        formData.append('fileId', fileId);
        formData.append('file', {
          uri: selected.uri,
          name: selected.name,
          type: selected.type || 'application/octet-stream',
        });

        const createUrl = `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${CONFIG.APPWRITE_BUCKET_ID}/files`;
        const res = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
            'X-Appwrite-JWT': jwt,
            Accept: 'application/json',
          },
          body: formData,
        });
        const json = await res.json();
        return { res, json };
      };

      // Try create first
      let { res, json } = await postCreate();

      // If already exists, delete old and retry
      if (res.status === 409) {
        const deleteUrl = `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${CONFIG.APPWRITE_BUCKET_ID}/files/${fileId}`;
        const delRes = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
            'X-Appwrite-JWT': jwt,
            Accept: 'application/json',
          },
        });
        if (!delRes.ok) {
          const delJson = await delRes.json().catch(() => ({}));
          throw new Error(delJson?.message || `Failed to delete previous logo (HTTP ${delRes.status}). Ensure Delete permission is granted in bucket.`);
        }
        // Recreate
        const retry = await postCreate();
        res = retry.res;
        json = retry.json;
      }

      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      // Refresh logo from storage
      await loadCurrentLogo();
      Alert.alert('Success', `Logo uploaded. File ID: ${json?.$id || fileId}`);
    } catch (e) {
      const msg = e?.message || String(e);
      Alert.alert('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branding</Text>
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <View style={styles.logoPreview}>
                {selected?.uri ? (
                  <Image source={{ uri: selected.uri }} style={styles.logoImage} />
                ) : logoUri ? (
                  <Image source={logoHeaders ? { uri: logoUri, headers: logoHeaders } : { uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="image-outline" size={32} color="#6C757D" />
                  </View>
                )}
              </View>

              <View style={styles.logoContent}>
                <Text style={styles.cardTitle}>App Logo</Text>
                <Text style={styles.cardSubtitle}>PNG or JPG • Square recommended</Text>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={pickImage}
                  disabled={picking || uploading}
                  activeOpacity={0.8}
                >
                  <Icon name="image-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    {picking ? 'Opening…' : 'Choose Image'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={upload}
                  disabled={!selected || uploading}
                  activeOpacity={0.8}
                >
                  <Icon name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {uploading ? 'Uploading…' : 'Upload Logo'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.helperNote}>Bucket: {CONFIG.APPWRITE_BUCKET_ID}</Text>
                {logoError && <Text style={[styles.helperNote, { color: '#DC3545' }]}>{logoError}</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy Management</Text>
          <View style={styles.card}>
            <View style={styles.privacyHeader}>
              <Text style={styles.cardTitle}>Privacy Policy</Text>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditingPrivacy(!isEditingPrivacy)}
                activeOpacity={0.8}
              >
                <Icon name={isEditingPrivacy ? "close-outline" : "create-outline"} size={18} color="#4A90E2" />
                <Text style={[styles.buttonText, styles.editButtonText]}>
                  {isEditingPrivacy ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.cardSubtitle}>Manage your app's privacy policy content</Text>
            
            {/* Debug button removed */}
            
            {/* Database status removed */}
            
            {isEditingPrivacy ? (
              <View style={styles.textareaContainer}>
                <TextInput
                  style={styles.textarea}
                  value={privacyPolicy}
                  onChangeText={setPrivacyPolicy}
                  multiline
                  textAlignVertical="top"
                  placeholder="Enter your privacy policy content..."
                />
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={savePrivacyPolicy}
                  disabled={savingPrivacy}
                  activeOpacity={0.8}
                >
                  <Icon name="save-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {savingPrivacy ? 'Saving…' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.policyPreview}>
                <Text style={styles.policyText} numberOfLines={6}>
                  {privacyPolicy}
                </Text>
                <TouchableOpacity
                  style={styles.viewFullButton}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  <Text style={styles.viewFullText}>View Full Policy</Text>
                  <Icon name="arrow-forward" size={16} color="#4A90E2" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Add a short About text for your app</Text>
            <View style={styles.textareaContainer}>
              <TextInput
                style={styles.textarea}
                value={aboutText}
                onChangeText={setAboutText}
                multiline
                textAlignVertical="top"
                placeholder="Enter about text..."
              />
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={async () => {
                  try {
                    await saveAboutData(aboutText);
                    Alert.alert('Saved', 'About text saved to database.');
                  } catch (e) {
                    Alert.alert('Error', e?.message || String(e));
                  }
                }}
                activeOpacity={0.8}
              >
                <Icon name="save-outline" size={18} color="#fff" />
                <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* New Book Upload */}
        {/* Categories Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Create and view categories</Text>
            <View style={styles.textareaContainer}>
              <TextInput
                style={[styles.textarea, { minHeight: 44 }]}
                placeholder="Category name"
                value={categoryName}
                onChangeText={setCategoryName}
              />
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveCategory}
                disabled={categorySaving}
                activeOpacity={0.8}
              >
                <Icon name="add-circle-outline" size={18} color="#fff" />
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {categorySaving ? 'Saving…' : 'Create Category'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Existing</Text>
              {categoryLoading ? (
                <Text style={styles.helperNote}>Loading…</Text>
              ) : categories.length === 0 ? (
                <Text style={styles.helperNote}>No categories yet.</Text>
              ) : (
                categories.map((c) => (
                  <View key={c.$id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' }}>
                    <Text style={{ fontWeight: '600', color: '#212529' }}>{c.CategorieName}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* New Book Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload New Book (PDF)</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Provide book details and files</Text>
            <View style={styles.textareaContainer}>
              <TextInput
                style={styles.input}
                placeholder="Book title"
                placeholderTextColor="#6C757D"
                value={bookTitle}
                onChangeText={setBookTitle}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Author"
                placeholderTextColor="#6C757D"
                value={bookAuthor}
                onChangeText={setBookAuthor}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Edition"
                placeholderTextColor="#6C757D"
                value={bookEdition}
                onChangeText={setBookEdition}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Pages"
                placeholderTextColor="#6C757D"
                value={bookPages}
                onChangeText={setBookPages}
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Language"
                placeholderTextColor="#6C757D"
                value={bookLanguage}
                onChangeText={setBookLanguage}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Publisher"
                placeholderTextColor="#6C757D"
                value={bookPublisher}
                onChangeText={setBookPublisher}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Country"
                placeholderTextColor="#6C757D"
                value={bookCountry}
                onChangeText={setBookCountry}
              />
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.cardSubtitle, { marginBottom: 6 }]}>Select categories</Text>
                {categoryLoading ? (
                  <Text style={styles.helperNote}>Loading categories…</Text>
                ) : categories.length === 0 ? (
                  <Text style={styles.helperNote}>No categories yet. Create some above.</Text>
                ) : (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#E9ECEF' }}>
                    {categories.map((c) => {
                      const checked = selectedCategoryIds.includes(c.$id);
                      return (
                        <TouchableOpacity
                          key={c.$id}
                          onPress={() => toggleCategorySelect(c.$id)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#E9ECEF',
                            gap: 10,
                          }}
                        >
                          <Icon name={checked ? 'checkbox-outline' : 'square-outline'} size={20} color={checked ? '#4A90E2' : '#6C757D'} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#212529', fontWeight: '600' }}>{c.CategorieName}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {selectedCategoryIds.length > 0 && (
                  <Text style={[styles.helperNote, { marginTop: 8 }]}>Selected: {bookCategory}</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={pickCover} activeOpacity={0.8}>
                  <Icon name="image-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>{coverAsset ? 'Change Cover' : 'Choose Cover'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={pickPdf} activeOpacity={0.8}>
                  <Icon name="document-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>{pdfAsset ? 'Change PDF' : 'Choose PDF'}</Text>
                </TouchableOpacity>
              </View>
              {coverAsset && <Text style={styles.helperNote}>Cover: {coverAsset.name}</Text>}
              {pdfAsset && <Text style={styles.helperNote}>PDF: {pdfAsset.name}</Text>}
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={submitBook}
                disabled={bookUploading}
                activeOpacity={0.8}
              >
                <Icon name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {bookUploading ? 'Uploading…' : 'Upload Book'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E9ECEF' 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#212529', flex: 1, textAlign: 'center' },
  placeholder: { width: 32 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#495057', marginBottom: 12, marginHorizontal: 20 },
  card: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3.84, elevation: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoPreview: { width: 84, height: 84, borderRadius: 10, backgroundColor: '#F1F3F5', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  logoContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212529' },
  cardSubtitle: { fontSize: 13, color: '#6C757D', marginTop: 4, marginBottom: 12 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  buttonText: { fontSize: 14, fontWeight: '600' },
  primaryButton: { backgroundColor: '#4A90E2' },
  primaryButtonText: { color: '#FFFFFF' },
  saveButton: { backgroundColor: '#4A90E2', marginTop: 10, justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF' },
  helperNote: { marginTop: 8, fontSize: 12, color: '#6C757D' },
  debugButton: { backgroundColor: '#6C757D', marginTop: 8 },
  debugButtonText: { color: '#FFFFFF' },
  // New styles for Privacy Policy Management
  privacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  textareaContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    padding: 10,
  },
  textarea: {
    minHeight: 100,
    fontSize: 14,
    color: '#343A40',
    padding: 0,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#212529',
  },
  policyPreview: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  viewFullText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 5,
  },
  // New styles for Database Status
  databaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E9F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28A745',
  },
  databaseStatusContent: {
    flex: 1,
    marginLeft: 8,
  },
  databaseStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28A745',
  },
  databaseStatusSubtext: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
});

