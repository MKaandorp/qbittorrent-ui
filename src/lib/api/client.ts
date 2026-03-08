import type { Torrent } from '$lib/types';

function apiBase(serverUrl: string) {
	return `${serverUrl.replace(/\/+$/, '')}/api/v2`;
}

export async function loginRequest(
	serverUrl: string,
	username: string,
	password: string
): Promise<{ success: boolean; error?: string }> {
	let res: Response;
	try {
		res = await fetch(`${apiBase(serverUrl)}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ username, password }),
			credentials: 'include'
		});
	} catch {
		return { success: false, error: 'Cannot reach server' };
	}

	if (!res.ok) return { success: false, error: `Server error: ${res.status}` };

	const text = await res.text();
	if (text.trim() === 'Fails.') return { success: false, error: 'Invalid username or password' };

	return { success: true };
}

export async function logoutRequest(serverUrl: string): Promise<void> {
	await fetch(`${apiBase(serverUrl)}/auth/logout`, {
		method: 'POST',
		credentials: 'include'
	}).catch(() => {});
}

export async function getTorrents(serverUrl: string): Promise<Torrent[]> {
	const res = await fetch(`${apiBase(serverUrl)}/torrents/info`, {
		credentials: 'include'
	});

	if (res.status === 403) throw new Error('UNAUTHORIZED');
	if (!res.ok) throw new Error(`Failed to fetch torrents: ${res.status}`);

	return res.json();
}

export async function deleteTorrent(
	serverUrl: string,
	hash: string,
	deleteFiles: boolean
): Promise<void> {
	const form = new FormData();
	form.append('hashes', hash);
	form.append('deleteFiles', deleteFiles ? 'true' : 'false');

	const res = await fetch(`${apiBase(serverUrl)}/torrents/delete`, {
		method: 'POST',
		credentials: 'include',
		body: form
	});

	if (res.status === 403) throw new Error('UNAUTHORIZED');
	if (!res.ok) throw new Error(`Server error: ${res.status}`);
}

export async function addTorrent(
	serverUrl: string,
	data: { urls?: string; file?: File; savePath?: string; paused?: boolean; category?: string }
): Promise<void> {
	const form = new FormData();
	if (data.urls) form.append('urls', data.urls);
	if (data.file) form.append('torrents', data.file);
	if (data.savePath) form.append('savepath', data.savePath);
	if (data.category) form.append('category', data.category);
	if (data.paused !== undefined) form.append('paused', data.paused ? 'true' : 'false');

	const res = await fetch(`${apiBase(serverUrl)}/torrents/add`, {
		method: 'POST',
		credentials: 'include',
		body: form
	});

	if (res.status === 403) throw new Error('UNAUTHORIZED');
	if (!res.ok) throw new Error(`Server error: ${res.status}`);

	const text = await res.text();
	if (text.trim() === 'Fails.') throw new Error('Failed to add torrent');
}
