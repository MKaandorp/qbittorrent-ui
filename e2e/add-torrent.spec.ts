import { test, expect } from '@playwright/test';

const QBT = 'http://localhost:8080';

async function setupAuthenticated(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.evaluate((qbt) => {
		localStorage.setItem('qbt_serverUrl', qbt);
		localStorage.setItem('qbt_username', 'admin');
		localStorage.setItem('qbt_loggedIn', 'true');
	}, QBT);
	await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
		await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
	});
	await page.reload();
	await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();
}

test.describe('Add Torrent', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('+ Add button opens the modal', async ({ page }) => {
		await setupAuthenticated(page);
		await page.getByRole('button', { name: '+ Add' }).click();
		await expect(page.getByRole('heading', { name: 'Add Torrent' })).toBeVisible();
	});

	test('submitting a magnet link calls the API and closes modal', async ({ page }) => {
		await setupAuthenticated(page);

		let capturedBody: string | null = null;
		await page.route(`${QBT}/api/v2/torrents/add`, async (route) => {
			capturedBody = route.request().postData();
			await route.fulfill({ status: 200, body: 'Ok.' });
		});

		await page.getByRole('button', { name: '+ Add' }).click();
		const modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await modal
			.getByPlaceholder('magnet:?xt=urn:btih:...')
			.fill('magnet:?xt=urn:btih:abc123&dn=Test');
		await modal.getByRole('button', { name: 'Add' }).click();

		await expect(page.getByRole('heading', { name: 'Add Torrent' })).not.toBeVisible();
		expect(capturedBody).toContain('magnet:?xt=urn:btih:abc123');
	});

	test('save path is sent in the request', async ({ page }) => {
		await setupAuthenticated(page);

		let capturedBody: string | null = null;
		await page.route(`${QBT}/api/v2/torrents/add`, async (route) => {
			capturedBody = route.request().postData();
			await route.fulfill({ status: 200, body: 'Ok.' });
		});

		await page.getByRole('button', { name: '+ Add' }).click();
		const modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await modal
			.getByPlaceholder('magnet:?xt=urn:btih:...')
			.fill('magnet:?xt=urn:btih:abc123&dn=Test');
		await modal.getByPlaceholder('Default location').fill('/downloads/movies');
		await modal.getByRole('button', { name: 'Add' }).click();

		await expect(page.getByRole('heading', { name: 'Add Torrent' })).not.toBeVisible();
		expect(capturedBody).toContain('/downloads/movies');
	});

	test('used save path appears as a recent folder badge on next open', async ({ page }) => {
		await setupAuthenticated(page);

		await page.route(`${QBT}/api/v2/torrents/add`, async (route) => {
			await route.fulfill({ status: 200, body: 'Ok.' });
		});

		// Add with a save path
		await page.getByRole('button', { name: '+ Add' }).click();
		let modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await modal.getByPlaceholder('magnet:?xt=urn:btih:...').fill('magnet:?xt=urn:btih:abc123');
		await modal.getByPlaceholder('Default location').fill('/downloads/movies');
		await modal.getByRole('button', { name: 'Add' }).click();
		await expect(page.getByRole('heading', { name: 'Add Torrent' })).not.toBeVisible();

		// Re-open — recent folder should appear
		await page.getByRole('button', { name: '+ Add' }).click();
		modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await expect(modal.getByTitle('/downloads/movies')).toBeVisible();
	});

	test('clicking a recent folder badge fills the save path input', async ({ page }) => {
		// Seed localStorage before page load so the store picks it up
		await page.goto('/');
		await page.evaluate((qbt) => {
			localStorage.setItem('qbt_serverUrl', qbt);
			localStorage.setItem('qbt_username', 'admin');
			localStorage.setItem('qbt_loggedIn', 'true');
			localStorage.setItem(
				'qbt_recentFolders',
				JSON.stringify(['/downloads/tv', '/downloads/movies'])
			);
		}, QBT);
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
			await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
		});
		await page.reload();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		await page.getByRole('button', { name: '+ Add' }).click();
		const modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await modal.getByTitle('/downloads/tv').click();

		await expect(modal.getByPlaceholder('Default location')).toHaveValue('/downloads/tv');
	});

	test('removing a recent folder removes it from the list', async ({ page }) => {
		// Seed localStorage before page load so the store picks it up
		await page.goto('/');
		await page.evaluate((qbt) => {
			localStorage.setItem('qbt_serverUrl', qbt);
			localStorage.setItem('qbt_username', 'admin');
			localStorage.setItem('qbt_loggedIn', 'true');
			localStorage.setItem('qbt_recentFolders', JSON.stringify(['/downloads/tv']));
		}, QBT);
		await page.route(`${QBT}/api/v2/torrents/info`, async (route) => {
			await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
		});
		await page.reload();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		await page.getByRole('button', { name: '+ Add' }).click();
		const modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await expect(modal.getByTitle('/downloads/tv')).toBeVisible();

		await modal.getByRole('button', { name: 'Remove /downloads/tv' }).click();
		await expect(modal.getByTitle('/downloads/tv')).not.toBeVisible();
	});

	test('recent folders persist across page reloads', async ({ page }) => {
		await setupAuthenticated(page);

		await page.evaluate(() => {
			localStorage.setItem('qbt_recentFolders', JSON.stringify(['/downloads/music']));
		});
		await page.reload();
		await expect(page.getByPlaceholder('Filter torrents…')).toBeVisible();

		await page.getByRole('button', { name: '+ Add' }).click();
		await expect(page.getByTitle('/downloads/music')).toBeVisible();
	});

	test('error from server shows in modal', async ({ page }) => {
		await setupAuthenticated(page);

		await page.route(`${QBT}/api/v2/torrents/add`, async (route) => {
			await route.fulfill({ status: 200, body: 'Fails.' });
		});

		await page.getByRole('button', { name: '+ Add' }).click();
		const modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await modal.getByPlaceholder('magnet:?xt=urn:btih:...').fill('magnet:?xt=urn:btih:abc123');
		await modal.getByRole('button', { name: 'Add' }).click();

		await expect(modal.getByText('Failed to add torrent')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Add Torrent' })).toBeVisible();
	});

	test('validation requires a magnet link before submitting', async ({ page }) => {
		await setupAuthenticated(page);
		await page.getByRole('button', { name: '+ Add' }).click();
		const modal = page.getByRole('dialog', { name: 'Add Torrent' });
		await modal.getByRole('button', { name: 'Add' }).click();
		await expect(modal.getByText('Please enter a magnet link or URL')).toBeVisible();
	});
});
