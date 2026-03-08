<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { torrentsStore } from '$lib/stores/torrents.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import TorrentTable from '$lib/components/TorrentTable.svelte';
	import TorrentCard from '$lib/components/TorrentCard.svelte';

	let showModal = $state(!settingsStore.isAuthenticated);

	function openSettings() {
		showModal = true;
	}

	function logout() {
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
				<TorrentTable torrents={torrentsStore.sorted} />
			</div>

			<!-- Mobile cards -->
			<div class="block flex flex-col gap-3 md:hidden">
				{#each torrentsStore.sorted as torrent (torrent.hash)}
					<TorrentCard {torrent} />
				{:else}
					<p class="text-center text-base-content/50 py-8">No torrents found</p>
				{/each}
			</div>
		{/if}
	</main>
</div>

<SettingsModal bind:open={showModal} ondismiss={onModalDismiss} />
