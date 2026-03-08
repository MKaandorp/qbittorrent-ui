import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { forwardLogin } from '$lib/api/qbt';

export const POST: RequestHandler = async ({ request }) => {
	let body: { serverUrl?: string; username?: string; password?: string };

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { serverUrl, username, password } = body;

	if (!serverUrl || !username || !password) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const result = await forwardLogin(serverUrl, username, password);

	if (!result.success) {
		return json({ error: result.error }, { status: 401 });
	}

	return json({ success: true, sid: result.sid });
};
