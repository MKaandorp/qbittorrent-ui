import { test, expect } from '@playwright/test';

const QBT = 'http://localhost:8080';

const TORRENT = {
	hash: 'abc123hash',
	name: 'Test Torrent',
	state: 'downloading',
	size: 1073741824,
	progress: 0.5,
	dlspeed: 1048576,
	upspeed: 0,
	num_seeds: 10,
	num_leechs: 5,
	ratio: 0.1,
	eta: 3600,
	category: '',
	tags: '',
	added_on: 1700000000,
	completion_on: 0,
	tracker: 'https://tracker.example.com',
	save_path: '/downloads',
	downloaded: 536870912,
	uploaded: 0,
	priority: 1,
	seen_complete: 0,
	last_activity: 1700000000
};

async function setupWithTorrent(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.evaluate((qbt) => {
		localStorage.setItem('qbt_serverUrl', qbt);
		localStorage.setItem('qbt_username', 'admin');
		localStorage.setItem('qbt_loggedIn', 'true');
	}, QBT);
	await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([TORRENT])
		});
	});
	await page.reload();
	await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();
}

test.describe('Delete Torrent', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('clicking a torrent opens detail modal with delete button', async ({ page }) => {
		await setupWithTorrent(page);
		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Delete torrent' })).toBeVisible();
	});

	test('clicking Delete torrent shows confirmation UI', async ({ page }) => {
		await setupWithTorrent(page);
		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await dialog.getByRole('button', { name: 'Delete torrent' }).click();

		await expect(dialog.getByRole('button', { name: 'Confirm delete' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
		await expect(dialog.getByText('Also delete downloaded files')).toBeVisible();
	});

	test('Cancel button hides confirmation UI', async ({ page }) => {
		await setupWithTorrent(page);
		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await dialog.getByRole('button', { name: 'Delete torrent' }).click();
		await dialog.getByRole('button', { name: 'Cancel' }).click();

		await expect(dialog.getByRole('button', { name: 'Delete torrent' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Confirm delete' })).not.toBeVisible();
	});

	test('confirming delete calls API and closes modal', async ({ page }) => {
		await setupWithTorrent(page);

		let capturedBody: string | null = null;
		await page.route(`${QBT}/api/v2/torrents/delete`, async (route) => {
			capturedBody = route.request().postData();
			await route.fulfill({ status: 200, body: '' });
		});

		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await dialog.getByRole('button', { name: 'Delete torrent' }).click();
		await dialog.getByRole('button', { name: 'Confirm delete' }).click();

		await expect(dialog).not.toBeVisible();
		expect(capturedBody).toContain('abc123hash');
		expect(capturedBody).toMatch(/name="deleteFiles"[\s\S]*?false/);
	});

	test('deleting with files checked sends deleteFiles=true', async ({ page }) => {
		await setupWithTorrent(page);

		let capturedBody: string | null = null;
		await page.route(`${QBT}/api/v2/torrents/delete`, async (route) => {
			capturedBody = route.request().postData();
			await route.fulfill({ status: 200, body: '' });
		});

		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await dialog.getByRole('button', { name: 'Delete torrent' }).click();
		await dialog.getByLabel('Also delete downloaded files').check();
		await dialog.getByRole('button', { name: 'Confirm delete' }).click();

		await expect(dialog).not.toBeVisible();
		expect(capturedBody).toMatch(/name="deleteFiles"[\s\S]*?true/);
	});

	test('delete API error shows error message in modal', async ({ page }) => {
		await setupWithTorrent(page);

		await page.route(`${QBT}/api/v2/torrents/delete`, async (route) => {
			await route.fulfill({ status: 500, body: 'Internal Server Error' });
		});

		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await dialog.getByRole('button', { name: 'Delete torrent' }).click();
		await dialog.getByRole('button', { name: 'Confirm delete' }).click();

		await expect(dialog).toBeVisible();
		await expect(dialog.getByText(/Server error/)).toBeVisible();
	});

	test('after successful delete torrent list is refreshed', async ({ page }) => {
		let callCount = 0;
		await page.goto('/');
		await page.evaluate((qbt) => {
			localStorage.setItem('qbt_serverUrl', qbt);
			localStorage.setItem('qbt_username', 'admin');
			localStorage.setItem('qbt_loggedIn', 'true');
		}, QBT);
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
			callCount++;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: callCount === 1 ? JSON.stringify([TORRENT]) : '[]'
			});
		});
		await page.route(`${QBT}/api/v2/torrents/delete`, async (route) => {
			await route.fulfill({ status: 200, body: '' });
		});
		await page.reload();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		await page.locator('tr').filter({ hasText: 'Test Torrent' }).click();
		const dialog = page.getByRole('dialog', { name: 'Test Torrent' });
		await dialog.getByRole('button', { name: 'Delete torrent' }).click();
		await dialog.getByRole('button', { name: 'Confirm delete' }).click();
		await expect(dialog).not.toBeVisible();

		// After deletion the store re-fetches; callCount should be > 1
		expect(callCount).toBeGreaterThan(1);
	});
});
