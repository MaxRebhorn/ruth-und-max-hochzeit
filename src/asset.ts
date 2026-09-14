export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}
