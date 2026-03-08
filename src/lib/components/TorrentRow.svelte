<script lang="ts">
	import type { Torrent } from '$lib/types';
	import { formatBytes, formatSpeed, formatEta, formatRatio } from '$lib/utils/format';
	import ProgressBar from './ProgressBar.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let { torrent }: { torrent: Torrent } = $props();
</script>

<tr>
	<td class="max-w-xs truncate font-medium" title={torrent.name}>{torrent.name}</td>
	<td>{formatBytes(torrent.size)}</td>
	<td class="w-28">
		<ProgressBar value={torrent.progress} />
		<span class="text-xs text-base-content/60">{Math.round(torrent.progress * 100)}%</span>
	</td>
	<td><StatusBadge state={torrent.state} /></td>
	<td class="text-primary">↓ {formatSpeed(torrent.dlspeed)}</td>
	<td class="text-secondary">↑ {formatSpeed(torrent.upspeed)}</td>
	<td>{formatEta(torrent.eta)}</td>
	<td>{formatRatio(torrent.ratio)}</td>
</tr>
