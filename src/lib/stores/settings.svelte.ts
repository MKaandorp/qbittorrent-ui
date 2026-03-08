import { browser } from '$app/environment';

function createSettingsStore() {
	let serverUrl = $state('');
	let username = $state('');
	let sid = $state<string | null>(null);

	if (browser) {
		serverUrl = localStorage.getItem('qbt_serverUrl') ?? '';
		username = localStorage.getItem('qbt_username') ?? '';
		sid = localStorage.getItem('qbt_sid') ?? null;
	}

	const isConfigured = $derived(serverUrl.length > 0 && username.length > 0);
	const isAuthenticated = $derived(isConfigured && sid !== null);

	function setServerUrl(url: string) {
		serverUrl = url.replace(/\/+$/, '');
		if (browser) localStorage.setItem('qbt_serverUrl', serverUrl);
	}

	function setUsername(name: string) {
		username = name;
		if (browser) localStorage.setItem('qbt_username', username);
	}

	function storeSid(newSid: string) {
		sid = newSid;
		if (browser) localStorage.setItem('qbt_sid', newSid);
	}

	function clearSession() {
		sid = null;
		if (browser) localStorage.removeItem('qbt_sid');
	}

	function clearAll() {
		serverUrl = '';
		username = '';
		sid = null;
		if (browser) {
			localStorage.removeItem('qbt_serverUrl');
			localStorage.removeItem('qbt_username');
			localStorage.removeItem('qbt_sid');
		}
	}

	return {
		get serverUrl() {
			return serverUrl;
		},
		get username() {
			return username;
		},
		get sid() {
			return sid;
		},
		get isConfigured() {
			return isConfigured;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		setServerUrl,
		setUsername,
		storeSid,
		clearSession,
		clearAll
	};
}

export const settingsStore = createSettingsStore();
