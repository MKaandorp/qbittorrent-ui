import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render the app navbar', async () => {
		render(Page);

		const navbar = page.getByText('qBittorrent', { exact: true });
		await expect.element(navbar).toBeInTheDocument();
	});
});
