import { expect, test } from '@playwright/test';

test('home page loads and shows qBittorrent UI', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('nav')).toBeVisible();
});
