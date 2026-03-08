import { test, expect } from '@playwright/test';

async function setStoredAuth(
	page: import('@playwright/test').Page,
	opts: { serverUrl?: string; username?: string; sid?: string } = {}
) {
	await page.goto('/');
	await page.evaluate(
		({ serverUrl, username, sid }) => {
			if (serverUrl) localStorage.setItem('qbt_serverUrl', serverUrl);
			if (username) localStorage.setItem('qbt_username', username);
			if (sid) localStorage.setItem('qbt_sid', sid);
		},
		{
			serverUrl: opts.serverUrl ?? 'http://localhost:8080',
			username: opts.username ?? 'admin',
			sid: opts.sid ?? 'stored-sid'
		}
	);
	await page.reload();
}

test.describe('Authentication', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('successful login hides modal and shows torrent list', async ({ page }) => {
		await page.route('/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true, sid: 'valid-sid' })
			});
		});
		await page.route('/api/torrents', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		await page.reload();
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill('http://localhost:8080');
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('password');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(page.getByRole('heading', { name: 'Connect to QBittorrent' })).not.toBeVisible();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();
	});

	test('failed login shows error message', async ({ page }) => {
		await page.route('/api/auth/login', async (route) => {
			await route.fulfill({
				status: 401,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Invalid username or password' })
			});
		});

		await page.reload();
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill('http://localhost:8080');
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('wrongpassword');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(modal.getByText('Invalid username or password')).toBeVisible();
	});

	test('502 from proxy shows error message', async ({ page }) => {
		await page.route('/api/auth/login', async (route) => {
			await route.fulfill({
				status: 502,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Cannot reach server' })
			});
		});

		await page.reload();
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill('http://localhost:8080');
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('password');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(page.getByRole('heading', { name: 'Connect to QBittorrent' })).toBeVisible();
	});

	test('auto-login from stored SID skips modal', async ({ page }) => {
		await page.route('/api/torrents', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		await setStoredAuth(page);

		await expect(page.getByRole('heading', { name: 'Connect to QBittorrent' })).not.toBeVisible();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();
	});

	test('session expiry re-prompts with modal', async ({ page }) => {
		// Set auth before route mock so the first fetch returns 200
		await page.goto('/');
		await page.evaluate(() => {
			localStorage.setItem('qbt_serverUrl', 'http://localhost:8080');
			localStorage.setItem('qbt_username', 'admin');
			localStorage.setItem('qbt_sid', 'stored-sid');
		});

		let callCount = 0;
		await page.route('/api/torrents', async (route) => {
			callCount++;
			if (callCount > 1) {
				await route.fulfill({
					status: 401,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Unauthorized' })
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([])
				});
			}
		});

		await page.reload();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		// Wait for polling to trigger 401 and re-show modal
		await expect(page.getByRole('heading', { name: /Connect|Settings/ })).toBeVisible({
			timeout: 15000
		});
	});

	test('logout clears session and shows modal', async ({ page }) => {
		await page.route('/api/torrents', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		await setStoredAuth(page);
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		await page.getByRole('button', { name: 'Logout' }).click();

		await expect(page.getByRole('heading', { name: /Connect|Settings/ })).toBeVisible();
		const sid = await page.evaluate(() => localStorage.getItem('qbt_sid'));
		expect(sid).toBeNull();
	});
});
