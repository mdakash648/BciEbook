import { ID, Permission, Role } from 'appwrite';
import { storage, databases, account, client } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
// Create a books collection in your DB and put its ID here when ready
const BOOKS_COLLECTION_ID = CONFIG.APPWRITE_BOOKS_COLLECTION_ID || 'books';
// Two storage buckets for covers and pdfs (create these in Appwrite and put IDs in config)
const COVER_BUCKET_ID = CONFIG.APPWRITE_COVER_BUCKET_ID || 'covers';
const PDF_BUCKET_ID = CONFIG.APPWRITE_PDF_BUCKET_ID || 'pdfs';

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
  if (!coverFile) throw new Error('Please choose a cover image');
  if (!pdfFile) throw new Error('Please choose a PDF file');

  await ensureAuth();

  // 1) Upload cover
  const coverRes = await storage.createFile(COVER_BUCKET_ID, ID.unique(), coverFile, [
    Permission.read(Role.any()),
  ]);
  // 2) Upload pdf
  const pdfRes = await storage.createFile(PDF_BUCKET_ID, ID.unique(), pdfFile, [
    Permission.read(Role.any()),
  ]);

  // 3) Create book document
  const pagesNumber = Number.isFinite(Number(pages)) ? Number(pages) : null;
  const doc = await databases.createDocument(
    DATABASE_ID,
    BOOKS_COLLECTION_ID,
    ID.unique(),
    {
      title: title.trim(),
      author: author?.trim() || '',
      category: category?.trim() || '',
      edition: edition?.trim() || '',
      pages: pagesNumber,
      language: language?.trim() || '',
      publisher: publisher?.trim() || '',
      country: country?.trim() || '',
      coverFileId: coverRes.$id,
      pdfFileId: pdfRes.$id,
    },
    [Permission.read(Role.any()), Permission.update(Role.users())]
  );

  return { document: doc, coverId: coverRes.$id, pdfId: pdfRes.$id };
}


