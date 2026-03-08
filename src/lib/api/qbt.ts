import type { Torrent } from '$lib/types';

function normalizeUrl(url: string): string {
	return url.replace(/\/+$/, '');
}

function extractSid(setCookieHeader: string | null): string | null {
	if (!setCookieHeader) return null;
	const match = setCookieHeader.match(/SID=([^;]+)/);
	return match ? match[1] : null;
}

export async function forwardLogin(
	serverUrl: string,
	username: string,
	password: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
	const base = normalizeUrl(serverUrl);
	const body = new URLSearchParams({ username, password });

	let res: Response;
	try {
		res = await fetch(`${base}/api/v2/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Origin: base,
				Referer: base
			},
			body: body.toString()
		});
	} catch {
		return { success: false, error: 'Cannot reach server' };
	}

	if (!res.ok) {
		return { success: false, error: `Server error: ${res.status}` };
	}

	const text = await res.text();
	if (text.trim() === 'Fails.') {
		return { success: false, error: 'Invalid username or password' };
	}

	const sid = extractSid(res.headers.get('set-cookie'));
	if (!sid) {
		return { success: false, error: 'No session cookie received' };
	}

	return { success: true, sid };
}

export async function forwardTorrentsInfo(serverUrl: string, sid: string): Promise<Torrent[]> {
	const base = normalizeUrl(serverUrl);

	const res = await fetch(`${base}/api/v2/torrents/info`, {
		headers: {
			Cookie: `SID=${sid}`,
			Referer: base
		}
	});

	if (res.status === 403) {
		throw Object.assign(new Error('Unauthorized'), { status: 401 });
	}

	if (!res.ok) {
		throw new Error(`QBT returned ${res.status}`);
	}

	return res.json();
}
