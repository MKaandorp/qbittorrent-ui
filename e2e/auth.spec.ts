import { test, expect } from '@playwright/test';

const QBT = 'http://localhost:8080';

async function setStoredAuth(page: import('@playwright/test').Page) {
	await page.evaluate((qbt) => {
		localStorage.setItem('qbt_serverUrl', qbt);
		localStorage.setItem('qbt_username', 'admin');
		localStorage.setItem('qbt_loggedIn', 'true');
	}, QBT);
	await page.reload();
}

test.describe('Authentication', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('successful login hides modal and shows torrent list', async ({ page }) => {
		await page.route(`${QBT}/api/v2/auth/login`, async (route) => {
			await route.fulfill({ status: 200, body: 'Ok.' });
		});
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		await page.reload();
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill(QBT);
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('password');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(page.getByRole('heading', { name: 'Connect to QBittorrent' })).not.toBeVisible();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();
	});

	test('failed login shows error message', async ({ page }) => {
		await page.route(`${QBT}/api/v2/auth/login`, async (route) => {
			await route.fulfill({ status: 200, body: 'Fails.' });
		});

		await page.reload();
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill(QBT);
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('wrongpassword');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(modal.getByText('Invalid username or password')).toBeVisible();
	});

	test('unreachable server shows error message', async ({ page }) => {
		await page.route(`${QBT}/api/v2/auth/login`, async (route) => {
			await route.abort('connectionrefused');
		});

		await page.reload();
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill(QBT);
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('password');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(modal.getByText('Cannot reach server')).toBeVisible();
	});

	test('auto-login from stored session skips modal', async ({ page }) => {
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
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
		await page.goto('/');
		await page.evaluate((qbt) => {
			localStorage.setItem('qbt_serverUrl', qbt);
			localStorage.setItem('qbt_username', 'admin');
			localStorage.setItem('qbt_loggedIn', 'true');
		}, QBT);

		let callCount = 0;
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
			callCount++;
			if (callCount > 1) {
				await route.fulfill({ status: 403, body: 'Forbidden' });
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

		await expect(page.getByRole('heading', { name: /Connect|Settings/ })).toBeVisible({
			timeout: 15000
		});
	});

	test('logout clears session and shows modal', async ({ page }) => {
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});
		await page.route(`${QBT}/api/v2/auth/logout`, async (route) => {
			await route.fulfill({ status: 200, body: 'Ok.' });
		});

		await setStoredAuth(page);
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		await page.getByRole('button', { name: 'Logout' }).click();

		await expect(page.getByRole('heading', { name: /Connect|Settings/ })).toBeVisible();
		const loggedIn = await page.evaluate(() => localStorage.getItem('qbt_loggedIn'));
		expect(loggedIn).toBeNull();
	});
});
