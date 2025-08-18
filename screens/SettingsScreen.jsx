import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal, 
  TextInput, 
  Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getAccountInstance } from '../services/appwriteService';
import { loadPublicData } from '../services/demoPolicyService';
import { account } from '../lib/appwrite';

export default function SettingsScreen({ navigation }) {
  const { user, logout, checkUser, syncUserRole } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadPublicData();
        setAboutText(data.about || '');
      } catch (_) {
        setAboutText('');
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Root navigator will re-render to Auth automatically
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleRefreshUser = async () => {
    setIsRefreshing(true);
    try {
      // Sync user role from Appwrite Auth labels to database
      const syncResult = await syncUserRole();
      
      if (syncResult.success) {
        if (syncResult.roleChanged) {
          Alert.alert(
            'Role Updated', 
            `Your role has been updated: ${syncResult.message}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Success', 'User data refreshed successfully. Role is up to date.');
        }
      } else {
        Alert.alert('Error', syncResult.error || 'Failed to refresh user data');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      Alert.alert('Error', 'Failed to refresh user data');
    } finally {
      setIsRefreshing(false);
    }
  };



  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleCancelPasswordChange = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSavePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    try {
      const accountInstance = getAccountInstance();
      if (accountInstance) {
        await accountInstance.updatePassword(newPassword, currentPassword);
        Alert.alert('Success', 'Password updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowChangePasswordModal(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }
        ]);
      } else {
        Alert.alert('Error', 'Unable to update password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange = () => {},
    showArrow = true,
    destructive = false,
    loading = false,
    showCheckmark = false
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: theme.border }, destructive && styles.destructiveItem]} 
      onPress={onPress}
      disabled={showSwitch || loading}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, destructive && styles.destructiveIcon]}>
          {loading ? (
            <Icon name="refresh" size={20} color={theme.primary} style={{ opacity: 0.6 }} />
          ) : showCheckmark ? (
            <Icon name="checkmark-circle" size={20} color={theme.successText} />
          ) : (
            <Icon name={icon} size={20} color={destructive ? theme.dangerText : theme.primary} />
          )}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }, destructive && styles.destructiveText]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={switchValue ? '#FFFFFF' : '#FFFFFF'}
        />
      ) : showArrow ? (
        <Icon name="chevron-forward" size={20} color={theme.textMuted} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        </View>
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Profile</Text>
          <View style={[styles.profileCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{user?.name}</Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
              <View style={styles.roleContainer}>
                <Text style={[styles.roleText, { color: theme.textSecondary }, user?.role === 'admin' && styles.adminRoleText]}>
                  {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                </Text>
              </View>
            </View>
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[styles.refreshButton, { backgroundColor: theme.primaryLight }, isRefreshing && styles.refreshButtonDisabled]} 
                onPress={handleRefreshUser}
                disabled={isRefreshing}
              >
                <Icon 
                  name={isRefreshing ? "refresh" : "refresh-outline"} 
                  size={16} 
                  color={isRefreshing ? theme.textMuted : theme.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primaryLight }]} onPress={handleEditProfile}>
                <Icon name="pencil" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferences</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <SettingItem
              icon={isDarkMode ? "sunny-outline" : "moon-outline"}
              title="Dark Mode"
              subtitle={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
              showSwitch={true}
              switchValue={isDarkMode}
              onSwitchChange={toggleTheme}
            />
          </View>
        </View>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <SettingItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={handleChangePassword}
            />
            {user?.role === 'admin' && (
              <SettingItem
                icon="grid-outline"
                title="Dashboard"
                subtitle="Admin dashboard and controls"
                onPress={handleDashboard}
              />
            )}
          </View>
        </View>
        {/* App Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>App</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="App information"
              onPress={() => setShowAboutModal(true)}
            />
            
            <SettingItem
              icon="shield-outline"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />


          </View>
        </View>
        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Danger Zone</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <SettingItem
              icon="log-out-outline"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              destructive={true}
            />
          </View>
        </View>
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.appCopyright, { color: theme.textSecondary }]}>© 2025 BCI E-LIBRARY. All rights reserved.</Text>
        </View>
      </ScrollView>
      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelPasswordChange}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
              <TouchableOpacity onPress={handleCancelPasswordChange} style={styles.modalCloseButton}>
                <Icon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {/* Modal Body */}
            <View style={styles.modalBody}>
              {/* Current Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-closed-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your current password"
                    placeholderTextColor="#9CA3AF"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.passwordToggle}
                  >
                    <Icon 
                      name={showCurrentPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6C757D" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {/* New Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <Text style={styles.inputDescription}>Must be at least 8 characters long</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-closed-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.passwordToggle}
                  >
                    <Icon 
                      name={showNewPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6C757D" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Confirm New Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-closed-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                  >
                    <Icon 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6C757D" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelPasswordChange}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isChangingPassword && styles.saveButtonDisabled]}
                onPress={handleSavePassword}
                disabled={isChangingPassword}
              >
                <Text style={[styles.saveButtonText, isChangingPassword && styles.saveButtonTextDisabled]}>
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)} style={styles.modalCloseButton}>
                <Icon name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.aboutModalText}>
                  {aboutText || 'No about text set.'}
                </Text>
              </ScrollView>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
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
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
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
    color: '#212529',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6C757D',
  },
  roleContainer: {
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  adminRoleText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  refreshButtonDisabled: {
    backgroundColor: '#F8F9FA',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  settingsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aboutCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  aboutText: {
    marginTop: 8,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  aboutModalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#343A40',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  destructiveItem: {
    borderBottomColor: '#FFF5F5',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#FFF5F5',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#FF6B6B',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  appCopyright: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  cancelButtonText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#FFFFFF',
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
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
});
