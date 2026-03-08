import type { LoginResult, Torrent } from '$lib/types';

export async function loginRequest(
	serverUrl: string,
	username: string,
	password: string
): Promise<LoginResult> {
	const res = await fetch('/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ serverUrl, username, password })
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({ error: 'Login failed' }));
		return { success: false, error: data.error ?? 'Login failed' };
	}

	const data = await res.json();
	return data as LoginResult;
}

export async function getTorrents(serverUrl: string, sid: string): Promise<Torrent[]> {
	const res = await fetch('/api/torrents', {
		headers: {
			'X-QBT-Server': serverUrl,
			'X-QBT-SID': sid
		}
	});

	if (res.status === 401) {
		throw new Error('UNAUTHORIZED');
	}

	if (!res.ok) {
		throw new Error(`Failed to fetch torrents: ${res.status}`);
	}

	return res.json();
}
