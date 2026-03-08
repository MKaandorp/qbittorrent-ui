<script lang="ts">
	import type { TorrentState } from '$lib/types';

	let { state }: { state: TorrentState } = $props();

	const STATE_MAP: Record<TorrentState, { label: string; color: string }> = {
		downloading: { label: 'Downloading', color: 'badge-primary' },
		forcedDL: { label: 'Forced DL', color: 'badge-primary' },
		metaDL: { label: 'Fetching', color: 'badge-primary' },
		uploading: { label: 'Seeding', color: 'badge-success' },
		forcedUP: { label: 'Forced UP', color: 'badge-success' },
		stalledUP: { label: 'Stalled', color: 'badge-warning' },
		stalledDL: { label: 'Stalled', color: 'badge-warning' },
		pausedDL: { label: 'Paused', color: 'badge-neutral' },
		pausedUP: { label: 'Paused', color: 'badge-neutral' },
		queuedDL: { label: 'Queued', color: 'badge-neutral' },
		queuedUP: { label: 'Queued', color: 'badge-neutral' },
		checkingDL: { label: 'Checking', color: 'badge-info' },
		checkingUP: { label: 'Checking', color: 'badge-info' },
		checkingResumeData: { label: 'Checking', color: 'badge-info' },
		allocating: { label: 'Allocating', color: 'badge-info' },
		moving: { label: 'Moving', color: 'badge-info' },
		missingFiles: { label: 'Missing', color: 'badge-error' },
		error: { label: 'Error', color: 'badge-error' },
		unknown: { label: 'Unknown', color: 'badge-ghost' }
	};

	const info = $derived(STATE_MAP[state] ?? { label: state, color: 'badge-ghost' });
</script>

<span class="badge badge-sm {info.color}">{info.label}</span>
