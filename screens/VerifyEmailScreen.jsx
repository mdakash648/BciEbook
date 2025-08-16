import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { account } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailScreen({ navigation }) {
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { user, checkUser, logout } = useAuth();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => timer && clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setSending(true);
      // Appwrite requires a redirect URL where the user is sent to complete verification
      const redirectUrl = CONFIG.VERIFICATION_BRIDGE_URL;
      await account.createVerification(redirectUrl);
      Alert.alert('Verification sent', 'We have emailed you a verification link. Please check your inbox.');
      setCooldown(60);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  // Auto-send verification email once when screen opens
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (!autoSentRef.current) {
      autoSentRef.current = true;
      // Fire and forget; internal guards prevent duplicates
      handleResend();
    }
  }, [handleResend]);
  
  const handleRefresh = async () => {
    try {
      await checkUser();
      const current = await account.get();
      if (current?.emailVerification) {
        // Switch to main app once verified
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Root navigator will switch to Auth automatically
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="mail-unread-outline" size={80} color="#4A90E2" />
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              Please verify your email address to continue. Check your inbox for a message with a verification link.
            </Text>
            {!!user?.email && (
              <Text style={styles.signedInText}>Signed in as {user.email}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, (sending || cooldown > 0) && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={sending || cooldown > 0}
          >
            <Text style={styles.buttonText}>
              {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          <TouchableOpacity style={styles.secondaryButton} onPress={handleRefresh}>
            <Text style={styles.secondaryButtonText}>I've verified, refresh</Text>
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#212529', marginTop: 20, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6C757D', textAlign: 'center', lineHeight: 24 },
  signedInText: { fontSize: 14, color: '#6C757D', marginTop: 10, textAlign: 'center' },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: { backgroundColor: '#ADB5BD' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: { color: '#4A90E2', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC3545',
  },
  logoutButtonText: { color: '#DC3545', fontSize: 16, fontWeight: '600' },
});


