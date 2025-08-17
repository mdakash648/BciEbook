import { ID, Permission, Role } from 'appwrite';
import { storage, databases, account, client } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';

async function checkNetworkConnectivity() {
  try {
    console.log('Checking network connectivity...');
    // Test basic connectivity to Appwrite endpoint
    const response = await fetch(CONFIG.APPWRITE_ENDPOINT, {
      method: 'GET',
      timeout: 10000,
    });
    // We expect some response from the server, even if it's not 200
    if (response.status !== 0) {
      console.log('Network connectivity check passed');
      return true;
    }
    throw new Error('No response from server');
  } catch (error) {
    console.log('Network connectivity check failed:', error);
    if (error.message.includes('timeout') || error.message.includes('Network request failed')) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    throw new Error('Unable to connect to server. Please check your internet connection.');
  }
}

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
// Create a books collection in your DB and put its ID here when ready
const BOOKS_COLLECTION_ID = CONFIG.APPWRITE_BOOKS_COLLECTION_ID || 'books';
// Use a single bucket (as requested) for both cover and pdf
const COVER_BUCKET_ID = CONFIG.APPWRITE_COVER_BUCKET_ID;
const PDF_BUCKET_ID = CONFIG.APPWRITE_PDF_BUCKET_ID;

async function ensureAuth() {
  try {
    console.log('Ensuring authentication...');
    
    // First, try to get current user directly (this will use existing session if available)
    try {
      const user = await account.get();
      if (user) {
        console.log('User already authenticated:', user.email);
        // Create fresh JWT token for uploads
        const { jwt } = await account.createJWT();
        console.log('Fresh JWT created successfully');
        return jwt;
      }
    } catch (userError) {
      console.log('Direct user check failed:', userError.message);
    }
    
    // If direct user check fails, try to get and set sessions
    console.log('Attempting to retrieve and set session...');
    const sessions = await account.listSessions();
    console.log('Available sessions:', sessions.sessions?.length || 0);
    
    if (!sessions.sessions || sessions.sessions.length === 0) {
      throw new Error('No active sessions found. Please login again.');
    }
    
    // Find current session or use the first available
    const currentSession = sessions.sessions.find((s) => s.current) || sessions.sessions[0];
    console.log('Using session:', currentSession.$id);
    
    // Set the session on the client
    client.setSession(currentSession.$id);
    
    // Verify authentication works
    const user = await account.get();
    console.log('Authentication verified for user:', user.email);
    
    // Create fresh JWT token
    const { jwt } = await account.createJWT();
    console.log('JWT token created successfully');
    
    return jwt;
    
  } catch (error) {
    console.log('Authentication process failed:', error);
    const errorMsg = error.message || String(error);
    
    if (errorMsg.includes('User (role: guests)')) {
      throw new Error('Authentication expired. Please logout and login again.');
    } else if (errorMsg.includes('No active sessions')) {
      throw new Error('No active sessions found. Please login again.');
    } else {
      throw new Error(`Authentication failed: ${errorMsg}`);
    }
  }
}

export async function uploadBook({ title, author, category, edition, pages, language, publisher, country, coverFile, pdfFile }) {
  console.log('Starting book upload process...');
  
  if (!title?.trim()) throw new Error('Please enter a book name');
  if (!author?.trim()) throw new Error('Please enter author');
  if (!edition?.trim()) throw new Error('Please enter edition');
  if (pages === undefined || pages === null || String(pages).trim() === '') throw new Error('Please enter pages');
  if (!language?.trim()) throw new Error('Please enter language');
  if (!publisher?.trim()) throw new Error('Please enter publisher');
  if (!country?.trim()) throw new Error('Please enter country');
  if (!category?.trim()) throw new Error('Please select at least one category');
  if (!coverFile) throw new Error('Please choose a cover image');
  if (!pdfFile) throw new Error('Please choose a PDF file');

  console.log('All validation passed, checking network connectivity...');
  
  // Check network connectivity first
  await checkNetworkConnectivity();
  
  console.log('Network check passed, ensuring authentication...');
  
  // Ensure authentication and get fresh JWT token
  const jwt = await ensureAuth();
  console.log('Authentication successful, proceeding with upload...');

  // Prepare IDs and file names based on requested pattern
  const documentId = `book_${Math.random().toString(36).slice(2,10)}_${Date.now().toString(36)}`;
  const sanitizedTitle = title.trim().replace(/[^a-zA-Z0-9\-_ ]+/g, '').replace(/\s+/g, '_');

  const inferImageExt = () => {
    if (coverFile?.name && /\.(png)$/i.test(coverFile.name)) return 'png';
    if (coverFile?.name && /\.(jpe?g)$/i.test(coverFile.name)) return 'jpg';
    if (coverFile?.type === 'image/png') return 'png';
    if (coverFile?.type === 'image/jpeg') return 'jpg';
    return 'jpg';
  };

  const imageExt = inferImageExt();
  const coverFileName = `${sanitizedTitle}_book_${documentId}.${imageExt}`;
  const pdfFileName = `${sanitizedTitle}_${documentId}.pdf`;
  const buildHeaders = () => ({
    'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
    'X-Appwrite-JWT': jwt,
    Accept: 'application/json',
  });

  const uploadViaRest = async (bucketId, fileId, fileObj, retryCount = 0) => {
    try {
      const form = new FormData();
      form.append('fileId', fileId);
      form.append('file', fileObj);
      // Ensure future update/delete via user session is allowed
      form.append('permissions[]', 'read("any")');
      form.append('permissions[]', 'update("users")');
      form.append('permissions[]', 'delete("users")');
      const url = `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files`;
      const res = await fetch(url, { method: 'POST', headers: buildHeaders(), body: form });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return json; // returns file object with $id
    } catch (error) {
      console.log(`Upload error for ${fileId}:`, error);
      // Retry once with fresh authentication if network/auth error
      if (retryCount === 0 && (error.message.includes('network') || error.message.includes('401') || error.message.includes('403'))) {
        console.log('Retrying with fresh authentication...');
        const freshJwt = await ensureAuth();
        // Update the buildHeaders function to use fresh JWT
        const freshHeaders = () => ({
          'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
          'X-Appwrite-JWT': freshJwt,
          Accept: 'application/json',
        });
        
        const form = new FormData();
        form.append('fileId', fileId);
        form.append('file', fileObj);
        form.append('permissions[]', 'read("any")');
        form.append('permissions[]', 'update("users")');
        form.append('permissions[]', 'delete("users")');
        const url = `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files`;
        const res = await fetch(url, { method: 'POST', headers: freshHeaders(), body: form });
        const json = await res.json();
        if (!res.ok) {
          const msg = json?.message || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        return json;
      }
      throw error;
    }
  };

  console.log('Uploading cover image...');
  const coverUpload = {
    uri: coverFile.uri,
    name: coverFileName,
    type: coverFile.type || (imageExt === 'png' ? 'image/png' : 'image/jpeg'),
  };
  const coverFileId = `cover_${documentId}`;
  const coverRes = await uploadViaRest(COVER_BUCKET_ID, coverFileId, coverUpload);
  console.log('Cover image uploaded successfully:', coverRes.$id);

  console.log('Uploading PDF file...');
  const pdfUpload = {
    uri: pdfFile.uri,
    name: pdfFileName,
    type: 'application/pdf',
  };
  const pdfStorageId = `pdf_${documentId}`;
  const pdfRes = await uploadViaRest(PDF_BUCKET_ID, pdfStorageId, pdfUpload);
  console.log('PDF file uploaded successfully:', pdfRes.$id);

  // 3) Create book document
  const pagesNumber = Number.isFinite(Number(pages)) ? Number(pages) : null;
  // Build public/view URLs (attributes are type Url in your schema)
  const endpoint = CONFIG.APPWRITE_ENDPOINT.replace(/\/$/, '');
  const project = CONFIG.APPWRITE_PROJECT_ID;
  const coverUrl = `${endpoint}/storage/buckets/${COVER_BUCKET_ID}/files/${coverRes.$id}/view?project=${project}`;
  const pdfUrl = `${endpoint}/storage/buckets/${PDF_BUCKET_ID}/files/${pdfRes.$id}/view?project=${project}`;

  // Create book document with retry logic
  let doc;
  try {
    doc = await databases.createDocument(
      DATABASE_ID,
      BOOKS_COLLECTION_ID,
      documentId,
      {
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        edition: edition.trim(),
        pages: pagesNumber,
        language: language.trim(),
        publisher: publisher.trim(),
        country: country.trim(),
        coverFileId: coverUrl,
        pdfFileId: pdfUrl,
      },
      [Permission.read(Role.any()), Permission.update(Role.users())]
    );
  } catch (dbError) {
    console.log('Database error:', dbError);
    // If database creation fails, clean up uploaded files
    try {
      await storage.deleteFile(COVER_BUCKET_ID, coverRes.$id);
      await storage.deleteFile(PDF_BUCKET_ID, pdfRes.$id);
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError);
    }
    throw new Error(`Failed to save book information: ${dbError.message || dbError}`);
  }

  return { document: doc, coverId: coverRes.$id, pdfId: pdfRes.$id };
}


