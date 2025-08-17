import { ID, Permission, Role } from 'appwrite';
import { storage, databases, account, client } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
// Create a books collection in your DB and put its ID here when ready
const BOOKS_COLLECTION_ID = CONFIG.APPWRITE_BOOKS_COLLECTION_ID || 'books';
// Use a single bucket (as requested) for both cover and pdf
const COVER_BUCKET_ID = CONFIG.APPWRITE_COVER_BUCKET_ID;
const PDF_BUCKET_ID = CONFIG.APPWRITE_PDF_BUCKET_ID;

async function ensureAuth() {
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

export async function uploadBook({ title, author, category, edition, pages, language, publisher, country, coverFile, pdfFile }) {
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

  await ensureAuth();

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

  // Use REST upload via fetch (same as app logo flow)
  const { jwt } = await account.createJWT();
  const buildHeaders = () => ({
    'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
    'X-Appwrite-JWT': jwt,
    Accept: 'application/json',
  });

  const uploadViaRest = async (bucketId, fileId, fileObj) => {
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
  };

  const coverUpload = {
    uri: coverFile.uri,
    name: coverFileName,
    type: coverFile.type || (imageExt === 'png' ? 'image/png' : 'image/jpeg'),
  };
  const coverFileId = `cover_${documentId}`;
  const coverRes = await uploadViaRest(COVER_BUCKET_ID, coverFileId, coverUpload);

  const pdfUpload = {
    uri: pdfFile.uri,
    name: pdfFileName,
    type: 'application/pdf',
  };
  const pdfStorageId = `pdf_${documentId}`;
  const pdfRes = await uploadViaRest(PDF_BUCKET_ID, pdfStorageId, pdfUpload);

  // 3) Create book document
  const pagesNumber = Number.isFinite(Number(pages)) ? Number(pages) : null;
  // Build public/view URLs (attributes are type Url in your schema)
  const endpoint = CONFIG.APPWRITE_ENDPOINT.replace(/\/$/, '');
  const project = CONFIG.APPWRITE_PROJECT_ID;
  const coverUrl = `${endpoint}/storage/buckets/${COVER_BUCKET_ID}/files/${coverRes.$id}/view?project=${project}`;
  const pdfUrl = `${endpoint}/storage/buckets/${PDF_BUCKET_ID}/files/${pdfRes.$id}/view?project=${project}`;

  const doc = await databases.createDocument(
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

  return { document: doc, coverId: coverRes.$id, pdfId: pdfRes.$id };
}


