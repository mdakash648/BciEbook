import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import { CONFIG } from '../constants/Config';
import { account } from '../lib/appwrite';

const withCacheBust = (url) => {
  const seed = globalThis.__APP_LOGO_CB__ || Date.now();
  return `${url}${url.includes('?') ? '&' : '?'}cb=${seed}`;
};

export default function DashboardScreen() {
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [logoHeaders, setLogoHeaders] = useState(null); // optional headers for remote rendering
  const [logoFilePath, setLogoFilePath] = useState(null);
  const [logoError, setLogoError] = useState(null);

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

  useEffect(() => {
    loadCurrentLogo();
  }, []);

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
          <Text style={styles.headerTitle}>Dashboard</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#212529' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#495057', marginBottom: 12, marginHorizontal: 20 },
  card: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3.84, elevation: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoPreview: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#F1F3F5', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
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
});

