import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Default: project-page hosting on GitHub Pages (https://<user>.github.io/hochzeitswebsite/),
// which is also what the local WSL tunnel serves.
// Hosts that serve the site at the root (Cloudflare Pages, a custom domain, ...) set the
// environment variable SITE_BASE=/ for the build — no code change needed.
export default defineConfig({
  base: process.env.SITE_BASE ?? '/hochzeitswebsite/',
  // Second page: the password-protected QR page at /hochzeitswebsite/qr/.
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        qr: fileURLToPath(new URL('qr/index.html', import.meta.url))
      }
    }
  },
  // Lets `npm run preview`/`dev` be reached through a WSL localhost tunnel
  // (e.g. cloudflared quick tunnels use a random *.trycloudflare.com host
  // each run) — dev/preview only, has no effect on the production build.
  server: { allowedHosts: true },
  preview: { allowedHosts: true }
});
