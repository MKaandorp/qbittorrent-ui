import { test, expect } from '@playwright/test';
import type { Torrent } from '../src/lib/types';

const FIXTURE_TORRENTS: Torrent[] = [
	{
		hash: 'abc123',
		name: 'Ubuntu 22.04 LTS',
		size: 1_073_741_824,
		progress: 1.0,
		dlspeed: 0,
		upspeed: 102400,
		num_seeds: 100,
		num_leechs: 5,
		ratio: 1.5,
		eta: 8640000,
		state: 'uploading',
		category: 'linux',
		tags: '',
		added_on: 1700000000,
		completion_on: 1700001000,
		tracker: 'http://tracker.example.com',
		save_path: '/downloads',
		downloaded: 1_073_741_824,
		uploaded: 1_610_612_736,
		priority: 0,
		seen_complete: 1700001000,
		last_activity: 1700002000
	},
	{
		hash: 'def456',
		name: 'Debian 12 DVD',
		size: 3_758_096_384,
		progress: 0.45,
		dlspeed: 5_242_880,
		upspeed: 0,
		num_seeds: 20,
		num_leechs: 3,
		ratio: 0.0,
		eta: 600,
		state: 'downloading',
		category: 'linux',
		tags: '',
		added_on: 1700003000,
		completion_on: -1,
		tracker: 'http://tracker.example.com',
		save_path: '/downloads',
		downloaded: 1_691_136_000,
		uploaded: 0,
		priority: 1,
		seen_complete: -1,
		last_activity: 1700003500
	}
];

async function setupWithTorrents(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.evaluate(() => {
		localStorage.setItem('qbt_serverUrl', 'http://localhost:8080');
		localStorage.setItem('qbt_username', 'admin');
		localStorage.setItem('qbt_sid', 'test-sid');
	});
	await page.route('/api/torrents', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(FIXTURE_TORRENTS)
		});
	});
	await page.reload();
}

test.describe('Torrent list', () => {
	test('shows table on desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await setupWithTorrents(page);

		await expect(page.locator('table')).toBeVisible();
		// On desktop, table cells should be visible
		await expect(page.locator('td').filter({ hasText: 'Ubuntu 22.04 LTS' }).first()).toBeVisible();
		await expect(page.locator('td').filter({ hasText: 'Debian 12 DVD' }).first()).toBeVisible();
	});

	test('shows cards on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await setupWithTorrents(page);

		await expect(page.locator('table')).not.toBeVisible();
		// On mobile, card titles should be visible
		await expect(page.locator('h3').filter({ hasText: 'Ubuntu 22.04 LTS' })).toBeVisible();
		await expect(page.locator('h3').filter({ hasText: 'Debian 12 DVD' })).toBeVisible();
	});

	test('renders fixture data correctly', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await setupWithTorrents(page);

		// Check size formatting
		await expect(page.getByText('1.0 GB').first()).toBeVisible();
		// Check seeding badge
		await expect(page.getByText('Seeding').first()).toBeVisible();
		// Check downloading badge
		await expect(page.getByText('Downloading').first()).toBeVisible();
		// Check ETA unknown shows --
		await expect(page.getByText('--').first()).toBeVisible();
	});

	test('filter reduces visible torrents', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await setupWithTorrents(page);

		await page.getByPlaceholder('Filter torrents…').fill('Ubuntu');
		await expect(page.locator('td').filter({ hasText: 'Ubuntu 22.04 LTS' }).first()).toBeVisible();
		await expect(page.locator('td').filter({ hasText: 'Debian 12 DVD' }).first()).not.toBeVisible();
		await expect(page.getByText('1 torrent')).toBeVisible();
	});

	test('sort by name toggles order', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await setupWithTorrents(page);

		// Default sort is name ascending: Debian < Ubuntu, so Debian is first
		const rows = page.locator('tbody tr');
		const firstDefault = await rows.first().textContent();
		expect(firstDefault).toContain('Debian');

		// Click Name header once: toggles to descending, Ubuntu first
		await page.getByRole('button', { name: 'Name' }).click();
		const firstDesc = await rows.first().textContent();
		expect(firstDesc).toContain('Ubuntu');

		// Click again: back to ascending, Debian first
		await page.getByRole('button', { name: 'Name' }).click();
		const firstAsc = await rows.first().textContent();
		expect(firstAsc).toContain('Debian');
	});

	test('polling updates torrent list', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });

		await page.goto('/');
		await page.evaluate(() => {
			localStorage.setItem('qbt_serverUrl', 'http://localhost:8080');
			localStorage.setItem('qbt_username', 'admin');
			localStorage.setItem('qbt_sid', 'test-sid');
		});

		let callCount = 0;
		await page.route('/api/torrents', async (route) => {
			callCount++;
			if (callCount === 1) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([FIXTURE_TORRENTS[0]])
				});
			} else {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(FIXTURE_TORRENTS)
				});
			}
		});

		await page.reload();
		await expect(page.locator('td').filter({ hasText: 'Ubuntu 22.04 LTS' }).first()).toBeVisible();
		await expect(page.locator('td').filter({ hasText: 'Debian 12 DVD' }).first()).not.toBeVisible();

		// Wait for polling to add the second torrent (5s interval)
		await expect(page.locator('td').filter({ hasText: 'Debian 12 DVD' }).first()).toBeVisible({
			timeout: 10000
		});
	});
});
