import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PrivacyPolicyScreen({ navigation }) {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: December 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Welcome to our E-Book Library App ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            
            <Text style={styles.subsectionTitle}>2.1 Personal Information</Text>
            <Text style={styles.paragraph}>
              We collect the following personal information when you create an account:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Full name</Text>
              <Text style={styles.bulletPoint}>• Email address</Text>
              <Text style={styles.bulletPoint}>• Phone number (optional)</Text>
              <Text style={styles.bulletPoint}>• Address (optional)</Text>
              <Text style={styles.bulletPoint}>• Password (encrypted)</Text>
            </View>

            <Text style={styles.subsectionTitle}>2.2 Usage Information</Text>
            <Text style={styles.paragraph}>
              We may collect information about how you use our app, including:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Books you read or download</Text>
              <Text style={styles.bulletPoint}>• Reading preferences and history</Text>
              <Text style={styles.bulletPoint}>• App usage patterns</Text>
              <Text style={styles.bulletPoint}>• Device information and app performance</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use the collected information for the following purposes:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• To provide and maintain our e-book library service</Text>
              <Text style={styles.bulletPoint}>• To authenticate your identity and secure your account</Text>
              <Text style={styles.bulletPoint}>• To personalize your reading experience</Text>
              <Text style={styles.bulletPoint}>• To recommend books based on your preferences</Text>
              <Text style={styles.bulletPoint}>• To communicate with you about your account</Text>
              <Text style={styles.bulletPoint}>• To improve our app and services</Text>
              <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              We use Appwrite, a secure backend-as-a-service platform, to store and manage your data. Your information is:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Encrypted in transit and at rest</Text>
              <Text style={styles.bulletPoint}>• Stored on secure servers with industry-standard protection</Text>
              <Text style={styles.bulletPoint}>• Protected by authentication and authorization measures</Text>
              <Text style={styles.bulletPoint}>• Regularly backed up and monitored for security threats</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Information Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• With your explicit consent</Text>
              <Text style={styles.bulletPoint}>• To comply with legal requirements or court orders</Text>
              <Text style={styles.bulletPoint}>• To protect our rights, property, or safety</Text>
              <Text style={styles.bulletPoint}>• With service providers who assist in app operations (under strict confidentiality agreements)</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
            <Text style={styles.paragraph}>
              You have the following rights regarding your personal information:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Access and review your personal data</Text>
              <Text style={styles.bulletPoint}>• Update or correct your information through the app</Text>
              <Text style={styles.bulletPoint}>• Delete your account and associated data</Text>
              <Text style={styles.bulletPoint}>• Opt out of certain communications</Text>
              <Text style={styles.bulletPoint}>• Request data portability</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
            <Text style={styles.paragraph}>
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and that your information receives adequate protection.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Privacy Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last Updated" date. Your continued use of the app after such changes constitutes acceptance of the updated policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>Email: privacy@ebooklibrary.com</Text>
              <Text style={styles.contactText}>Address: [Your Company Address]</Text>
              <Text style={styles.contactText}>Phone: [Your Contact Number]</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Governing Law</Text>
            <Text style={styles.paragraph}>
              This Privacy Policy is governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising from this policy will be resolved in the courts of [Your Jurisdiction].
            </Text>
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 16,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 6,
  },
  contactInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 4,
  },
});
