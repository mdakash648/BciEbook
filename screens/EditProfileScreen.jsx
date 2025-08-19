import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getAccountInstance } from '../services/appwriteService';
import { updateUserProfileInDatabase, getUserFromDatabase } from '../services/userService';
import { account } from '../lib/appwrite';

// Convert Appwrite E.164 phone (e.g., +8801812345678) to local BD format (e.g., 01812345678)
const phoneE164ToLocal = (input) => {
  const raw = (input || '').replace(/\s+/g, '');
  if (raw.startsWith('+880') && raw.length === 14) {
    return '0' + raw.slice(4);
  }
  if (raw.startsWith('+88') && raw.length === 13) {
    return '0' + raw.slice(3);
  }
  if (raw.startsWith('88') && raw.length === 13) {
    return '0' + raw.slice(2);
  }
  return raw; // fallback (may already be local 11 digits or empty)
};

// Convert local BD format (e.g., 01812345678) to E.164 for Appwrite (e.g., +8801812345678)
const phoneLocalToE164 = (input) => {
  const local = (input || '').replace(/\D/g, '');
  if (local.startsWith('0')) {
    return '+88' + local;
  }
  if (local.startsWith('88')) {
    return '+' + local;
  }
  if (local.startsWith('+88')) {
    return local;
  }
  return '+88' + local; // best effort
};

export default function EditProfileScreen({ navigation }) {
  const { user, checkUser } = useAuth();
  const { theme } = useTheme();
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(phoneE164ToLocal(user?.phone));
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update form fields when user data changes
  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(phoneE164ToLocal(user?.phone));
    setEditAddress(user?.address || '');
  }, [user]);

  // Load database data when component mounts
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        if (user?.id) {
          console.log('🔄 Loading database data for user:', user.id);
          const dbResult = await getUserFromDatabase(user.id);
          
          if (dbResult.success) {
            const dbUser = dbResult.user;
            console.log('✅ Database user data:', dbUser);
            
            // Update form fields with database data if available
            if (dbUser.FullName && !editName) {
              setEditName(dbUser.FullName);
            }
            if (dbUser.EmailAddress && !editEmail) {
              setEditEmail(dbUser.EmailAddress);
            }
            if (dbUser.PhoneNuber && !editPhone) {
              setEditPhone(phoneE164ToLocal(dbUser.PhoneNuber));
            }
            if (dbUser.Address && !editAddress) {
              setEditAddress(dbUser.Address);
            }
          } else {
            console.log('⚠️ No database data found for user');
          }
        }
      } catch (error) {
        console.error('❌ Error loading database data:', error);
      }
    };

    loadDatabaseData();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    const currentLocalPhone = phoneE164ToLocal(user?.phone);
    const hasNameChanged = editName.trim() !== (user?.name || '');
    const hasPhoneChanged = editPhone.trim() !== currentLocalPhone;
    const hasAddressChanged = editAddress.trim() !== (user?.address || '');
    if (hasPhoneChanged) {
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(editPhone.trim())) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid Bangladesh phone number (e.g., 01812345678)');
        return;
      }
    }
    if (hasPhoneChanged && !password.trim()) {
      Alert.alert('Password Required', 'Please enter your password to update phone number');
      return;
    }
    if (!hasNameChanged && !hasPhoneChanged && !hasAddressChanged) {
      Alert.alert('No Changes', 'No changes detected to save');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const accountInstance = getAccountInstance();
      if (accountInstance) {
        let updateCount = 0;
        let databaseUpdateData = {};
        
        // Step 1: Update Appwrite Auth
        if (hasNameChanged) {
          await accountInstance.updateName(editName.trim());
          updateCount++;
          databaseUpdateData.FullName = editName.trim();
        }
        if (hasPhoneChanged) {
          try {
            const fullPhoneNumber = phoneLocalToE164(editPhone.trim());
            await accountInstance.updatePhone(fullPhoneNumber, password);
            updateCount++;
            databaseUpdateData.PhoneNuber = fullPhoneNumber;
          } catch (phoneError) {
            Alert.alert('Phone Update Failed', phoneError.message || 'Failed to update phone number. Please check your password.');
            setIsUpdatingProfile(false);
            return;
          }
        }
        if (hasAddressChanged) {
          try {
            const currentPrefs = await accountInstance.getPrefs();
            const updatedPrefs = {
              ...currentPrefs,
              address: editAddress.trim()
            };
            await accountInstance.updatePrefs(updatedPrefs);
            updateCount++;
            databaseUpdateData.Address = editAddress.trim();
          } catch (addressError) {
            Alert.alert('Address Update Failed', addressError.message || 'Failed to update address.');
            setIsUpdatingProfile(false);
            return;
          }
        }
        
        // Step 2: Update Database
        if (updateCount > 0 && Object.keys(databaseUpdateData).length > 0) {
          try {
            console.log('🔄 Updating database with profile changes...');
            const currentUser = await account.get();
            const databaseResult = await updateUserProfileInDatabase(
              currentUser.$id,
              databaseUpdateData
            );
            
            if (!databaseResult.success) {
              console.warn('⚠️ Database update failed:', databaseResult.error);
              // Don't fail the entire operation, just log the warning
              // The Auth update was successful, so we can still show success
            } else {
              console.log('✅ Database updated successfully');
            }
          } catch (dbError) {
            console.error('❌ Database update error:', dbError);
            // Don't fail the entire operation, just log the error
          }
        }
        
        // Step 3: Refresh user data and show success
        await checkUser();
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        Alert.alert('Error', 'Unable to update profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancel = () => {
    if (editName !== user?.name || editEmail !== user?.email || editPhone !== user?.phone || editAddress !== user?.address || password.trim()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSaveProfile}
          disabled={isUpdatingProfile}
          style={[styles.saveButton, isUpdatingProfile && styles.saveButtonDisabled]}
        >
          <Text style={[styles.saveButtonText, isUpdatingProfile && styles.saveButtonTextDisabled]}>
            {isUpdatingProfile ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={[styles.formSection, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textMuted}
                value={editName}
                onChangeText={setEditName}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email address"
                placeholderTextColor={theme.textMuted}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
                editable={false}
              />
            </View>
            <Text style={[styles.disabledText, { color: theme.textMuted }]}>Email address cannot be changed</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
            <Text style={[styles.inputDescription, { color: theme.textSecondary }]}>Please enter Bangladesh phone number (11 digits, e.g., 01812345678)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="call-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="For example: 01812345678"
                placeholderTextColor={theme.textMuted}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={11}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Address</Text>
            <Text style={[styles.inputDescription, { color: theme.textSecondary }]}>Enter your full address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, { color: theme.text }]}
                placeholder="Enter your full address"
                placeholderTextColor={theme.textMuted}
                value={editAddress}
                onChangeText={setEditAddress}
                multiline={true}
                numberOfLines={3}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={200}
              />
            </View>
          </View>
          {editPhone.trim() !== phoneE164ToLocal(user?.phone) && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <Text style={[styles.inputDescription, { color: theme.textSecondary }]}>Enter your password to update phone number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icon name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Icon 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveActionButton, isUpdatingProfile && styles.saveActionButtonDisabled]} 
            onPress={handleSaveProfile}
            disabled={isUpdatingProfile}
          >
            <Icon name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelActionButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={handleCancel}
            disabled={isUpdatingProfile}
          >
            <Icon name="close" size={20} color={theme.textSecondary} />
            <Text style={[styles.cancelActionButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  saveButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disabledText: {
    fontSize: 12,
    color: '#ADB5BD',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveActionButton: {
    backgroundColor: '#4A90E2',
  },
  saveActionButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelActionButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cancelActionButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },

});
