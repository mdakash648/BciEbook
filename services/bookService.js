import { databases, storage, account, client } from '../lib/appwrite';
import { Query } from 'appwrite';
import { CONFIG } from '../constants/Config';

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
const BOOKS_COLLECTION_ID = CONFIG.APPWRITE_BOOKS_COLLECTION_ID || 'books';
const BUCKET_ID = CONFIG.APPWRITE_COVER_BUCKET_ID; // single bucket for both cover/pdf

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

export async function listBooks(limit = null, offset = 0, searchCriteria = null) {
	await ensureAuth();
	
	// If no limit specified, use old behavior for backward compatibility
	if (limit === null && offset === 0 && !searchCriteria) {
		console.log('Using legacy listBooks (no pagination)');
		const res = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, [
			Query.orderDesc('$createdAt')
		]);
		return res?.documents || [];
	}
	
	// New pagination behavior with search support
	const queries = [
		Query.orderDesc('$createdAt') // Add ordering to ensure consistent pagination
	];
	
	// Add search queries if provided
	if (searchCriteria && typeof searchCriteria === 'object') {
		Object.entries(searchCriteria).forEach(([key, value]) => {
			if (value) {
				// For pages, we need to do exact match since it's numeric
				if (key === 'pages') {
					const pagesValue = parseInt(value, 10);
					if (!isNaN(pagesValue)) {
						queries.push(Query.equal(key, pagesValue));
					}
				} else {
					// For text fields, use search query
					queries.push(Query.search(key, value));
				}
			}
		});
	}
	
	if (limit !== null) {
		queries.push(Query.limit(limit));
	}
	
	if (offset > 0) {
		queries.push(Query.offset(offset));
	}
	
	console.log('Querying books with limit:', limit, 'offset:', offset, 'searchCriteria:', searchCriteria);
	
	const res = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, queries);
	console.log('Books query result:', { total: res?.total, count: res?.documents?.length });
	
	return {
		documents: res?.documents || [],
		total: res?.total || 0
	};
}

export async function updateBook(documentId, data) {
	await ensureAuth();
	// Only pass provided keys
	const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
	return databases.updateDocument(DATABASE_ID, BOOKS_COLLECTION_ID, documentId, payload);
}

function extractFileIdFromViewUrl(url) {
	if (!url || typeof url !== 'string') return null;
	// expected: .../storage/buckets/{bucket}/files/{fileId}/view?... or /download
	const parts = url.split('/');
	const idx = parts.findIndex((p) => p === 'files');
	if (idx > -1 && parts[idx + 1]) return parts[idx + 1];
	return null;
}

export async function deleteBook(doc) {
	await ensureAuth();
	// Best effort: try to delete both files first
	const coverId = extractFileIdFromViewUrl(doc?.coverFileId);
	const pdfId = extractFileIdFromViewUrl(doc?.pdfFileId);
	try { const { jwt } = await account.createJWT(); if (jwt) client.setJWT(jwt); } catch (_) {}
	try { if (coverId) await storage.deleteFile(BUCKET_ID, coverId); } catch (_) {}
	try { if (pdfId) await storage.deleteFile(BUCKET_ID, pdfId); } catch (_) {}
	// Then delete the document
	return databases.deleteDocument(DATABASE_ID, BOOKS_COLLECTION_ID, doc.$id);
}

export async function updateBookWithFiles(doc, data, opts = {}) {
    await ensureAuth();
    const { coverFile, pdfFile } = opts;

    // Build helper for REST upload (same as logo flow)
    const { jwt } = await account.createJWT();
    const headers = {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'X-Appwrite-JWT': jwt,
        Accept: 'application/json',
    };
    const uploadViaRest = async (bucketId, fileId, fileObj) => {
        const form = new FormData();
        form.append('fileId', fileId);
        form.append('file', fileObj);
        const url = `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files`;
        const res = await fetch(url, { method: 'POST', headers, body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        return json;
    };

    const documentId = doc.$id;
    const sanitizedTitle = (data?.title ?? doc.title ?? '')
        .trim()
        .replace(/[^a-zA-Z0-9\-_ ]+/g, '')
        .replace(/\s+/g, '_');

    const endpoint = CONFIG.APPWRITE_ENDPOINT.replace(/\/$/, '');
    const project = CONFIG.APPWRITE_PROJECT_ID;

    const result = { coverFileId: undefined, pdfFileId: undefined };

    if (coverFile) {
        const inferImageExt = () => {
            if (coverFile?.name && /\.(png)$/i.test(coverFile.name)) return 'png';
            if (coverFile?.name && /\.(jpe?g)$/i.test(coverFile.name)) return 'jpg';
            if (coverFile?.type === 'image/png') return 'png';
            if (coverFile?.type === 'image/jpeg') return 'jpg';
            return 'jpg';
        };
        const imageExt = inferImageExt();
        const coverFileName = `${sanitizedTitle}_book_${documentId}.${imageExt}`;
        const coverStorageId = `cover_${documentId}`;
        // delete previous file first to avoid ID collision
        try { const prev = extractFileIdFromViewUrl(doc.coverFileId); if (prev) await storage.deleteFile(BUCKET_ID, prev); } catch (_) {}
        const upload = {
            uri: coverFile.uri,
            name: coverFileName,
            type: coverFile.type || (imageExt === 'png' ? 'image/png' : 'image/jpeg'),
        };
        const up = await uploadViaRest(BUCKET_ID, coverStorageId, upload);
        result.coverFileId = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${up.$id}/view?project=${project}`;
    }

    if (pdfFile) {
        const pdfFileName = `${sanitizedTitle}_${documentId}.pdf`;
        const pdfStorageId = `pdf_${documentId}`;
        // delete previous file first to avoid ID collision
        try { const prev = extractFileIdFromViewUrl(doc.pdfFileId); if (prev) await storage.deleteFile(BUCKET_ID, prev); } catch (_) {}
        const upload = {
            uri: pdfFile.uri,
            name: pdfFileName,
            type: 'application/pdf',
        };
        const up = await uploadViaRest(BUCKET_ID, pdfStorageId, upload);
        result.pdfFileId = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${up.$id}/view?project=${project}`;
    }

    const payload = {
        title: data.title?.trim(),
        author: data.author?.trim(),
        category: data.category?.trim(),
        edition: data.edition?.trim(),
        pages: Number.isFinite(Number(data.pages)) ? Number(data.pages) : null,
        language: data.language?.trim(),
        publisher: data.publisher?.trim(),
        country: data.country?.trim(),
        ...(result.coverFileId ? { coverFileId: result.coverFileId } : {}),
        ...(result.pdfFileId ? { pdfFileId: result.pdfFileId } : {}),
    };

    return databases.updateDocument(DATABASE_ID, BOOKS_COLLECTION_ID, documentId, payload);
}


