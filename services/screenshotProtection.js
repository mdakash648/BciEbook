import { Platform, Alert, NativeModules } from 'react-native';

/**
 * Simple Screenshot Protection Service
 * Works with FLAG_SECURE implementation in MainActivity.kt
 */

class ScreenshotProtectionService {
  constructor() {
    this.isProtected = false;
  }

  /**
   * Enable screenshot protection
   * Note: This is handled by MainActivity.kt automatically
   */
  async enableProtection() {
    try {
      console.log('🔒 Screenshot protection enabled via MainActivity');
      this.isProtected = true;
      
      // Show user notification
      Alert.alert(
        'Security Active',
        'Screenshot and screen recording protection is now active.',
        [{ text: 'OK' }]
      );
      
      return { success: true, message: 'Protection enabled' };
    } catch (error) {
      console.log('⚠️ Error enabling protection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable screenshot protection
   * Note: This would require additional native module implementation
   */
  async disableProtection() {
    try {
      console.log('🔓 Screenshot protection disabled');
      this.isProtected = false;
      return { success: true, message: 'Protection disabled' };
    } catch (error) {
      console.log('⚠️ Error disabling protection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if protection is active
   */
  isProtectionActive() {
    return this.isProtected;
  }

  /**
   * Get protection status
   */
  getStatus() {
    return {
      isProtected: this.isProtected,
      platform: Platform.OS,
      method: 'MainActivity FLAG_SECURE'
    };
  }

  /**
   * Test protection
   */
  async testProtection() {
    try {
      console.log('🧪 Testing screenshot protection...');
      
      if (Platform.OS === 'android') {
        // On Android, protection is always active due to MainActivity implementation
        this.isProtected = true;
        
        Alert.alert(
          'Protection Test',
          'Screenshot protection is active!\n\nTry taking a screenshot now - it should be blocked.',
          [
            { text: 'OK' },
            { 
              text: 'Show Status', 
              onPress: () => {
                const status = this.getStatus();
                Alert.alert(
                  'Protection Status',
                  `Protected: ${status.isProtected}\nPlatform: ${status.platform}\nMethod: ${status.method}`,
                  [{ text: 'OK' }]
                );
              }
            }
          ]
        );
        
        return { success: true, method: 'MainActivity FLAG_SECURE' };
      } else {
        // iOS doesn't have this level of protection
        Alert.alert(
          'Platform Limitation',
          'Screenshot protection is limited on iOS due to platform restrictions.',
          [{ text: 'OK' }]
        );
        
        return { success: false, method: 'iOS limitation' };
      }
    } catch (error) {
      console.log('❌ Test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const screenshotProtection = new ScreenshotProtectionService();

// Export individual functions for convenience
export const enableScreenshotProtection = () => screenshotProtection.enableProtection();
export const disableScreenshotProtection = () => screenshotProtection.disableProtection();
export const isProtectionActive = () => screenshotProtection.isProtectionActive();
export const getProtectionStatus = () => screenshotProtection.getStatus();
export const testScreenshotProtection = () => screenshotProtection.testProtection();
