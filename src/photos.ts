/**
 * Drop-in photo folders (see src/photos/README.md). Whatever image files
 * exist in a folder are used, in filename order — no renaming needed, so a
 * raw WhatsApp/phone export just works. `import.meta.glob` resolves this at
 * build time, so it only sees files that exist when `npm run build` runs.
 */
const modules = import.meta.glob<string>('./photos/**/*.{jpg,jpeg,JPG,JPEG,png,PNG,webp,WEBP,avif,AVIF,svg,SVG}', {
  eager: true,
  query: '?url',
  import: 'default'
});

const byFolder = new Map<string, string[]>();
for (const path of Object.keys(modules).sort()) {
  const folder = path.replace(/^\.\/photos\//, '').replace(/\/[^/]+$/, '');
  const list = byFolder.get(folder) ?? [];
  list.push(modules[path]);
  byFolder.set(folder, list);
}

/** 1-based index, matching the mockup's "up to 3 photos" convention. */
export function photoUrl(folder: string, index: number): string | null {
  return byFolder.get(folder)?.[index - 1] ?? null;
}

/** All photo URLs in a folder, in filename order. */
export function photosInFolder(folder: string): string[] {
  return byFolder.get(folder) ?? [];
}
