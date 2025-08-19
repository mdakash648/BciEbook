import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import { CONFIG } from '../constants/Config';
import {
  loadPublicData,
  savePrivacyPolicyData,
  saveAboutData,
} from '../services/demoPolicyService';
import { uploadBook } from '../services/bookUploadService';
import {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import { account, storage } from '../lib/appwrite';
import { useTheme } from '../context/ThemeContext';
// Database features removed

const withCacheBust = url => {
  const seed = globalThis.__APP_LOGO_CB__ || Date.now();
  return `${url}${url.includes('?') ? '&' : '?'}cb=${seed}`;
};

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
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
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
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
  // Category edit/delete states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [categoryUpdating, setCategoryUpdating] = useState(false);

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
        const headers = {
          'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
          'X-Appwrite-JWT': jwt,
        };
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
        const res = await RNFS.downloadFile({
          fromUrl: previewUrl,
          headers,
          toFile: destPath,
        }).promise;
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
      Alert.alert(
        'Error',
        'Could not save privacy policy to database. Please try again.',
      );
    } finally {
      setSavingPrivacy(false);
    }
  };

  const saveAbout = async () => {
    try {
      setSavingAbout(true);
      await saveAboutData(aboutText);
      setIsEditingAbout(false);
      Alert.alert('Saved', 'About text saved to database.');
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setSavingAbout(false);
    }
  };

  useEffect(() => {
    loadCurrentLogo();
    loadPrivacyPolicy();
    loadCategories();
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = e => setKeyboardInset(e?.endCoordinates?.height || 0);
    const onHide = () => setKeyboardInset(0);
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      try {
        showSub.remove();
      } catch (_) {}
      try {
        hideSub.remove();
      } catch (_) {}
    };
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

  const openEditCategory = category => {
    setEditingCategory(category);
    setEditCategoryName(category.CategorieName);
    setEditModalVisible(true);
  };

  const closeEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName('');
    setEditModalVisible(false);
  };

  const updateCategoryHandler = async () => {
    if (!editCategoryName.trim()) {
      Alert.alert('Category', 'Please enter a category name.');
      return;
    }
    try {
      setCategoryUpdating(true);
      await updateCategory({ id: editingCategory.$id, name: editCategoryName });
      await loadCategories();
      closeEditCategory();
      Alert.alert('Success', 'Category updated');
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setCategoryUpdating(false);
    }
  };

  const openDeleteCategory = category => {
    setDeletingCategory(category);
    setDeleteModalVisible(true);
  };

  const closeDeleteCategory = () => {
    setDeletingCategory(null);
    setDeleteModalVisible(false);
  };

  const deleteCategoryHandler = async () => {
    try {
      setCategoryUpdating(true);
      await deleteCategory(deletingCategory.$id);
      await loadCategories();
      closeDeleteCategory();
      Alert.alert('Success', 'Category deleted');
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setCategoryUpdating(false);
    }
  };

  const toggleCategorySelect = id => {
    setSelectedCategoryIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      const names = categories
        .filter(c => next.includes(c.$id))
        .map(c => c.CategorieName);
      setBookCategory(names.join(', '));
      return next;
    });
  };

  const pickImage = async () => {
    try {
      setPicking(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });
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
      const res = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });
      if (res.didCancel) return;
      const a = res.assets?.[0];
      if (!a) return;
      setCoverAsset({
        uri: a.uri,
        name: a.fileName || `cover-${Date.now()}.jpg`,
        type: a.type || 'image/jpeg',
      });
    } catch (e) {
      Alert.alert('Cover', 'Could not choose image');
    }
  };

  const pickPdf = async () => {
    try {
      console.log('Opening PDF picker...');

      const result = await pick({
        type: ['application/pdf'], // শুধু PDF allow করবে
        allowMultiSelection: false,
      });

      console.log('Picked file: ', result);

      if (result && result.length > 0) {
        const file = result[0];
        console.log('Selected PDF file:', file);

        setPdfAsset({
          uri: file.uri,
          name: file.name || `book-${Date.now()}.pdf`,
          type: 'application/pdf',
          size: file.size || 0,
        });
      }
    } catch (err) {
      if (err.code === 'DOCUMENTS_PICKER_CANCELED') {
        console.log('User canceled');
      } else {
        console.error('Picker error: ', err);
        Alert.alert(
          'PDF Selection Error',
          'Could not open document picker. Please try again.',
        );
      }
    }
  };

  const submitBook = async () => {
    if (!bookTitle.trim() || !coverAsset || !pdfAsset) {
      Alert.alert(
        'Missing info',
        'Please provide title, cover image, and PDF.',
      );
      return;
    }

    try {
      setBookUploading(true);

      // Verify authentication and session before upload
      try {
        console.log('Checking user authentication...');
        const user = await account.get();
        console.log('User authenticated:', user.email);

        // Also check if we have active sessions
        const sessions = await account.listSessions();
        if (!sessions.sessions || sessions.sessions.length === 0) {
          throw new Error('No active sessions found');
        }
        console.log('Active sessions found:', sessions.sessions.length);
      } catch (authError) {
        console.log('Auth check failed:', authError);
        throw new Error(
          'Authentication failed. Please logout and login again to continue uploading.',
        );
      }
      const selectedNames = categories
        .filter(c => selectedCategoryIds.includes(c.$id))
        .map(c => c.CategorieName);
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
      console.log('Book upload error:', e);
      const errorMessage = e?.message || String(e);

      if (
        errorMessage.includes('Authentication failed') ||
        errorMessage.includes('No active sessions')
      ) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please logout and login again to continue uploading books.',
        );
      } else if (
        errorMessage.includes('Network connection failed') ||
        errorMessage.includes('network')
      ) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
        );
      } else if (errorMessage.includes('Health check failed')) {
        Alert.alert(
          'Server Error',
          'The server is currently unavailable. Please try again later.',
        );
      } else if (
        errorMessage.includes('Please enter') ||
        errorMessage.includes('Please choose') ||
        errorMessage.includes('Please select')
      ) {
        Alert.alert('Validation Error', errorMessage);
      } else {
        Alert.alert(
          'Upload Failed',
          `An error occurred while uploading the book: ${errorMessage}`,
        );
      }
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
          throw new Error(
            delJson?.message ||
              `Failed to delete previous logo (HTTP ${delRes.status}). Ensure Delete permission is granted in bucket.`,
          );
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
      
      // Update global cache bust variable to trigger logo refresh in all screens
      globalThis.__APP_LOGO_CB__ = Date.now();
      
      Alert.alert('Success', `Logo uploaded. File ID: ${json?.$id || fileId}`);
    } catch (e) {
      const msg = e?.message || String(e);
      Alert.alert('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 20 + keyboardInset }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Branding</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={styles.logoRow}>
              <View style={styles.logoPreview}>
                {selected?.uri ? (
                  <Image
                    source={{ uri: selected.uri }}
                    style={styles.logoImage}
                  />
                ) : logoUri ? (
                  <Image
                    source={
                      logoHeaders
                        ? { uri: logoUri, headers: logoHeaders }
                        : { uri: logoUri }
                    }
                    style={styles.logoImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="image-outline" size={32} color={theme.textSecondary} />
                  </View>
                )}
              </View>

              <View style={styles.logoContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>App Logo</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                  PNG or JPG • Square recommended
                </Text>

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

                <Text style={[styles.helperNote, { color: theme.textSecondary }]}>
                  Bucket: {CONFIG.APPWRITE_BUCKET_ID}
                </Text>
                {logoError && (
                  <Text style={[styles.helperNote, { color: theme.error }]}>
                    {logoError}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy Policy Management</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={styles.privacyHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Privacy Policy</Text>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditingPrivacy(!isEditingPrivacy)}
                activeOpacity={0.8}
              >
                <Icon
                  name={isEditingPrivacy ? 'close-outline' : 'create-outline'}
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.buttonText, styles.editButtonText, { color: theme.primary }]}>
                  {isEditingPrivacy ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Manage your app's privacy policy content
            </Text>

            {/* Debug button removed */}

            {/* Database status removed */}

            {isEditingPrivacy ? (
              <View style={styles.textareaContainer}>
                <TextInput
                  style={[styles.textarea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                  value={privacyPolicy}
                  onChangeText={setPrivacyPolicy}
                  multiline
                  textAlignVertical="top"
                  placeholder="Enter your privacy policy content..."
                  placeholderTextColor={theme.textMuted}
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
              <View style={[styles.policyPreview, { backgroundColor: theme.surface }]}>
                <Text style={[styles.policyText, { color: theme.text }]} numberOfLines={6}>
                  {privacyPolicy}
                </Text>
                <TouchableOpacity
                  style={[styles.viewFullButton, { borderTopColor: theme.border }]}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  <Text style={[styles.viewFullText, { color: theme.primary }]}>View Full Policy</Text>
                  <Icon name="arrow-forward" size={16} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={styles.privacyHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>About</Text>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditingAbout(!isEditingAbout)}
                activeOpacity={0.8}
              >
                <Icon
                  name={isEditingAbout ? 'close-outline' : 'create-outline'}
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.buttonText, styles.editButtonText, { color: theme.primary }]}>
                  {isEditingAbout ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Add a short About text for your app
            </Text>

            {isEditingAbout ? (
              <View style={styles.textareaContainer}>
                <TextInput
                  style={[styles.textarea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                  value={aboutText}
                  onChangeText={setAboutText}
                  multiline
                  textAlignVertical="top"
                  placeholder="Enter about text..."
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={saveAbout}
                  disabled={savingAbout}
                  activeOpacity={0.8}
                >
                  <Icon name="save-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {savingAbout ? 'Saving…' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              !!aboutText && (
                <View style={[styles.policyPreview, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.policyText, { color: theme.text }]} numberOfLines={2}>
                    {aboutText}
                  </Text>
                  <TouchableOpacity
                    style={[styles.viewFullButton, { borderTopColor: theme.border }]}
                    onPress={() => setAboutModalVisible(true)}
                  >
                    <Text style={[styles.viewFullText, { color: theme.primary }]}>View Full About</Text>
                    <Icon name="arrow-forward" size={16} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>

        {/* New Book Upload */}
        {/* Categories Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Categories</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Create and view categories</Text>
            <View style={styles.textareaContainer}>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Category name"
                placeholderTextColor={theme.textMuted}
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
              <Text style={[styles.cardTitle, { marginBottom: 8, color: theme.text }]}>
                Existing
              </Text>
              {categoryLoading ? (
                <Text style={[styles.helperNote, { color: theme.textSecondary }]}>Loading…</Text>
              ) : categories.length === 0 ? (
                <Text style={[styles.helperNote, { color: theme.textSecondary }]}>No categories yet.</Text>
              ) : (
                categories.map(c => (
                  <View
                    key={c.$id}
                    style={{
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ fontWeight: '600', color: theme.text, flex: 1 }}
                    >
                      {c.CategorieName}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => openEditCategory(c)}
                        style={{
                          padding: 4,
                          borderRadius: 6,
                          backgroundColor: theme.primary + '15',
                        }}
                        activeOpacity={0.7}
                      >
                        <Icon name="create-outline" size={16} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openDeleteCategory(c)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          backgroundColor: theme.isDarkMode ? '#8B0000' : '#FF4444',
                        }}
                        activeOpacity={0.7}
                      >
                        <Icon name="trash-outline" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* New Book Upload */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Upload New Book (PDF)</Text>
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Provide book details and files
            </Text>
            <View style={styles.textareaContainer}>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Book title"
                placeholderTextColor={theme.textMuted}
                value={bookTitle}
                onChangeText={setBookTitle}
              />
              <TextInput
                style={[styles.input, { marginTop: 8, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Author"
                placeholderTextColor={theme.textMuted}
                value={bookAuthor}
                onChangeText={setBookAuthor}
              />
              <TextInput
                style={[styles.input, { marginTop: 8, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Edition"
                placeholderTextColor={theme.textMuted}
                value={bookEdition}
                onChangeText={setBookEdition}
              />
              <TextInput
                style={[styles.input, { marginTop: 8, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Pages"
                placeholderTextColor={theme.textMuted}
                value={bookPages}
                onChangeText={setBookPages}
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, { marginTop: 8, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Language"
                placeholderTextColor={theme.textMuted}
                value={bookLanguage}
                onChangeText={setBookLanguage}
              />
              <TextInput
                style={[styles.input, { marginTop: 8, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Publisher"
                placeholderTextColor={theme.textMuted}
                value={bookPublisher}
                onChangeText={setBookPublisher}
              />
              <TextInput
                style={[styles.input, { marginTop: 8, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Country"
                placeholderTextColor={theme.textMuted}
                value={bookCountry}
                onChangeText={setBookCountry}
              />
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.cardSubtitle, { marginBottom: 6, color: theme.textSecondary }]}>
                  Select categories
                </Text>
                {categoryLoading ? (
                  <Text style={[styles.helperNote, { color: theme.textSecondary }]}>Loading categories…</Text>
                ) : categories.length === 0 ? (
                  <Text style={[styles.helperNote, { color: theme.textSecondary }]}>
                    No categories yet. Create some above.
                  </Text>
                ) : (
                  <View
                    style={{ borderTopWidth: 1, borderTopColor: theme.border }}
                  >
                    {categories.map(c => {
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
                            borderBottomColor: theme.border,
                            gap: 10,
                          }}
                        >
                          <Icon
                            name={
                              checked ? 'checkbox-outline' : 'square-outline'
                            }
                            size={20}
                            color={checked ? theme.primary : theme.textSecondary}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{ color: theme.text, fontWeight: '600' }}
                            >
                              {c.CategorieName}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {selectedCategoryIds.length > 0 && (
                  <Text style={[styles.helperNote, { marginTop: 8, color: theme.textSecondary }]}>
                    Selected: {bookCategory}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={pickCover}
                  activeOpacity={0.8}
                >
                  <Icon name="image-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    {coverAsset ? 'Change Cover' : 'Choose Cover'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={pickPdf}
                  activeOpacity={0.8}
                >
                  <Icon name="document-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    {pdfAsset ? 'Change PDF' : 'Select PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
              {coverAsset && (
                <Text style={[styles.helperNote, { color: theme.textSecondary }]}>Cover: {coverAsset.name}</Text>
              )}
              {pdfAsset && (
                <Text style={[styles.helperNote, { color: theme.textSecondary }]}>PDF: {pdfAsset.name}</Text>
              )}
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
      {/* About Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>About</Text>
              <TouchableOpacity
                onPress={() => setAboutModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={true}
            >
              <Text style={[styles.modalBodyText, { color: theme.text }]}>{aboutText}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={closeEditCategory}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Category</Text>
              <TouchableOpacity
                onPress={closeEditCategory}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.textareaContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { marginTop: 0, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                placeholder="Category name"
                placeholderTextColor={theme.textMuted}
                value={editCategoryName}
                onChangeText={setEditCategoryName}
                autoFocus={true}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.button, styles.editButton, { flex: 1, backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={closeEditCategory}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.editButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  { flex: 1, marginTop: 0 },
                ]}
                onPress={updateCategoryHandler}
                disabled={categoryUpdating}
                activeOpacity={0.8}
              >
                <Icon name="save-outline" size={18} color="#fff" />
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {categoryUpdating ? 'Saving…' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Category Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={closeDeleteCategory}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Category</Text>
              <TouchableOpacity
                onPress={closeDeleteCategory}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalBodyText, { color: theme.text }]}>
              Are you sure you want to delete "{deletingCategory?.CategorieName}
              "? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.button, styles.editButton, { flex: 1, backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={closeDeleteCategory}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.editButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.error, flex: 1 }]}
                onPress={deleteCategoryHandler}
                disabled={categoryUpdating}
                activeOpacity={0.8}
              >
                <Icon name="trash-outline" size={18} color="#fff" />
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  {categoryUpdating ? 'Deleting…' : 'Delete'}
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
  container: {
    flex: 1,
  },
  scrollView: {
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
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: { width: 32 },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoPreview: {
    width: 84,
    height: 84,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { fontSize: 14, fontWeight: '600' },
  primaryButton: { backgroundColor: '#4A90E2' },
  primaryButtonText: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: '#4A90E2',
    marginTop: 10,
    justifyContent: 'center',
  },
  saveButtonText: { color: '#FFFFFF' },
  helperNote: { marginTop: 8, fontSize: 12 },
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
    fontSize: 14,
    fontWeight: '600',
  },
  textareaContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  textarea: {
    minHeight: 100,
    fontSize: 14,
    padding: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  policyPreview: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  viewFullText: {
    fontSize: 14,
    marginRight: 5,
  },
  // New styles for Database Status
  databaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  databaseStatusContent: {
    flex: 1,
    marginLeft: 8,
  },
  databaseStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  databaseStatusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalCloseBtn: { padding: 4 },
  modalBodyText: { fontSize: 14, lineHeight: 20 },
});
