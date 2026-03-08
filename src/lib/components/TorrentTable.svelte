<script lang="ts">
	import type { Torrent } from '$lib/types';
	import { torrentsStore } from '$lib/stores/torrents.svelte';
	import TorrentRow from './TorrentRow.svelte';

	let { torrents, onselect }: { torrents: Torrent[]; onselect?: (torrent: Torrent) => void } =
		$props();

	type Col = { key: Parameters<typeof torrentsStore.setSort>[0]; label: string };
	const columns: Col[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'size', label: 'Size' },
		{ key: 'progress', label: 'Progress' },
		{ key: 'added_on', label: 'Added On' }
	];
</script>

<div class="overflow-x-auto">
	<table class="table w-full table-zebra">
		<thead>
			<tr>
				{#each columns as col (col.key)}
					<th>
						<button
							class="flex items-center gap-1 transition-colors hover:text-primary"
							onclick={() => torrentsStore.setSort(col.key)}
						>
							{col.label}
							{#if torrentsStore.sortKey === col.key}
								<span>{torrentsStore.sortAsc ? '↑' : '↓'}</span>
							{/if}
						</button>
					</th>
				{/each}
				<th>Status</th>
				<th>
					<button
						class="flex items-center gap-1 transition-colors hover:text-primary"
						onclick={() => torrentsStore.setSort('dlspeed')}
					>
						Download
						{#if torrentsStore.sortKey === 'dlspeed'}
							<span>{torrentsStore.sortAsc ? '↑' : '↓'}</span>
						{/if}
					</button>
				</th>
				<th>
					<button
						class="flex items-center gap-1 transition-colors hover:text-primary"
						onclick={() => torrentsStore.setSort('upspeed')}
					>
						Upload
						{#if torrentsStore.sortKey === 'upspeed'}
							<span>{torrentsStore.sortAsc ? '↑' : '↓'}</span>
						{/if}
					</button>
				</th>
				<th>
					<button
						class="flex items-center gap-1 transition-colors hover:text-primary"
						onclick={() => torrentsStore.setSort('eta')}
					>
						ETA
						{#if torrentsStore.sortKey === 'eta'}
							<span>{torrentsStore.sortAsc ? '↑' : '↓'}</span>
						{/if}
					</button>
				</th>
				<th>
					<button
						class="flex items-center gap-1 transition-colors hover:text-primary"
						onclick={() => torrentsStore.setSort('ratio')}
					>
						Ratio
						{#if torrentsStore.sortKey === 'ratio'}
							<span>{torrentsStore.sortAsc ? '↑' : '↓'}</span>
						{/if}
					</button>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each torrents as torrent (torrent.hash)}
				<TorrentRow {torrent} onclick={() => onselect?.(torrent)} />
			{:else}
				<tr>
					<td colspan="9" class="text-center text-base-content/50 py-8">No torrents found</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
