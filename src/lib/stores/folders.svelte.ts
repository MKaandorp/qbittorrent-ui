import { browser } from '$app/environment';

const MAX = 8;
const KEY = 'qbt_recentFolders';

function createFoldersStore() {
	let folders = $state<string[]>([]);

	if (browser) {
		try {
			folders = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		} catch {
			folders = [];
		}
	}

	function add(path: string) {
		const p = path.trim();
		if (!p) return;
		folders = [p, ...folders.filter((f) => f !== p)].slice(0, MAX);
		if (browser) localStorage.setItem(KEY, JSON.stringify(folders));
	}

	function remove(path: string) {
		folders = folders.filter((f) => f !== path);
		if (browser) localStorage.setItem(KEY, JSON.stringify(folders));
	}

	return {
		get folders() {
			return folders;
		},
		add,
		remove
	};
}

export const foldersStore = createFoldersStore();
