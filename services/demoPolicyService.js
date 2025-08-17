import { ID, Permission, Role } from 'appwrite';
import { databases, account, client } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
const COLLECTION_ID = CONFIG.APPWRITE_COLLECTION_ID;
const PRIVACY_KEY = 'PrivacyPolicyData';
const ABOUT_KEY = 'About';
const FIXED_DOCUMENT_ID = '68a169b30002b12db91c';

async function ensureAuth() {
  // Try session first; fallback to JWT
  try {
    const sessions = await account.listSessions();
    const current = sessions.sessions?.find((s) => s.current) || sessions.sessions?.[0];
    if (current?.$id) {
      client.setSession(current.$id);
      return;
    }
  } catch (_) {}
  try {
    const { jwt } = await account.createJWT();
    if (jwt) client.setJWT(jwt);
  } catch (_) {}
}

async function getOrCreateFixedDocument() {
  await ensureAuth();
  try {
    const d = await databases.getDocument(DATABASE_ID, COLLECTION_ID, FIXED_DOCUMENT_ID);
    return d;
  } catch (err) {
    // Create the fixed doc if not found
    const created = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      FIXED_DOCUMENT_ID,
      { [PRIVACY_KEY]: '', [ABOUT_KEY]: '' },
      [Permission.read(Role.any()), Permission.update(Role.users())]
    );
    return created;
  }
}

export async function loadPublicData() {
  const d = await getOrCreateFixedDocument();
  return {
    id: d.$id,
    privacyPolicy: d[PRIVACY_KEY] || '',
    about: d[ABOUT_KEY] || '',
  };
}

export async function savePrivacyPolicyData(text) {
  const doc = await getOrCreateFixedDocument();
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      FIXED_DOCUMENT_ID,
      { [PRIVACY_KEY]: text, [ABOUT_KEY]: doc[ABOUT_KEY] ?? '' }
    );
  } catch (e) {
    const msg = (e?.message || '').toLowerCase();
    if (msg.includes('length') || msg.includes('too long') || msg.includes('exceeds')) {
      throw new Error('Your PrivacyPolicyData text is longer than the attribute size set in Appwrite. Please edit the collection attribute "PrivacyPolicyData" and increase its size (recommend 10000).');
    }
    throw new Error(e?.message || 'Failed to save privacy policy');
  }
}

export async function saveAboutData(text) {
  const doc = await getOrCreateFixedDocument();
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      FIXED_DOCUMENT_ID,
      { [ABOUT_KEY]: text, [PRIVACY_KEY]: doc[PRIVACY_KEY] ?? '' }
    );
  } catch (e) {
    const msg = (e?.message || '').toLowerCase();
    if (msg.includes('length') || msg.includes('too long') || msg.includes('exceeds')) {
      throw new Error('Your About text is longer than the attribute size set in Appwrite. Please increase the "About" attribute size (recommend 65535).');
    }
    throw new Error(e?.message || 'Failed to save About text');
  }
}

export async function debugDatabaseStatus() {
  const result = {
    user: null,
    sessionSet: false,
    jwtSet: false,
    document: { exists: false, id: FIXED_DOCUMENT_ID, err: null },
  };
  try {
    const sessions = await account.listSessions();
    const current = sessions.sessions?.find((s) => s.current) || sessions.sessions?.[0];
    if (current?.$id) {
      client.setSession(current.$id);
      result.sessionSet = true;
    }
    const user = await account.get();
    result.user = { id: user.$id, email: user.email, labels: user.labels || [] };
  } catch (e) {
    result.user = { error: e?.message || String(e) };
  }
  try {
    const { jwt } = await account.createJWT();
    if (jwt) {
      client.setJWT(jwt);
      result.jwtSet = true;
    }
  } catch (e) {
    result.jwtSet = false;
  }
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, FIXED_DOCUMENT_ID);
    result.document.exists = true;
    result.document.data = {
      hasPrivacy: Boolean(doc[PRIVACY_KEY]),
      hasAbout: Boolean(doc[ABOUT_KEY]),
    };
  } catch (e) {
    result.document.err = e?.message || String(e);
  }
  return result;
}


