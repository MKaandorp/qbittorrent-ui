<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { loginRequest } from '$lib/api/client';

	let {
		open = $bindable(false),
		ondismiss
	}: {
		open?: boolean;
		ondismiss?: () => void;
	} = $props();

	let serverUrl = $state(settingsStore.serverUrl || '');
	let username = $state(settingsStore.username || '');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	const isFirstRun = $derived(!settingsStore.isConfigured);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;

		if (!serverUrl.trim()) {
			error = 'Server URL is required';
			return;
		}
		if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
			error = 'Server URL must start with http:// or https://';
			return;
		}
		if (!username.trim()) {
			error = 'Username is required';
			return;
		}
		if (!password) {
			error = 'Password is required';
			return;
		}

		loading = true;
		try {
			const result = await loginRequest(serverUrl.trim(), username.trim(), password);
			if (result.success) {
				settingsStore.setServerUrl(serverUrl.trim());
				settingsStore.setUsername(username.trim());
				settingsStore.setLoggedIn();
				open = false;
				ondismiss?.();
			} else {
				error = result.error ?? 'Login failed';
			}
		} catch {
			error = 'Network error. Check server URL.';
		} finally {
			loading = false;
		}
	}

	function handleBackdropClick() {
		if (!isFirstRun && settingsStore.isAuthenticated) {
			open = false;
			ondismiss?.();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-open modal" onclick={handleBackdropClick}>
		<div class="modal-box" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()}>
			<h3 class="mb-4 text-lg font-bold">
				{#if isFirstRun}
					Connect to QBittorrent
				{:else}
					Settings
				{/if}
			</h3>

			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<div class="form-control">
					<label class="label" for="serverUrl">
						<span class="label-text">Server URL</span>
					</label>
					<input
						id="serverUrl"
						type="text"
						class="input-bordered input"
						placeholder="http://192.168.1.1:8080"
						bind:value={serverUrl}
						disabled={loading}
					/>
				</div>

				<div class="form-control">
					<label class="label" for="username">
						<span class="label-text">Username</span>
					</label>
					<input
						id="username"
						type="text"
						class="input-bordered input"
						placeholder="admin"
						bind:value={username}
						disabled={loading}
					/>
				</div>

				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						class="input-bordered input"
						placeholder="••••••••"
						bind:value={password}
						disabled={loading}
					/>
				</div>

				{#if error}
					<div class="alert text-sm alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<div class="modal-action">
					{#if !isFirstRun && settingsStore.isAuthenticated}
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => {
								open = false;
								ondismiss?.();
							}}
						>
							Cancel
						</button>
					{/if}
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-sm loading-spinner"></span>
						{/if}
						Connect
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
