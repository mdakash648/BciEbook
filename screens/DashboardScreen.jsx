import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ID } from 'appwrite';
import { Buffer } from 'buffer';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { CONFIG } from '../constants/Config';
import { databases, storage } from '../lib/appwrite';

export default function DashboardScreen() {
  const [selectedLogoUri, setSelectedLogoUri] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debugMessages, setDebugMessages] = useState([]);

  const inferMimeType = (uri) => {
    const lower = (uri || '').toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic')) return 'image/heic';
    return 'image/*';
  };

  const ensureFileName = (uriOrName, fallbackPrefix, mime) => {
    const raw = (uriOrName || '').split('/').pop();
    if (raw && raw.includes('.')) return raw;
    const ext = mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : mime === 'image/heic' ? 'heic' : 'img';
    return `${fallbackPrefix}.${ext}`;
  };

  const pickImage = async () => {
    try {
      setIsPicking(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        selectionLimit: 1,
      });

      if (result.didCancel) return;
      const asset = result.assets && result.assets[0];
      if (!asset) return;

      const rawUri = asset.uri;
      const mime = asset.type || inferMimeType(rawUri);
      const name = ensureFileName(asset.fileName || rawUri, `image-${Date.now()}`, mime);
      const size = asset.fileSize;

      setSelectedLogoUri(rawUri);
      setSelectedFile({ uri: rawUri, name, type: mime, size });

      setDebugMessages((prev) => [
        ...prev,
        `Picked -> uri: ${rawUri}`,
        `Picked -> name: ${name}`,
        `Picked -> type: ${mime}`,
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to open image picker.');
    } finally {
      setIsPicking(false);
    }
  };

  const uploadToStorage = async () => {
    if (!selectedFile) return null;
    if (!storage) return null;

    try {
      setIsUploading(true);
      setDebugMessages((prev) => [
        ...prev,
        `Uploading -> name: ${selectedFile.name}, type: ${selectedFile.type}`,
        `Uploading -> uri: ${selectedFile.uri}`,
      ]);

      // Read as base64 using react-native-fs
      const base64Data = await RNFS.readFile(selectedFile.uri, 'base64');
      const byteArray = Buffer.from(base64Data, 'base64');
      const blob = new Blob([byteArray], { type: selectedFile.type });

      setDebugMessages((prev) => [
        ...prev,
        `Base64 length: ${base64Data.length}`,
        `ByteArray length: ${byteArray.length}`,
      ]);

      const created = await storage.createFile(
        CONFIG.APPWRITE_BUCKET_ID,
        ID.unique(),
        blob
      );

      setDebugMessages((prev) => [
        ...prev,
        `Upload success -> id: ${created.$id}`,
      ]);
      return created.$id;
    } catch (e) {
      console.error('Upload error:', e);
      setDebugMessages((prev) => [
        ...prev,
        `Upload error: ${e?.message || String(e)}`,
      ]);
      Alert.alert('Upload failed', e?.message || 'Could not upload image.');
      return null;
    } finally {
      setIsUploading(false);
      setDebugMessages((prev) => [...prev, 'Upload finished']);
    }
  };

  const saveLogoRecord = async (fileId) => {
    if (!databases) {
      Alert.alert('Saved to Storage', `File uploaded (ID: ${fileId}). Database is not configured.`);
      return;
    }
    if (!CONFIG.APPWRITE_DATABASE_ID || !CONFIG.APPWRITE_COLLECTION_ID) {
      Alert.alert('Saved to Storage', `File uploaded (ID: ${fileId}). Add database and collection IDs in constants/Config.js to save a record.`);
      return;
    }
    try {
      setIsSaving(true);
      await databases.createDocument(
        CONFIG.APPWRITE_DATABASE_ID,
        CONFIG.APPWRITE_COLLECTION_ID,
        ID.unique(),
        {
          type: 'app_logo',
          fileId,
          createdAt: new Date().toISOString(),
        }
      );
      Alert.alert('Success', 'Logo uploaded and saved.');
      setSelectedLogoUri(null);
    } catch (e) {
      try {
        const list = await databases.listDocuments(
          CONFIG.APPWRITE_DATABASE_ID,
          CONFIG.APPWRITE_COLLECTION_ID
        );
        if (list.documents.length > 0) {
          const first = list.documents[0];
          await databases.updateDocument(
            CONFIG.APPWRITE_DATABASE_ID,
            CONFIG.APPWRITE_COLLECTION_ID,
            first.$id,
            { fileId, updatedAt: new Date().toISOString() }
          );
          Alert.alert('Success', 'Logo updated.');
          setSelectedLogoUri(null);
          return;
        }
        throw e;
      } catch (err) {
        console.error('Database save error:', err);
        Alert.alert('Database error', err?.message || 'Could not save record.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const fileId = await uploadToStorage();
    if (fileId) {
      await saveLogoRecord(fileId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branding</Text>
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <View style={styles.logoPreview}>
                {selectedLogoUri ? (
                  <Image source={{ uri: selectedLogoUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Icon name="image-outline" size={32} color="#6C757D" />
                  </View>
                )}
              </View>
              <View style={styles.logoContent}>
                <Text style={styles.cardTitle}>App Logo</Text>
                <Text style={styles.cardSubtitle}>PNG • 1:1 • Transparent background recommended</Text>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={pickImage}
                  disabled={isPicking || isUploading || isSaving}
                  activeOpacity={0.8}
                >
                  <Icon name="image-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    {isPicking ? 'Opening...' : 'Choose Image'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={!selectedFile || isUploading || isSaving}
                  activeOpacity={0.8}
                >
                  <Icon name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {isUploading || isSaving ? 'Saving...' : 'Save Logo'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.helperNote}>Bucket: {CONFIG.APPWRITE_BUCKET_ID}</Text>

                {debugMessages.length > 0 && (
                  <View style={styles.debugContainer}>
                    <Text style={styles.debugTitle}>Debug</Text>
                    {debugMessages.slice(-15).map((m, idx) => (
                      <Text key={`dbg-${idx}`} style={styles.debugText}>{m}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: { 
    flex: 1 
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#212529' 
  },
  section: { 
    marginTop: 20 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#495057', 
    marginBottom: 12, 
    marginHorizontal: 20 
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 3.84, 
    elevation: 4,
  },
  logoRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoPreview: {
    width: 84, 
    height: 84, 
    borderRadius: 42, 
    backgroundColor: '#F1F3F5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16, 
    overflow: 'hidden',
  },
  logoImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContent: { 
    flex: 1 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#212529' 
  },
  cardSubtitle: { 
    fontSize: 13, 
    color: '#6C757D', 
    marginTop: 4, 
    marginBottom: 12 
  },
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  buttonText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  primaryButton: { 
    backgroundColor: '#4A90E2' 
  },
  primaryButtonText: { 
    color: '#FFFFFF' 
  },
  saveButton: { 
    backgroundColor: '#4A90E2', 
    marginTop: 10, 
    justifyContent: 'center' 
  },
  saveButtonText: { 
    color: '#FFFFFF' 
  },
  helperNote: { 
    marginTop: 8, 
    fontSize: 12, 
    color: '#6C757D' 
  },
  debugContainer: {
    marginTop: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
  },
  debugTitle: {
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  debugText: {
    fontSize: 11,
    color: '#6C757D',
  },
});
