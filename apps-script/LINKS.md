# Live links

Not secret (the exec URL already ships to every visitor's browser via
`public/config/config.json`; the Sheet IDs alone grant no access without
being shared), just here so they aren't only living in a chat transcript.

| What | Link |
|---|---|
| Spreadsheet „Hochzeit" | https://docs.google.com/spreadsheets/d/1IE7SRVawn5Mv-MPA_tBYxIZnMk5UzS_42f2Jk1FKfpc/edit |
| Spreadsheet „Hochzeit – Geheim" | https://docs.google.com/spreadsheets/d/1UUYcNiBfTAp9ypmJRPXJGocScUZFVCKcKjTW6h-lQBo/edit |
| Apps Script web app (`/exec`) | https://script.google.com/macros/s/AKfycbwFhNWpX9ixl7l5DE0UoGzYJgw_g2pd7SwDVrfk-yLDN0YvOEqs1hjnEioG6sa9LwMv/exec |
| Apps Script project | standalone project named **„WeddingScript"** — not bound to either sheet, so it won't show up via a sheet's *Extensions → Apps Script*. Find it at https://script.google.com/home and look for that name. |

The `/exec` URL is also in `public/config/config.json` — that's the copy
that actually matters for the live site. This table is a backup, not the
source of truth; if they ever diverge, `config.json` wins.

A test row ("Test Gast", marked "TEST - kann gelöscht werden") is still
sitting in the `Gäste` tab — safe to delete once you don't need it as a
reference anymore.
