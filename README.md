# BciEbook - React Native CLI App

A React Native CLI application with Appwrite backend integration, featuring user authentication, file uploads, and a complete e-book library interface.

## Features

- **User Authentication**: Complete login/signup system with Appwrite
- **Profile Management**: Edit profile information with validation
- **File Upload**: Image upload functionality with Appwrite Storage
- **Settings**: Comprehensive settings page with password change
- **Privacy Policy**: Detailed privacy policy page
- **Dashboard**: Admin dashboard for file management
- **Navigation**: Tab-based navigation with stack navigation for modals

## Tech Stack

- **Frontend**: React Native CLI
- **Backend**: Appwrite (BaaS)
- **Navigation**: React Navigation v6
- **Icons**: React Native Vector Icons
- **File Handling**: Expo FileSystem & ImagePicker
- **State Management**: React Hooks

## Prerequisites

- Node.js (>= 18)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Appwrite account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BciEbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Configure Appwrite**
   - Create an Appwrite project
   - Set up a database and collection
   - Create a storage bucket
   - Update `constants/Config.js` with your Appwrite credentials

## Configuration

Update the `constants/Config.js` file with your Appwrite project details:

```javascript
export const CONFIG = {
  APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: 'your-project-id',
  APPWRITE_BUCKET_ID: 'your-bucket-id',
  APPWRITE_DATABASE_ID: 'your-database-id',
  APPWRITE_COLLECTION_ID: 'your-collection-id',
};
```

## Project Structure

```
BciEbook/
├── components/
│   └── ui/
│       └── CustomTabBar.jsx
├── constants/
│   └── Config.js
├── hooks/
│   └── useAuth.js
├── lib/
│   └── appwrite.js
├── screens/
│   ├── HomeScreen.jsx
│   ├── FavoritesScreen.jsx
│   ├── SettingsScreen.jsx
│   ├── EditProfileScreen.jsx
│   ├── DashboardScreen.jsx
│   └── PrivacyPolicyScreen.jsx
├── services/
│   └── appwriteService.js
├── App.jsx
├── index.js
└── package.json
```

## Running the App

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Metro Bundler
```bash
npm start
```

## Features Overview

### 1. Home Screen
- Simple welcome screen
- Placeholder for e-book content

### 2. Favorites Screen
- Displays user's favorite books
- Placeholder for future implementation

### 3. Settings Screen
- User profile display
- Dark mode toggle
- Password change functionality
- Admin dashboard access
- Privacy policy link
- Logout functionality

### 4. Edit Profile Screen
- Edit user information
- Phone number validation for Bangladesh
- Address management
- Password confirmation for sensitive changes

### 5. Dashboard Screen (Admin)
- File upload functionality
- Image picker integration
- Appwrite Storage integration
- Debug information display
- Base64 file handling

### 6. Privacy Policy Screen
- Comprehensive privacy policy
- Scrollable content
- Professional layout

## File Upload Features

The dashboard includes advanced file upload capabilities:

- **Image Picker**: Select images from device gallery
- **Base64 Conversion**: Convert files to Base64 for reliable upload
- **Appwrite Integration**: Direct upload to Appwrite Storage
- **Error Handling**: Comprehensive error handling and user feedback
- **Debug Information**: Real-time upload status and debugging

## Authentication

The app uses Appwrite's authentication system:

- **Account Management**: User registration and login
- **Session Management**: Automatic session handling
- **Profile Updates**: Secure profile information updates
- **Password Security**: Encrypted password storage and updates

## Navigation

- **Tab Navigation**: Bottom tab navigation for main screens
- **Stack Navigation**: Modal screens for detailed views
- **Custom Icons**: Ionicons integration for consistent UI

## Dependencies

### Core Dependencies
- `react-native`: 0.81.0
- `react`: 19.1.0
- `@react-navigation/native`: Navigation library
- `@react-navigation/bottom-tabs`: Tab navigation
- `@react-navigation/stack`: Stack navigation
- `react-native-vector-icons`: Icon library
- `appwrite`: Backend SDK
- `expo-file-system`: File system operations
- `expo-image-picker`: Image selection
- `buffer`: Buffer handling for file uploads

### Development Dependencies
- TypeScript configuration
- ESLint and Prettier
- Jest testing framework
- Metro bundler configuration

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build issues**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build issues**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Navigation issues**
   - Ensure `react-native-gesture-handler` is imported at the top of `index.js`
   - Check that all navigation dependencies are properly installed

### Appwrite Setup Issues

1. **Authentication errors**
   - Verify project ID and endpoint in `constants/Config.js`
   - Check Appwrite project settings
   - Ensure proper API keys and permissions

2. **File upload errors**
   - Verify bucket ID and permissions
   - Check file size limits
   - Ensure proper MIME type handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Appwrite documentation for backend issues
