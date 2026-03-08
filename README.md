# qbittorrent-ui

A simple alternative WebUI for QBittorrent, which requires no installation. Simply browse to https://mkaandorp.github.io/qbittorrent-ui/ and fill out the details of your instance.

## Required settings

To allow this to work, you have to disable CSRF protection and enable cross-origin requests. Please be aware of the security risks.

- Your browser will allow JavaScript from https://mkaandorp.github.io to send authenticated requests to your qBittorrent WebUI.

- If this site (or any script it loads) is compromised, it could control your qBittorrent instance (add/remove torrents, change settings, etc.).

- Only use this setup if your qBittorrent WebUI is restricted to your local network and you trust the UI the web application.

Required settings (QBittorrent -> Options -> Web UI):

- Uncheck "Enable Cross-Site Request Forgery (CSRF) protection"
- Check " Add custom HTTP headers", and add the following two lines:

  ```
  Access-Control-Allow-Origin: https://mkaandorp.github.io
  Access-Control-Allow-Credentials: true
  ```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.
