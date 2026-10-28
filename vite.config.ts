import { defineConfig } from 'vite';

// Default: project-page hosting on GitHub Pages (https://<user>.github.io/hochzeitswebsite/),
// which is also what the local WSL tunnel serves.
// Hosts that serve the site at the root (Cloudflare Pages, a custom domain, ...) set the
// environment variable SITE_BASE=/ for the build — no code change needed.
export default defineConfig({
  base: process.env.SITE_BASE ?? '/hochzeitswebsite/',
  // Lets `npm run preview`/`dev` be reached through a WSL localhost tunnel
  // (e.g. cloudflared quick tunnels use a random *.trycloudflare.com host
  // each run) — dev/preview only, has no effect on the production build.
  server: { allowedHosts: true },
  preview: { allowedHosts: true }
});
