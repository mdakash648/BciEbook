// Static Password Reset System for InfinityFree Hosting
// This works entirely in the browser using API key with direct HTTP requests

// Global variables
let userId = null;
let secret = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Static password reset system loaded (API Key Mode)');
    
    // Parse URL parameters
    parseUrlParameters();
    
    // Initialize form
    initializeForm();
    
    // Check if we have valid parameters
    if (!userId || !secret) {
        showError('Invalid reset link. Please request a new password reset.');
        return;
    }
    
    // Show the form
    showForm();
});

// Parse URL parameters (userId and secret)
function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    userId = urlParams.get('userId');
    secret = urlParams.get('secret');
    
    console.log('🔍 URL Parameters:', { userId: userId ? '***' : null, secret: secret ? '***' : null });
}

// Initialize the password reset form
function initializeForm() {
    const form = document.getElementById('reset-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Add form submit handler
    form.addEventListener('submit', handlePasswordReset);
    
    // Add password validation
    confirmPasswordInput.addEventListener('input', validatePasswords);
    passwordInput.addEventListener('input', validatePasswords);
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleButton = input.parentElement.querySelector('.password-toggle');
    const eyeIcon = toggleButton.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        // Show password
        input.type = 'text';
        toggleButton.classList.add('showing');
        eyeIcon.textContent = '🙈'; // Eye with slash
        console.log('👁️ Password shown');
    } else {
        // Hide password
        input.type = 'password';
        toggleButton.classList.remove('showing');
        eyeIcon.textContent = '👁️'; // Eye
        console.log('🙈 Password hidden');
    }
}

// Validate that passwords match
function validatePasswords() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitButton = document.querySelector('#reset-form button[type="submit"]');
    
    if (password && confirmPassword) {
        if (password === confirmPassword) {
            submitButton.disabled = false;
            submitButton.textContent = 'Reset Password';
        } else {
            submitButton.disabled = true;
            submitButton.textContent = 'Passwords do not match';
        }
    } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Reset Password';
    }
}

// Handle password reset form submission
async function handlePasswordReset(event) {
    event.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate passwords
    if (password !== confirmPassword) {
        showError('Passwords do not match. Please try again.');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters long.');
        return;
    }
    
    // Show loading
    showLoading();
    
    try {
        console.log('🔄 Attempting password reset with API key...');
        console.log('👤 User ID:', userId ? '***' : 'null');
        console.log('🔑 Secret:', secret ? '***' : 'null');
        
        // Call Appwrite API directly using API key
        await window.updatePasswordRecovery(userId, secret, password);
        
        console.log('✅ Password reset successful!');
        showSuccess();
        
    } catch (error) {
        console.error('❌ Password reset failed:', error);
        
        let errorMessage = 'Failed to reset password. Please try again.';
        
        // Handle specific API errors
        if (error.message.includes('401')) {
            errorMessage = 'Invalid or expired reset link. Please request a new password reset.';
        } else if (error.message.includes('400')) {
            errorMessage = 'Invalid password format. Please use a stronger password.';
        } else if (error.message.includes('404')) {
            errorMessage = 'User not found. Please check your reset link.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Access denied. Please check your API key configuration.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorMessage);
    }
}

// Show loading state
function showLoading() {
    hideAllScreens();
    document.getElementById('loading').classList.remove('hidden');
}

// Show error state
function showError(message) {
    hideAllScreens();
    document.getElementById('error-message').textContent = message;
    document.getElementById('error').classList.remove('hidden');
}

// Show success state
function showSuccess() {
    hideAllScreens();
    document.getElementById('success').classList.remove('hidden');
}

// Show form
function showForm() {
    hideAllScreens();
    document.getElementById('reset-form').classList.remove('hidden');
}

// Hide all screens
function hideAllScreens() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('success').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
}

// Navigate to login (deep link to app)
function goToLogin() {
    try {
        // Try to open the app with correct scheme
        window.location.href = 'bci-ebook://login';
        
        // Fallback after a short delay
        setTimeout(() => {
            // If app doesn't open, show a message
            alert('Please open the BCI E-Book Library app to log in.');
        }, 1000);
        
    } catch (error) {
        console.error('Failed to open app:', error);
        alert('Please open the BCI E-Book Library app to log in.');
    }
}

// Open app directly
function openApp() {
    try {
        window.location.href = 'bci-ebook://';
    } catch (error) {
        console.error('Failed to open app:', error);
        goToLogin();
    }
}
