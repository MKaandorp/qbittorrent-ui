import type { Torrent } from '$lib/types';
import { getTorrents } from '$lib/api/client';
import { settingsStore } from './settings.svelte';

type SortKey = keyof Pick<
	Torrent,
	'name' | 'size' | 'progress' | 'dlspeed' | 'upspeed' | 'ratio' | 'eta' | 'added_on'
>;

function createTorrentsStore() {
	let list = $state<Torrent[]>([]);
	let loading = $state(false);
	let refreshing = $state(false);
	let error = $state<string | null>(null);
	let filterText = $state('');
	let sortKey = $state<SortKey>('name');
	let sortAsc = $state(true);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let onUnauthorized: (() => void) | null = null;

	const filtered = $derived(
		filterText.trim()
			? list.filter((t) => t.name.toLowerCase().includes(filterText.toLowerCase()))
			: list
	);

	const sorted = $derived(
		[...filtered].sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			if (typeof av === 'string' && typeof bv === 'string') {
				return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
			}
			const an = av as number;
			const bn = bv as number;
			return sortAsc ? an - bn : bn - an;
		})
	);

	async function fetch(isBackground = false) {
		const { serverUrl, sid } = settingsStore;
		if (!serverUrl || !sid) return;

		if (!isBackground) loading = true;
		else refreshing = true;
		error = null;

		try {
			const torrents = await getTorrents(serverUrl, sid);
			list = torrents;
		} catch (err) {
			if (err instanceof Error) {
				if (err.message === 'UNAUTHORIZED') {
					settingsStore.clearSession();
					onUnauthorized?.();
				} else {
					error = err.message;
				}
			}
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	function startPolling(ms = 5000, handleUnauthorized?: () => void) {
		if (handleUnauthorized) onUnauthorized = handleUnauthorized;
		stopPolling();

		const tick = async () => {
			if (document.visibilityState === 'hidden') return;
			await fetch(true);
		};

		pollInterval = setInterval(tick, ms);
	}

	function stopPolling() {
		if (pollInterval !== null) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	function setFilter(text: string) {
		filterText = text;
	}

	return {
		get list() {
			return list;
		},
		get loading() {
			return loading;
		},
		get refreshing() {
			return refreshing;
		},
		get error() {
			return error;
		},
		get filtered() {
			return filtered;
		},
		get sorted() {
			return sorted;
		},
		get sortKey() {
			return sortKey;
		},
		get sortAsc() {
			return sortAsc;
		},
		get filterText() {
			return filterText;
		},
		fetch,
		startPolling,
		stopPolling,
		setSort,
		setFilter
	};
}

export const torrentsStore = createTorrentsStore();
