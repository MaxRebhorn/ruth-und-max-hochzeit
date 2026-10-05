import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Project-page hosting on GitHub Pages (https://<user>.github.io/hochzeitswebsite/).
// Change to '/' if this ever moves to a user/org root page or a custom domain.
export default defineConfig({
  base: '/hochzeitswebsite/',
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
