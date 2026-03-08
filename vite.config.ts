import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(VitePWA as any)({
			registerType: 'autoUpdate',
			manifest: {
				name: 'qBittorrent UI',
				short_name: 'qBit UI',
				description: 'A modern web UI for qBittorrent',
				theme_color: '#1d4ed8',
				background_color: '#1d4ed8',
				display: 'standalone',
				start_url: (process.env.BASE_PATH ?? '') + '/',
				icons: [
					{
						src: 'icon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				],
				file_handlers: [
					{
						action: (process.env.BASE_PATH ?? '') + '/',
						accept: {
							'application/x-bittorrent': ['.torrent']
						},
						launch_type: 'single-client'
					}
				],
				protocol_handlers: [
					{
						protocol: 'magnet',
						url: (process.env.BASE_PATH ?? '') + '/?magnet=%s'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: /^\/api\//,
						handler: 'NetworkOnly'
					}
				]
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
