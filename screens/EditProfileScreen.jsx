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
import { getAccountInstance } from '../services/appwriteService';

export default function EditProfileScreen({ navigation }) {
  const { user, checkUser } = useAuth();
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Update form fields when user data changes
  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditAddress(user?.address || '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (editPhone.trim()) {
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(editPhone.trim())) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid Bangladesh phone number (e.g., 01812345678)');
        return;
      }
    }
    const hasNameChanged = editName.trim() !== (user?.name || '');
    const hasPhoneChanged = editPhone.trim() !== (user?.phone || '');
    const hasAddressChanged = editAddress.trim() !== (user?.address || '');
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
        if (hasNameChanged) {
          await accountInstance.updateName(editName.trim());
          updateCount++;
        }
        if (hasPhoneChanged) {
          try {
            const fullPhoneNumber = `+88${editPhone.trim()}`;
            await accountInstance.updatePhone(fullPhoneNumber, password);
            updateCount++;
          } catch (phoneError) {
            Alert.alert('Phone Update Failed', phoneError.message || 'Failed to update phone number. Please check your password.');
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
          } catch (addressError) {
            Alert.alert('Address Update Failed', addressError.message || 'Failed to update address.');
          }
        }
        if (updateCount > 0) {
          await checkUser();
          Alert.alert('Success', 'Profile updated successfully', [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]);
        } else {
          Alert.alert('No Changes', 'No changes were made');
        }
      } else {
        Alert.alert('Error', 'Unable to update profile. Please try again.');
      }
    } catch (error) {
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Icon name="person-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={editName}
                onChangeText={setEditName}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="mail-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
                editable={false}
              />
            </View>
            <Text style={styles.disabledText}>Email address cannot be changed</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <Text style={styles.inputDescription}>Please enter Bangladesh phone number (11 digits, e.g., 01812345678)</Text>
            <View style={styles.inputWrapper}>
              <Icon name="call-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="For example: 01812345678"
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
            <Text style={styles.inputLabel}>Address</Text>
            <Text style={styles.inputDescription}>Enter your full address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="location-outline" size={20} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your full address"
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
          {editPhone.trim() !== (user?.phone || '') && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <Text style={styles.inputDescription}>Enter your password to update phone number</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
            style={[styles.actionButton, styles.cancelActionButton]} 
            onPress={handleCancel}
            disabled={isUpdatingProfile}
          >
            <Icon name="close" size={20} color="#6C757D" />
            <Text style={styles.cancelActionButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
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
    backgroundColor: '#FFFFFF',
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
    color: '#212529',
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#212529',
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
});
