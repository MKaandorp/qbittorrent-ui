<script lang="ts">
	import { browser } from '$app/environment';
	import type { Torrent } from '$lib/types';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { torrentsStore } from '$lib/stores/torrents.svelte';
	import { logoutRequest } from '$lib/api/client';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import AddTorrentModal from '$lib/components/AddTorrentModal.svelte';
	import TorrentDetailModal from '$lib/components/TorrentDetailModal.svelte';
	import TorrentTable from '$lib/components/TorrentTable.svelte';
	import TorrentCard from '$lib/components/TorrentCard.svelte';

	let showModal = $state(!settingsStore.isAuthenticated);
	let showAddModal = $state(false);
	let selectedTorrent = $state<Torrent | null>(null);
	let showDetail = $state(false);
	let pendingFile = $state<File | null>(null);
	let pendingMagnet = $state('');

	$effect(() => {
		if (!browser) return;

		// Handle magnet link from URL (protocol_handlers)
		const magnetParam = new URLSearchParams(window.location.search).get('magnet');
		if (magnetParam) {
			pendingMagnet = magnetParam;
			showAddModal = true;
			history.replaceState({}, '', '/');
		}

		// Handle .torrent file from OS file association (File Handling API)
		if ('launchQueue' in window) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).launchQueue.setConsumer(async (launchParams: any) => {
				if (launchParams.files.length > 0) {
					const fileHandle = launchParams.files[0];
					const file: File = await fileHandle.getFile();
					if (file.name.endsWith('.torrent')) {
						pendingFile = file;
						showAddModal = true;
					}
				}
			});
		}
	});

	function selectTorrent(torrent: Torrent) {
		selectedTorrent = torrent;
		showDetail = true;
	}

	function openSettings() {
		showModal = true;
	}

	async function logout() {
		await logoutRequest(settingsStore.serverUrl);
		settingsStore.clearSession();
		torrentsStore.stopPolling();
		showModal = true;
	}

	function onModalDismiss() {
		if (settingsStore.isAuthenticated) {
			torrentsStore.fetch();
			torrentsStore.startPolling(5000, () => {
				showModal = true;
			});
		}
	}

	$effect(() => {
		if (settingsStore.isAuthenticated) {
			torrentsStore.fetch();
			torrentsStore.startPolling(5000, () => {
				showModal = true;
			});
		}
		return () => {
			torrentsStore.stopPolling();
		};
	});
</script>

<div class="min-h-screen bg-base-200">
	<nav class="navbar bg-base-100 px-4 shadow-sm">
		<div class="flex-1">
			<span class="text-xl font-bold">qBittorrent</span>
			{#if torrentsStore.refreshing}
				<span class="loading ml-2 loading-xs loading-dots text-primary"></span>
			{/if}
		</div>
		<div class="flex flex-none items-center gap-2">
			{#if settingsStore.isAuthenticated}
				<span class="hidden text-sm text-base-content/60 sm:inline">
					{settingsStore.username}@{settingsStore.serverUrl.replace(/https?:\/\//, '')}
				</span>
				<button class="btn btn-sm btn-primary" onclick={() => (showAddModal = true)}>
					+ Add
				</button>
				<button class="btn btn-ghost btn-sm" onclick={openSettings} aria-label="Settings">
					⚙️
				</button>
				<button class="btn btn-ghost btn-sm" onclick={logout}> Logout </button>
			{/if}
		</div>
	</nav>

	<main class="container mx-auto p-4">
		{#if !settingsStore.isAuthenticated}
			<div class="flex h-64 items-center justify-center">
				<div class="text-center text-base-content/50">
					<p>Not connected. Please configure settings.</p>
					<button class="btn mt-4 btn-primary" onclick={openSettings}>Connect</button>
				</div>
			</div>
		{:else if torrentsStore.loading}
			<div class="flex h-64 items-center justify-center">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if torrentsStore.error}
			<div class="alert alert-error">
				<span>{torrentsStore.error}</span>
				<button class="btn btn-ghost btn-sm" onclick={() => torrentsStore.fetch()}>Retry</button>
			</div>
		{:else}
			<div class="mb-4">
				<input
					type="search"
					class="input-bordered input w-full max-w-sm"
					placeholder="Filter torrents…"
					value={torrentsStore.filterText}
					oninput={(e) => torrentsStore.setFilter((e.target as HTMLInputElement).value)}
				/>
				<span class="ml-2 text-sm text-base-content/60">
					{torrentsStore.sorted.length} torrent{torrentsStore.sorted.length === 1 ? '' : 's'}
				</span>
			</div>

			<!-- Desktop table -->
			<div class="hidden md:block">
				<TorrentTable torrents={torrentsStore.sorted} onselect={selectTorrent} />
			</div>

			<!-- Mobile cards -->
			<div class="flex flex-col gap-3 md:hidden">
				{#each torrentsStore.sorted as torrent (torrent.hash)}
					<TorrentCard {torrent} onclick={() => selectTorrent(torrent)} />
				{:else}
					<p class="text-center text-base-content/50 py-8">No torrents found</p>
				{/each}
			</div>
		{/if}
	</main>
</div>

<SettingsModal bind:open={showModal} ondismiss={onModalDismiss} />
<AddTorrentModal
	bind:open={showAddModal}
	initialFile={pendingFile}
	initialMagnet={pendingMagnet}
	onadded={() => {
		pendingFile = null;
		pendingMagnet = '';
		torrentsStore.fetch();
	}}
/>
<TorrentDetailModal
	bind:open={showDetail}
	bind:torrent={selectedTorrent}
	ondeleted={() => torrentsStore.fetch()}
/>
