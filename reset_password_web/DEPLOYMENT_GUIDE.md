# 🚀 Deployment Guide for bciebook.free.nf

## ✅ **Files Ready for Upload**

Your `reset_password_web` folder contains all the necessary files for password reset functionality:

### **Core Files:**
- `index.html` - Main password reset page
- `oauth-bridge.html` - OAuth callback bridge
- `api-config.js` - Appwrite API configuration
- `script.js` - Password reset logic
- `styles.css` - Styling
- `test-api.html` - API connection test page

### **Configuration:**
- ✅ Appwrite Project ID: ``
- ✅ Appwrite Endpoint: `https://fra.cloud.appwrite.io/v1`
- ✅ API Key: Configured and ready
- ✅ Deep Link Scheme: `bci-ebook://`

## 📤 **Upload to bciebook.free.nf**

### **Step 1: Upload All Files**
Upload these files to your hosting root directory:
```
📁 bciebook.free.nf/
├── index.html
├── oauth-bridge.html
├── api-config.js
├── script.js
├── styles.css
└── test-api.html
```

### **Step 2: Test the Setup**
After uploading, test these URLs:

1. **API Test**: `https://bciebook.free.nf/test-api.html`
   - Should show "API Connection Successful!"
   - Verifies your Appwrite API key works

2. **Password Reset**: `https://bciebook.free.nf/`
   - Should show the password reset form
   - Will work when accessed with `userId` and `secret` parameters

3. **OAuth Bridge**: `https://bciebook.free.nf/oauth-bridge.html`
   - Should redirect to your app when accessed with OAuth parameters

## 🔧 **Appwrite Console Setup**

### **Required: Add Web Platform**
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select project: **BCI E-Book library**
3. **Settings** → **Platforms** → **Add Platform**
4. **Type**: Web
5. **Domain**: `bciebook.free.nf`
6. **Name**: `BCI E-Book Web Platform`
7. Click **Create**

### **Verify OAuth Setup**
1. **Auth** → **OAuth2 Providers** → **Google**
2. Ensure enabled with correct credentials
3. **App ID**: `your_google_oauth_client_id_here`
4. **App Secret**: `your_google_oauth_client_secret_here`

## 🧪 **Testing Checklist**

### **Before Testing:**
- [ ] All files uploaded to `bciebook.free.nf`
- [ ] Web Platform added in Appwrite Console
- [ ] API test passes at `https://bciebook.free.nf/test-api.html`

### **Test Password Reset:**
1. Request password reset from your app
2. Check email for reset link
3. Click link → should open `https://bciebook.free.nf/?userId=...&secret=...`
4. Enter new password → should work and redirect to app

### **Test Google OAuth:**
1. Click "Continue with Google" in your app
2. Complete Google authentication
3. Should redirect to `https://bciebook.free.nf/oauth-bridge.html`
4. Bridge should redirect back to app with `userId` and `secret`

## 🔍 **Troubleshooting**

### **"Invalid recovery URL" Error:**
- **Solution**: Add `bciebook.free.nf` as Web Platform in Appwrite Console

### **API Connection Failed:**
- **Check**: Visit `https://bciebook.free.nf/test-api.html`
- **Solution**: Verify API key in `api-config.js`

### **OAuth Not Working:**
- **Check**: Ensure `oauth-bridge.html` is uploaded
- **Solution**: Verify Web Platform is added in Appwrite Console

## 📱 **App Configuration**

Your app is already configured with:
- `PASSWORD_RESET_URL: 'https://bciebook.free.nf/'`
- `OAUTH_BRIDGE_URL: 'https://bciebook.free.nf/oauth-bridge.html'`

## 🎉 **You're Ready!**

After following this guide:
- ✅ Password reset will work
- ✅ Google OAuth will work
- ✅ All redirects will function properly
- ✅ Your app will handle authentication seamlessly

**Next Step**: Upload the files and test the API connection!
