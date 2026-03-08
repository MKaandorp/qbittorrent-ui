import { test, expect } from '@playwright/test';

test.describe('Settings modal', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
		await page.reload();
	});

	test('shows settings modal on first visit', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Connect to QBittorrent' })).toBeVisible();
	});

	test('requires server URL to start with http', async ({ page }) => {
		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill('not-a-url');
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('password');
		await modal.getByRole('button', { name: 'Connect' }).click();
		await expect(modal.getByText('Server URL must start with http')).toBeVisible();
	});

	test('requires all fields', async ({ page }) => {
		const modal = page.getByRole('dialog');
		await modal.getByRole('button', { name: 'Connect' }).click();
		await expect(modal.getByText('Server URL is required')).toBeVisible();
	});

	test('persists serverUrl and username to localStorage on successful login', async ({ page }) => {
		await page.route('/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true, sid: 'test-sid-123' })
			});
		});
		await page.route('/api/torrents', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});

		const modal = page.getByRole('dialog');
		await modal.getByLabel('Server URL').fill('http://localhost:8080');
		await modal.getByLabel('Username').fill('admin');
		await modal.getByLabel('Password').fill('password');
		await modal.getByRole('button', { name: 'Connect' }).click();

		await expect(page.getByRole('heading', { name: 'Connect to QBittorrent' })).not.toBeVisible();

		const stored = await page.evaluate(() => ({
			serverUrl: localStorage.getItem('qbt_serverUrl'),
			username: localStorage.getItem('qbt_username'),
			sid: localStorage.getItem('qbt_sid')
		}));

		expect(stored.serverUrl).toBe('http://localhost:8080');
		expect(stored.username).toBe('admin');
		expect(stored.sid).toBe('test-sid-123');
	});
});
