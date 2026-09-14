type Events = {
  'lang:changed': undefined;
  'level:changed': undefined;
  'envelope:replay': undefined;
};

type Listener = () => void;

const listeners = new Map<keyof Events, Set<Listener>>();

export function on<K extends keyof Events>(event: K, fn: Listener): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
  return () => listeners.get(event)?.delete(fn);
}

export function emit<K extends keyof Events>(event: K): void {
  listeners.get(event)?.forEach((fn) => fn());
}
