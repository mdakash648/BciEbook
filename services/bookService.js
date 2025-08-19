import { databases, storage, account, client } from '../lib/appwrite';
import { Query } from 'appwrite';
import { CONFIG } from '../constants/Config';

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
const BOOKS_COLLECTION_ID = CONFIG.APPWRITE_BOOKS_COLLECTION_ID || 'books';
const BUCKET_ID = CONFIG.APPWRITE_COVER_BUCKET_ID;

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

/**
 * Simple and reliable filter query builder
 * Works with single-field indexes
 */
function buildFilterQueries(searchCriteria) {
	const queries = [];
	
	if (!searchCriteria || typeof searchCriteria !== 'object') {
		return queries;
	}

	console.log('Building queries for filters:', searchCriteria);

	// Map plural filter names to singular database field names
	const fieldMapping = {
		authors: 'author',
		categories: 'category', 
		languages: 'language',
		publishers: 'publisher',
		countries: 'country'
	};

	// Handle each filter field individually
	Object.entries(searchCriteria).forEach(([filterKey, values]) => {
		if (values && Array.isArray(values) && values.length > 0) {
			// Get the correct database field name
			const dbFieldName = fieldMapping[filterKey] || filterKey;
			
			if (values.length === 1) {
				// Single value - use Query.equal
				queries.push(Query.equal(dbFieldName, values[0]));
				console.log(`Added single query for field: ${dbFieldName} = "${values[0]}"`);
			} else {
				// Multiple values - use Query.or
				const fieldQueries = values.map(value => Query.equal(dbFieldName, value));
				queries.push(Query.or(fieldQueries));
				console.log(`Added OR query for field: ${dbFieldName} with ${fieldQueries.length} values`);
			}
		}
	});

	console.log('Generated queries:', queries.length);
	return queries;
}

/**
 * Main function to list books with multi-field filtering
 */
export async function listBooks(limit = null, offset = 0, searchCriteria = null) {
	await ensureAuth();
	
	// Legacy behavior for backward compatibility
	if (limit === null && offset === 0 && !searchCriteria) {
		console.log('Using legacy listBooks (no pagination)');
		const res = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, [
			Query.orderDesc('$createdAt')
		]);
		return res?.documents || [];
	}
	
	// Build filter queries
	const filterQueries = buildFilterQueries(searchCriteria);
	
	// Add ordering and pagination
	const queries = [
		Query.orderDesc('$createdAt'), // Always order by creation date
		...filterQueries
	];
	
	if (limit !== null) {
		queries.push(Query.limit(limit));
	}
	
	if (offset > 0) {
		queries.push(Query.offset(offset));
	}
	
	console.log('Final query array:', queries.length, 'queries');
	console.log('Search criteria:', searchCriteria);
	
	try {
		const res = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, queries);
		console.log('Query result:', { 
			total: res?.total, 
			count: res?.documents?.length,
			filters: searchCriteria 
		});
		
		return {
			documents: res?.documents || [],
			total: res?.total || 0
		};
	} catch (error) {
		console.error('Error querying books:', error);
		throw error;
	}
}

/**
 * Optimized function to get unique filter options
 */
export async function getFilterOptions() {
	await ensureAuth();
	
	try {
		// Get all books to extract unique values
		const res = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, [
			Query.orderDesc('$createdAt'),
			Query.limit(1000) // Limit to prevent memory issues
		]);
		
		const books = res?.documents || [];
		
		// Extract unique values using Set for O(1) lookup
		const uniqueValues = {
			authors: new Set(),
			categories: new Set(),
			languages: new Set(),
			publishers: new Set(),
			countries: new Set()
		};
		
		books.forEach(book => {
			if (book.author) uniqueValues.authors.add(book.author);
			if (book.category) uniqueValues.categories.add(book.category);
			if (book.language) uniqueValues.languages.add(book.language);
			if (book.publisher) uniqueValues.publishers.add(book.publisher);
			if (book.country) uniqueValues.countries.add(book.country);
		});
		
		// Convert Sets to sorted arrays
		const result = {
			authors: Array.from(uniqueValues.authors).sort(),
			categories: Array.from(uniqueValues.categories).sort(),
			languages: Array.from(uniqueValues.languages).sort(),
			publishers: Array.from(uniqueValues.publishers).sort(),
			countries: Array.from(uniqueValues.countries).sort()
		};
		
		console.log('Filter options loaded:', {
			authors: result.authors.length,
			categories: result.categories.length,
			languages: result.languages.length,
			publishers: result.publishers.length,
			countries: result.countries.length
		});
		
		return result;
	} catch (error) {
		console.error('Error getting filter options:', error);
		return {
			authors: [],
			categories: [],
			languages: [],
			publishers: [],
			countries: []
		};
	}
}

/**
 * Advanced search function with text search capabilities
 */
export async function searchBooks(searchTerm, limit = 20, offset = 0) {
	await ensureAuth();
	
	const queries = [
		Query.orderDesc('$createdAt')
	];
	
	if (searchTerm && searchTerm.trim()) {
		// Search across multiple text fields
		queries.push(Query.search('title', searchTerm));
		queries.push(Query.search('author', searchTerm));
		queries.push(Query.search('category', searchTerm));
	}
	
	if (limit) {
		queries.push(Query.limit(limit));
	}
	
	if (offset > 0) {
		queries.push(Query.offset(offset));
	}
	
	try {
		const res = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, queries);
		return {
			documents: res?.documents || [],
			total: res?.total || 0
		};
	} catch (error) {
		console.error('Error searching books:', error);
		throw error;
	}
}

export async function updateBook(documentId, data) {
	await ensureAuth();
	const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
	return databases.updateDocument(DATABASE_ID, BOOKS_COLLECTION_ID, documentId, payload);
}

function extractFileIdFromViewUrl(url) {
	if (!url || typeof url !== 'string') return null;
	const parts = url.split('/');
	const idx = parts.findIndex((p) => p === 'files');
	if (idx > -1 && parts[idx + 1]) return parts[idx + 1];
	return null;
}

export async function deleteBook(doc) {
	await ensureAuth();
	const coverId = extractFileIdFromViewUrl(doc?.coverFileId);
	const pdfId = extractFileIdFromViewUrl(doc?.pdfFileId);
	try { const { jwt } = await account.createJWT(); if (jwt) client.setJWT(jwt); } catch (_) {}
	try { if (coverId) await storage.deleteFile(BUCKET_ID, coverId); } catch (_) {}
	try { if (pdfId) await storage.deleteFile(BUCKET_ID, pdfId); } catch (_) {}
	return databases.deleteDocument(DATABASE_ID, BOOKS_COLLECTION_ID, doc.$id);
}

export async function updateBookWithFiles(doc, data, opts = {}) {
    await ensureAuth();
    const { coverFile, pdfFile } = opts;

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

/**
 * Test function to debug filtering
 * Use this to test your filters step by step
 */
export async function testFiltering() {
	console.log('=== Testing Filtering ===');
	
	try {
		// Test 1: Get all books first to see what data we have
		console.log('Test 1: Getting all books...');
		const allBooks = await listBooks(10, 0, null);
		console.log('All books count:', allBooks.documents.length);
		
		// Show sample data to understand the structure
		if (allBooks.documents.length > 0) {
			const sampleBook = allBooks.documents[0];
			console.log('Sample book data:', {
				author: sampleBook.author,
				category: sampleBook.category,
				language: sampleBook.language,
				publisher: sampleBook.publisher,
				country: sampleBook.country
			});
		}
		
		// Test 2: Test single author filter with real data
		if (allBooks.documents.length > 0) {
			const realAuthor = allBooks.documents[0].author;
			console.log('Test 2: Testing single author filter with:', realAuthor);
			const authorFilter = await listBooks(10, 0, { authors: [realAuthor] });
			console.log('Author filter result:', authorFilter.documents.length);
			
			// Test 3: Test single category filter with real data
			const realCategory = allBooks.documents[0].category;
			console.log('Test 3: Testing single category filter with:', realCategory);
			const categoryFilter = await listBooks(10, 0, { categories: [realCategory] });
			console.log('Category filter result:', categoryFilter.documents.length);
			
			// Test 4: Test multi-field filter with real data
			console.log('Test 4: Testing multi-field filter...');
			const multiFilter = await listBooks(10, 0, { 
				authors: [realAuthor], 
				categories: [realCategory] 
			});
			console.log('Multi-field filter result:', multiFilter.documents.length);
			
			// Test 5: Test multiple values per field
			if (allBooks.documents.length > 1) {
				const secondAuthor = allBooks.documents[1].author;
				console.log('Test 5: Testing multiple values per field...');
				const multipleValues = await listBooks(10, 0, { 
					authors: [realAuthor, secondAuthor] 
				});
				console.log('Multiple values result:', multipleValues.documents.length);
				
				return {
					allBooks: allBooks.documents.length,
					authorFilter: authorFilter.documents.length,
					categoryFilter: categoryFilter.documents.length,
					multiFilter: multiFilter.documents.length,
					multipleValues: multipleValues.documents.length,
					sampleData: {
						author: realAuthor,
						category: realCategory,
						secondAuthor: secondAuthor
					}
				};
			} else {
				return {
					allBooks: allBooks.documents.length,
					authorFilter: authorFilter.documents.length,
					categoryFilter: categoryFilter.documents.length,
					multiFilter: multiFilter.documents.length,
					multipleValues: 0,
					sampleData: {
						author: realAuthor,
						category: realCategory
					}
				};
			}
		} else {
			console.log('No books found in collection');
			return {
				allBooks: 0,
				authorFilter: 0,
				categoryFilter: 0,
				multiFilter: 0,
				multipleValues: 0,
				error: 'No books found'
			};
		}
		
	} catch (error) {
		console.error('Test failed:', error);
		throw error;
	}
}


