<script lang="ts">
	import type { Torrent } from '$lib/types';
	import type { SortKey } from '$lib/stores/torrents.svelte';
	import { torrentsStore } from '$lib/stores/torrents.svelte';
	import TorrentRow from './TorrentRow.svelte';

	let { torrents, onselect }: { torrents: Torrent[]; onselect?: (torrent: Torrent) => void } =
		$props();

	type Col = { label: string; key?: SortKey };
	const columns: Col[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'size', label: 'Size' },
		{ key: 'progress', label: 'Progress' },
		{ key: 'added_on', label: 'Added On' },
		{ label: 'Status' },
		{ key: 'dlspeed', label: 'Download' },
		{ key: 'upspeed', label: 'Upload' },
		{ key: 'eta', label: 'ETA' },
		{ key: 'ratio', label: 'Ratio' }
	];
</script>

<div class="overflow-x-auto">
	<table class="table w-full table-zebra">
		<thead>
			<tr>
				{#each columns as col (col.label)}
					<th>
						{#if col.key}
							<button
								class="flex items-center gap-1 transition-colors hover:text-primary"
								onclick={() => torrentsStore.setSort(col.key!)}
							>
								{col.label}
								{#if torrentsStore.sortKey === col.key}
									<span>{torrentsStore.sortAsc ? '↑' : '↓'}</span>
								{/if}
							</button>
						{:else}
							{col.label}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each torrents as torrent (torrent.hash)}
				<TorrentRow {torrent} onclick={() => onselect?.(torrent)} />
			{:else}
				<tr>
					<td colspan="9" class="py-8 text-center text-base-content/50">No torrents found</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
