// Static Email Verification Completer (API Key Mode)

document.addEventListener('DOMContentLoaded', async function () {
  try {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');

    if (!userId || !secret) {
      return showError('Invalid verification link.');
    }

    await completeVerification(userId, secret);
    showSuccess();
    setTimeout(openApp, 1000);
  } catch (e) {
    showError(e?.message || 'Verification failed.');
  }
});

async function completeVerification(userId, secret) {
  // Verification is a public endpoint; must NOT use API key
  return await window.makePublicAppwriteRequest('/account/verification', 'PUT', {
    userId,
    secret,
  });
}

function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

function showSuccess() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('success').classList.remove('hidden');
}

function openApp() {
  try {
    window.location.href = 'bci-ebook://';
  } catch (e) {}
}


