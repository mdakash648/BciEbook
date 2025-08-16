// API Configuration for Direct Appwrite API Calls
const API_CONFIG = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: '<Enter your project id>',
    projectName: 'Bci_E_Book_Library',
    apiKey: '<Enter your api key>'
};

// Helper function to make API requests to Appwrite
async function makeAppwriteRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_CONFIG.endpoint}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': API_CONFIG.projectId,
        'X-Appwrite-Key': API_CONFIG.apiKey
    };
    
    const options = {
        method: method,
        headers: headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    console.log(`🌐 Making ${method} request to: ${endpoint}`);
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        console.log(`📡 Response status: ${response.status}`);
        console.log(`📄 Response data:`, result);
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ API request failed:`, error);
        throw error;
    }
}

// Public request (no API key) for endpoints that must be accessed without application role
async function makePublicAppwriteRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_CONFIG.endpoint}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': API_CONFIG.projectId
    };

    const options = { method, headers };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        return result;
    } catch (error) {
        console.error('❌ Public API request failed:', error);
        throw error;
    }
}

// Function to update password using recovery
async function updatePasswordRecovery(userId, secret, password) {
    const endpoint = `/account/recovery`;
    
    const data = {
        userId: userId,
        secret: secret,
        password: password,
        passwordAgain: password
    };
    
    return await makeAppwriteRequest(endpoint, 'PUT', data);
}

// Function to test API key
async function testApiKey() {
    try {
        // Try to get project info to test the API key
        const result = await makeAppwriteRequest('/projects/' + API_CONFIG.projectId);
        return {
            success: true,
            message: 'API key is valid',
            project: result
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

// Export functions for use in other scripts
window.API_CONFIG = API_CONFIG;
window.makeAppwriteRequest = makeAppwriteRequest;
window.makePublicAppwriteRequest = makePublicAppwriteRequest;
window.updatePasswordRecovery = updatePasswordRecovery;
window.testApiKey = testApiKey;
