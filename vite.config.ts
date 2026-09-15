import { defineConfig } from 'vite';

// Project-page hosting on GitHub Pages (https://<user>.github.io/hochzeitswebsite/).
// Change to '/' if this ever moves to a user/org root page or a custom domain.
export default defineConfig({
  base: '/hochzeitswebsite/',
  // Lets `npm run preview`/`dev` be reached through a WSL localhost tunnel
  // (e.g. cloudflared quick tunnels use a random *.trycloudflare.com host
  // each run) — dev/preview only, has no effect on the production build.
  server: { allowedHosts: true },
  preview: { allowedHosts: true }
});
