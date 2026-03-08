import { browser } from '$app/environment';

function createSettingsStore() {
	let serverUrl = $state('');
	let username = $state('');
	let isLoggedIn = $state(false);

	if (browser) {
		serverUrl = localStorage.getItem('qbt_serverUrl') ?? '';
		username = localStorage.getItem('qbt_username') ?? '';
		isLoggedIn = localStorage.getItem('qbt_loggedIn') === 'true';
	}

	const isConfigured = $derived(serverUrl.length > 0 && username.length > 0);
	const isAuthenticated = $derived(isConfigured && isLoggedIn);

	function setServerUrl(url: string) {
		serverUrl = url.replace(/\/+$/, '');
		if (browser) localStorage.setItem('qbt_serverUrl', serverUrl);
	}

	function setUsername(name: string) {
		username = name;
		if (browser) localStorage.setItem('qbt_username', username);
	}

	function setLoggedIn() {
		isLoggedIn = true;
		if (browser) localStorage.setItem('qbt_loggedIn', 'true');
	}

	function clearSession() {
		isLoggedIn = false;
		if (browser) localStorage.removeItem('qbt_loggedIn');
	}

	function clearAll() {
		serverUrl = '';
		username = '';
		isLoggedIn = false;
		if (browser) {
			localStorage.removeItem('qbt_serverUrl');
			localStorage.removeItem('qbt_username');
			localStorage.removeItem('qbt_loggedIn');
		}
	}

	return {
		get serverUrl() {
			return serverUrl;
		},
		get username() {
			return username;
		},
		get isConfigured() {
			return isConfigured;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		setServerUrl,
		setUsername,
		setLoggedIn,
		clearSession,
		clearAll
	};
}

export const settingsStore = createSettingsStore();
