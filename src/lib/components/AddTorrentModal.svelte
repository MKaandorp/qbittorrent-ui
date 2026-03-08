<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { addTorrent } from '$lib/api/client';

	let {
		open = $bindable(false),
		onadded
	}: {
		open?: boolean;
		onadded?: () => void;
	} = $props();

	type Tab = 'magnet' | 'file';
	let activeTab = $state<Tab>('magnet');
	let magnetUrl = $state('');
	let torrentFile = $state<File | null>(null);
	let savePath = $state('');
	let category = $state('');
	let paused = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	function reset() {
		magnetUrl = '';
		torrentFile = null;
		savePath = '';
		category = '';
		paused = false;
		error = null;
		activeTab = 'magnet';
	}

	function close() {
		open = false;
		reset();
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		torrentFile = input.files?.[0] ?? null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;

		const { serverUrl } = settingsStore;

		if (activeTab === 'magnet' && !magnetUrl.trim()) {
			error = 'Please enter a magnet link or URL';
			return;
		}
		if (activeTab === 'file' && !torrentFile) {
			error = 'Please select a torrent file';
			return;
		}

		loading = true;
		try {
			await addTorrent(serverUrl, {
				urls: activeTab === 'magnet' ? magnetUrl.trim() : undefined,
				file: activeTab === 'file' ? (torrentFile ?? undefined) : undefined,
				savePath: savePath.trim() || undefined,
				category: category.trim() || undefined,
				paused
			});
			close();
			onadded?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add torrent';
		} finally {
			loading = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-open modal" onclick={close}>
		<div
			class="modal-box w-11/12 max-w-lg"
			role="dialog"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<button class="btn absolute top-3 right-3 btn-circle btn-ghost btn-sm" onclick={close}>
				✕
			</button>

			<h3 class="mb-4 text-lg font-bold">Add Torrent</h3>

			<div role="tablist" class="tabs-bordered mb-4 tabs">
				<button
					role="tab"
					class="tab {activeTab === 'magnet' ? 'tab-active' : ''}"
					onclick={() => (activeTab = 'magnet')}
				>
					Magnet / URL
				</button>
				<button
					role="tab"
					class="tab {activeTab === 'file' ? 'tab-active' : ''}"
					onclick={() => (activeTab = 'file')}
				>
					Torrent File
				</button>
			</div>

			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				{#if activeTab === 'magnet'}
					<div class="form-control">
						<label class="label" for="magnetUrl">
							<span class="label-text">Magnet link or URL</span>
						</label>
						<textarea
							id="magnetUrl"
							class="textarea-bordered textarea h-24 font-mono text-sm"
							placeholder="magnet:?xt=urn:btih:..."
							bind:value={magnetUrl}
							disabled={loading}
						></textarea>
					</div>
				{:else}
					<div class="form-control">
						<label class="label" for="torrentFile">
							<span class="label-text">Torrent file (.torrent)</span>
						</label>
						<input
							id="torrentFile"
							type="file"
							accept=".torrent"
							class="file-input-bordered file-input w-full"
							onchange={onFileChange}
							disabled={loading}
						/>
					</div>
				{/if}

				<div class="collapse-arrow collapse border border-base-300">
					<input type="checkbox" />
					<div class="collapse-title text-sm font-medium">Options</div>
					<div class="collapse-content flex flex-col gap-3">
						<div class="form-control">
							<label class="label" for="savePath">
								<span class="label-text">Save path</span>
							</label>
							<input
								id="savePath"
								type="text"
								class="input-bordered input input-sm"
								placeholder="Leave blank for default"
								bind:value={savePath}
								disabled={loading}
							/>
						</div>
						<div class="form-control">
							<label class="label" for="category">
								<span class="label-text">Category</span>
							</label>
							<input
								id="category"
								type="text"
								class="input-bordered input input-sm"
								placeholder="Optional"
								bind:value={category}
								disabled={loading}
							/>
						</div>
						<div class="form-control">
							<label class="label cursor-pointer justify-start gap-3">
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									bind:checked={paused}
									disabled={loading}
								/>
								<span class="label-text">Add paused</span>
							</label>
						</div>
					</div>
				</div>

				{#if error}
					<div class="alert text-sm alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={close} disabled={loading}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-sm loading-spinner"></span>
						{/if}
						Add
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
