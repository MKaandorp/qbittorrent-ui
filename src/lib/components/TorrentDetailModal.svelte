<script lang="ts">
	import type { Torrent } from '$lib/types';
	import { formatBytes, formatSpeed, formatEta, formatRatio } from '$lib/utils/format';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { deleteTorrent } from '$lib/api/client';
	import ProgressBar from './ProgressBar.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let {
		torrent = $bindable(null),
		open = $bindable(false),
		ondeleted
	}: {
		torrent?: Torrent | null;
		open?: boolean;
		ondeleted?: () => void;
	} = $props();

	let confirming = $state(false);
	let deleteFiles = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	function close() {
		open = false;
		torrent = null;
		confirming = false;
		deleteFiles = false;
		deleteError = null;
	}

	async function confirmDelete() {
		if (!torrent) return;
		deleting = true;
		deleteError = null;
		try {
			await deleteTorrent(settingsStore.serverUrl, torrent.hash, deleteFiles);
			close();
			ondeleted?.();
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete';
		} finally {
			deleting = false;
		}
	}

	function formatDate(ts: number): string {
		if (ts <= 0) return '—';
		return new Date(ts * 1000).toLocaleString();
	}
</script>

{#if open && torrent}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-open modal" onclick={close}>
		<div
			class="modal-box w-11/12 max-w-2xl"
			role="dialog"
			aria-labelledby="detail-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<button class="btn absolute top-3 right-3 btn-circle btn-ghost btn-sm" onclick={close}>
				✕
			</button>

			<h3 id="detail-title" class="mb-1 pr-8 text-base font-bold" title={torrent.name}>
				{torrent.name}
			</h3>
			<div class="mb-4 flex items-center gap-2">
				<StatusBadge state={torrent.state} />
				{#if torrent.category}
					<span class="badge badge-outline badge-sm">{torrent.category}</span>
				{/if}
			</div>

			<div class="mb-4">
				<ProgressBar value={torrent.progress} />
				<span class="text-xs text-base-content/60">{Math.round(torrent.progress * 100)}%</span>
			</div>

			<div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
				<div>
					<p class="text-xs text-base-content/50">Size</p>
					<p class="font-medium">{formatBytes(torrent.size)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Downloaded</p>
					<p class="font-medium">{formatBytes(torrent.downloaded)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Uploaded</p>
					<p class="font-medium">{formatBytes(torrent.uploaded)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Download</p>
					<p class="font-medium text-primary">↓ {formatSpeed(torrent.dlspeed)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Upload</p>
					<p class="font-medium text-secondary">↑ {formatSpeed(torrent.upspeed)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">ETA</p>
					<p class="font-medium">{formatEta(torrent.eta)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Seeds</p>
					<p class="font-medium">{torrent.num_seeds}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Peers</p>
					<p class="font-medium">{torrent.num_leechs}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Ratio</p>
					<p class="font-medium">{formatRatio(torrent.ratio)}</p>
				</div>
				<div class="col-span-2 sm:col-span-3">
					<p class="text-xs text-base-content/50">Save path</p>
					<p class="truncate font-mono text-xs">{torrent.save_path}</p>
				</div>
				{#if torrent.tracker}
					<div class="col-span-2 sm:col-span-3">
						<p class="text-xs text-base-content/50">Tracker</p>
						<p class="truncate font-mono text-xs">{torrent.tracker}</p>
					</div>
				{/if}
				<div>
					<p class="text-xs text-base-content/50">Added</p>
					<p class="text-xs">{formatDate(torrent.added_on)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Completed</p>
					<p class="text-xs">{formatDate(torrent.completion_on)}</p>
				</div>
				<div>
					<p class="text-xs text-base-content/50">Hash</p>
					<p class="truncate font-mono text-xs">{torrent.hash}</p>
				</div>
			</div>

			<!-- Delete section -->
			<div class="mt-6 border-t border-base-300 pt-4">
				{#if !confirming}
					<button class="btn btn-outline btn-sm btn-error" onclick={() => (confirming = true)}>
						Delete torrent
					</button>
				{:else}
					<div class="flex flex-col gap-3">
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="checkbox"
								class="checkbox checkbox-sm checkbox-error"
								bind:checked={deleteFiles}
								disabled={deleting}
							/>
							<span class="label-text text-error">Also delete downloaded files</span>
						</label>
						{#if deleteError}
							<p class="text-sm text-error">{deleteError}</p>
						{/if}
						<div class="flex gap-2">
							<button class="btn btn-sm btn-error" onclick={confirmDelete} disabled={deleting}>
								{#if deleting}
									<span class="loading loading-xs loading-spinner"></span>
								{/if}
								Confirm delete
							</button>
							<button
								class="btn btn-ghost btn-sm"
								onclick={() => {
									confirming = false;
									deleteFiles = false;
									deleteError = null;
								}}
								disabled={deleting}
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
