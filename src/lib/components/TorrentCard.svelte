<script lang="ts">
	import type { Torrent } from '$lib/types';
	import { formatBytes, formatSpeed, formatEta, formatRatio } from '$lib/utils/format';
	import ProgressBar from './ProgressBar.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let { torrent, onclick }: { torrent: Torrent; onclick?: () => void } = $props();
</script>

<button
	type="button"
	class="card w-full cursor-pointer border border-base-200 bg-base-100 text-left shadow-sm transition-shadow hover:shadow-md"
	{onclick}
>
	<div class="card-body gap-2 p-4">
		<h3 class="card-title truncate text-sm" title={torrent.name}>{torrent.name}</h3>
		<div class="flex items-center gap-2">
			<StatusBadge state={torrent.state} />
			<span class="text-xs text-base-content/60">{formatBytes(torrent.size)}</span>
			<span class="ml-auto text-xs text-base-content/60">η {formatEta(torrent.eta)}</span>
		</div>
		<ProgressBar value={torrent.progress} />
		<div class="flex justify-between text-xs">
			<span>{Math.round(torrent.progress * 100)}%</span>
			<span class="text-primary">↓ {formatSpeed(torrent.dlspeed)}</span>
			<span class="text-secondary">↑ {formatSpeed(torrent.upspeed)}</span>
			<span>ratio {formatRatio(torrent.ratio)}</span>
		</div>
	</div>
</button>
