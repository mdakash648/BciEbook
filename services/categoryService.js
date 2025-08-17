import { ID, Permission, Role } from 'appwrite';
import { databases, account, client } from '../lib/appwrite';
import { CONFIG } from '../constants/Config';

const DATABASE_ID = CONFIG.APPWRITE_DATABASE_ID;
const CATEGORIES_COLLECTION_ID = CONFIG.APPWRITE_CATEGORIES_COLLECTION_ID || 'categories';

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

export async function createCategory({ name, description }) {
	if (!name?.trim()) throw new Error('Category name is required');
	await ensureAuth();
	const doc = await databases.createDocument(
		DATABASE_ID,
		CATEGORIES_COLLECTION_ID,
		ID.unique(),
		{
			name: name.trim(),
			description: description?.trim() || '',
		},
		[Permission.read(Role.any()), Permission.update(Role.users())]
	);
	return doc;
}

export async function listCategories() {
	await ensureAuth();
	const res = await databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, []);
	return res?.documents || [];
}


