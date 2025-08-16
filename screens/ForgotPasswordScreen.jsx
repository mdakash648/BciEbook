import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CONFIG } from '../constants/Config';
import { account } from '../lib/appwrite';

const PLACEHOLDER_COLOR = '#9CA3AF';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = (email || '').trim();

    if (!trimmedEmail) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const sdkUrl = `${CONFIG.PASSWORD_RESET_SDK_URL}?projectId=${encodeURIComponent(CONFIG.APPWRITE_PROJECT_ID)}`;
      await account.createRecovery(trimmedEmail, sdkUrl);
      Alert.alert(
        'Reset link sent',
        `If an account exists for ${trimmedEmail}, a password reset link has been sent.`
      );
    } catch (error) {
      const message = error?.message || 'Failed to send reset link. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#4A90E2" />
            </TouchableOpacity>
            <Ionicons name="lock-open-outline" size={80} color="#4A90E2" />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email address and we'll send you a reset link.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                maxLength={100}
              />
            </View>

            <TouchableOpacity style={[styles.resetButton, loading && styles.resetButtonDisabled]} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.resetButtonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.signInButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
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
  backButton: { position: 'absolute', top: 0, left: 0, padding: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#212529', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6C757D', textAlign: 'center', lineHeight: 24 },
  form: { marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 16, color: '#212529' },
  resetButton: {
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
  resetButtonDisabled: { backgroundColor: '#ADB5BD' },
  resetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  signInButtonText: { color: '#4A90E2', fontSize: 16, fontWeight: '600' },
});


