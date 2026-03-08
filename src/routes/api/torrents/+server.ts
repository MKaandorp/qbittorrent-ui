import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { forwardTorrentsInfo } from '$lib/api/qbt';

export const GET: RequestHandler = async ({ request }) => {
	const serverUrl = request.headers.get('X-QBT-Server');
	const sid = request.headers.get('X-QBT-SID');

	if (!serverUrl || !sid) {
		return json({ error: 'Missing server or session headers' }, { status: 400 });
	}

	try {
		const torrents = await forwardTorrentsInfo(serverUrl, sid);
		return json(torrents);
	} catch (err) {
		if (
			err instanceof Error &&
			'status' in err &&
			(err as NodeJS.ErrnoException & { status: number }).status === 401
		) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		return json({ error: 'Failed to fetch torrents' }, { status: 502 });
	}
};
