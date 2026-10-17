/**
 * Cassette dock + tape deck next to the dancing disco ball (Ablauf →
 * Afterparty). Every song wish typed into the RSVP form lands here as a
 * cassette (`setSongs`); tapping one opens the deck, slides it in, and on play
 * the beat (Web Audio AnalyserNode) drives how far the ball and the dancers sway.
 * Previews come from the iTunes Search API (CORS-open, 30 s clips).
 */

export interface Track {
  title: string;
  artist: string;
  cover: string;
  preview: string;
}

/** One song wish. `track` is missing for plain-text wishes (search was down or nothing matched). */
export interface Song {
  label: string;
  track?: Track;
}

export interface TapeHandle {
  /** Syncs the dock with the current wish list; cassettes new to the list pop up at `from` and fly into the dock. */
  setSongs: (songs: Song[], from?: DOMRect) => void;
}

export async function searchTracks(q: string): Promise<Track[]> {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: q, media: 'music', entity: 'song', limit: '6', country: 'de' })}`;
  const res = await fetch(url);
  const data = (await res.json()) as { results: { trackName: string; artistName: string; artworkUrl100: string; previewUrl?: string }[] };
  return data.results.filter((r) => r.previewUrl).map((r) => ({ title: r.trackName, artist: r.artistName, cover: r.artworkUrl100, preview: r.previewUrl! }));
}

const INK = 'rgba(91,42,16,.85)';

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}

const CSS = `
[data-tape] [data-tape-play]:not(:disabled):hover{filter:brightness(.95)}
[data-tape][data-playing] [data-tape-play]{filter:brightness(.9)}
[data-cassette]:hover{transform:rotate(0deg) translateY(-3px)!important}
`;

// Everything below is sized off the mockup's original 150x124 deck button at SIZE_SCALE — shrink
// that one number to make the whole player (button, cassettes, dock) smaller together.
const SIZE_SCALE = 0.85;
const CASSETTE_W = 62 * SIZE_SCALE;

// The opened deck art is drawn ~19 % larger and further left/up than the closed one. The closed deck is
// sized and positioned (not transform:scale'd — its own box then always matches what's actually drawn,
// instead of visually overflowing a 150x124 box that layout code elsewhere measures) to the opened art's
// scale and spot, so swapping between them for a cassette doesn't make the deck jump. The closed fit's
// left/top are a measured offset at the original 150x124 size, so they scale by SIZE_SCALE too.
const DECK_W = 150 * SIZE_SCALE;
const DECK_H = 124 * SIZE_SCALE;
const CLOSED_SCALE = 1.191;
const OPEN_FIT = { left: '0', top: '0', width: `${DECK_W}px`, height: `${DECK_H}px` };
const CLOSED_FIT = {
  left: `${(-28.3 * SIZE_SCALE).toFixed(2)}px`,
  top: `${(-21.4 * SIZE_SCALE).toFixed(2)}px`,
  width: `${(DECK_W * CLOSED_SCALE).toFixed(2)}px`,
  height: `${(DECK_H * CLOSED_SCALE).toFixed(2)}px`
};
const CLOSED_FIT_CSS = `left:${CLOSED_FIT.left};top:${CLOSED_FIT.top};width:${CLOSED_FIT.width};height:${CLOSED_FIT.height}`;

/**
 * Deck with a dock for the guests' song cassettes above it. `data-tape-wrap` (also `[data-tape]`
 * for the JS below and the existing CSS hooks) is a fixed 150px — the deck's own width — and never
 * changes size: the dock is taken out of the flex flow with position:absolute, so it can hold zero,
 * one, or several waiting cassettes without ever affecting the player's own layout box. That in turn
 * keeps the dancers-plus-player group (src/ablauf-entries.ts) a fixed width too, so on narrow
 * screens they always share one row and one ground line instead of sometimes wrapping apart.
 */
export function renderTapePlayer(): string {
  return `<style>${CSS}</style>
<div data-tape-wrap data-tape="1" style="position:relative;flex:0 0 auto;width:${DECK_W}px;display:flex;flex-direction:column;align-items:center;gap:4px">
<div data-tape-dock style="position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:4px;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:8px 6px;max-width:${CASSETTE_W * 3 + 12}px"></div>
<button data-tape-play type="button" disabled aria-label="Play/Stop" style="width:${DECK_W}px;height:${DECK_H}px;position:relative;border:none;background:none;padding:0;cursor:pointer;opacity:.5">
<img data-tape-deck src="${asset('tape-player.svg')}" alt="" style="position:absolute;object-fit:contain;${CLOSED_FIT_CSS}">
</button>
<span data-tape-status style="font:400 11px/1.2 Karla,sans-serif;color:${INK};opacity:.75;min-width:0;text-align:center">·</span>
</div>`;
}

function escHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function cassetteHtml(label: string, tilt: number): string {
  return `<button type="button" data-cassette aria-label="Kassette einlegen: ${escHtml(label)}" title="${escHtml(label)}" style="flex:none;width:${CASSETTE_W}px;border:none;padding:0;background:none;cursor:pointer;transform:rotate(${tilt}deg);transition:transform .2s">
<img src="${asset('tape-cassette.svg')}" alt="" style="display:block;width:100%;aspect-ratio:1592/999">
<span style="display:block;max-width:100%;margin-top:1px;font:400 12px/1.1 Caveat,cursive;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(label)}</span>
</button>`;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A fixed-position copy of `el` that animates from its own spot, so the real element can stay put in the layout. */
function ghostOf(el: HTMLElement): HTMLElement {
  const r = el.getBoundingClientRect();
  const g = el.cloneNode(true) as HTMLElement;
  g.style.cssText += `;position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;margin:0;z-index:200;pointer-events:none;transition:none`;
  document.body.appendChild(g);
  return g;
}

const centerDelta = (from: DOMRect, to: DOMRect) => [from.left + from.width / 2 - (to.left + to.width / 2), from.top + from.height / 2 - (to.top + to.height / 2)];

interface Tempo {
  beat: number; // seconds per beat
  offset: number; // seconds into the clip of the first beat
}

/**
 * Tempo + beat position from the whole spectrum, not just the bass: an onset curve (jumps in loudness of
 * the signal and of its high-passed version, so hi-hat/snare/guitar strums count too), then the
 * autocorrelation of that curve picks the beat length (70–180 BPM, mildly biased towards 120), and the
 * phase that lines the most onsets up on the beat grid gives the offset.
 */
function analyzeTempo(buf: AudioBuffer): Tempo {
  const x = buf.getChannelData(0);
  const hop = 512;
  const hopSec = hop / buf.sampleRate;
  const n = Math.floor(x.length / hop);
  const rms = new Float32Array(n);
  const hp = new Float32Array(n);
  for (let f = 0; f < n; f++) {
    let a = 0;
    let b = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) {
      a += x[i] * x[i];
      const d = x[i] - (i ? x[i - 1] : 0);
      b += d * d;
    }
    rms[f] = Math.sqrt(a / hop);
    hp[f] = Math.sqrt(b / hop);
  }
  const onset = new Float32Array(n);
  for (let f = 1; f < n; f++) onset[f] = Math.max(0, rms[f] - rms[f - 1]) / (rms[f] + 1e-4) + Math.max(0, hp[f] - hp[f - 1]) / (hp[f] + 1e-4);
  const mean = onset.reduce((p, c) => p + c, 0) / n;
  for (let f = 0; f < n; f++) onset[f] -= mean;

  const ac = (lag: number): number => {
    let sum = 0;
    for (let i = 0; i + lag < n; i++) sum += onset[i] * onset[i + lag];
    return sum / (n - lag);
  };
  const lagMin = Math.floor(60 / 180 / hopSec);
  const lagMax = Math.ceil(60 / 70 / hopSec);
  let best = lagMin;
  let bestScore = -Infinity;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    const bpm = 60 / (lag * hopSec);
    const prior = Math.exp(-Math.pow(Math.log2(bpm / 120), 2) / (2 * 0.6 * 0.6));
    const score = (ac(lag) + 0.5 * ac(lag * 2)) * prior;
    if (score > bestScore) {
      bestScore = score;
      best = lag;
    }
  }
  const [l, c, r] = [ac(best - 1), ac(best), ac(best + 1)]; // parabolic refine → sub-frame tempo
  const denom = l - 2 * c + r;
  const lag = best + (denom ? (0.5 * (l - r)) / denom : 0);

  let phase = 0;
  let phaseScore = -Infinity;
  for (let p = 0; p < lag; p++) {
    let sum = 0;
    for (let t = p; t < n; t += lag) sum += onset[Math.round(t)];
    if (sum > phaseScore) {
      phaseScore = sum;
      phase = p;
    }
  }
  return { beat: lag * hopSec, offset: phase * hopSec };
}

export function setupTapePlayer(root: HTMLElement): TapeHandle | void {
  const wrap = root.querySelector<HTMLElement>('[data-tape]');
  const dock = root.querySelector<HTMLElement>('[data-tape-dock]');
  const ball = root.querySelector<HTMLElement>('[data-ball]');
  const dancers = root.querySelector<HTMLElement>('[data-dancers]');
  if (!wrap) return;
  const playBtn = wrap.querySelector<HTMLButtonElement>('[data-tape-play]')!;
  const status = wrap.querySelector<HTMLElement>('[data-tape-status]')!;
  const relayout = () => window.dispatchEvent(new Event('resize')); // the Ablauf line is measured from row heights

  // -- playback + beat-driven sway --------------------------------------------------
  // The preview is fetched and decoded into a buffer instead of streamed through an <audio> element:
  // no dependency on the CDN's media type / CORS-tainting rules for the analyser, and the same path
  // works in every browser. 30 s of AAC ≈ 500 KB, so buffering it whole is cheap.
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: AudioBufferSourceNode | null = null;
  let raf = 0;
  let playing = false;
  let bytes: Promise<ArrayBuffer> | null = null;
  let decoded: AudioBuffer | null = null;
  let tempo: Tempo | null = null;

  function loadTrack(t: Track): void {
    decoded = null;
    tempo = null;
    bytes = fetch(t.preview).then((r) => r.arrayBuffer());
    bytes.catch(() => (status.textContent = 'Vorschau konnte nicht geladen werden'));
    status.textContent = `${t.title} · ${t.artist}`;
    playBtn.disabled = false;
    playBtn.style.opacity = '1';
    relayout();
  }

  const saved = new Map<HTMLElement, string>();
  function takeOver(el: HTMLElement | null): void {
    if (el && !saved.has(el)) {
      saved.set(el, el.style.animation);
      el.style.animation = 'none';
    }
  }
  function release(): void {
    saved.forEach((anim, el) => {
      el.style.animation = anim;
      el.style.transform = '';
    });
    saved.clear();
  }

  async function start(): Promise<void> {
    if (!bytes) return;
    try {
      if (!ctx) {
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.connect(ctx.destination);
      }
      await ctx.resume();
      decoded ??= await ctx.decodeAudioData(await bytes);
    } catch (err) {
      status.textContent = `Ton nicht abspielbar (${err instanceof Error ? err.message : err})`;
      return;
    }
    source = ctx.createBufferSource();
    source.buffer = decoded;
    source.loop = true;
    source.connect(analyser!);
    source.start();
    playing = true;
    wrap!.setAttribute('data-playing', '');
    takeOver(ball);
    takeOver(dancers);
    tempo ??= analyzeTempo(decoded);
    const t0 = ctx.currentTime;
    const dur = decoded.duration;
    const bins = new Uint8Array(analyser!.frequencyBinCount);
    let level = 0;
    let peak = 0.05;
    let spinStart = -1e9;
    const SPIN_MS = 750;
    status.textContent = `${status.textContent!.split('  ♩')[0]}  ♩ ${Math.round(60 / tempo.beat)} BPM`;
    // One swing per beat, extremes ON the beat, alternating sides: x = cos(π·beats). Symmetric around the
    // centre by construction. The reach follows the HIGHS (≈ 4–16 kHz: hi-hats, cymbals, vocals' air) relative to
    // the loudest highs so far: quiet highs = small sway, strong highs = wide sway, and a big burst of highs
    // sends the pair once around in a full circle (at most every 8 s).
    const tick = (now: number) => {
      analyser!.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = 90; i < 370; i++) sum += bins[i]; // 1024-point FFT ≈ 43 Hz per bin → bins 90–370 ≈ 4–16 kHz
      const raw = sum / 280 / 255;
      peak = Math.max(raw, peak * 0.9995);
      level += (raw / peak - level) * 0.2;
      if (level > 0.95 && now - spinStart > 8000) spinStart = now;
      const spin = Math.min(1, (now - spinStart) / SPIN_MS);
      const spinDeg = spin < 1 ? 360 * (spin * spin * (3 - 2 * spin)) : 0; // eased 0 → 360, then back to rest
      const pos = (((ctx!.currentTime - t0 - (ctx!.outputLatency || 0)) % dur) + dur) % dur;
      const x = Math.cos((Math.PI * (pos - tempo!.offset)) / tempo!.beat) * (3 + 28 * level * level);
      if (dancers) dancers.style.transform = `translateX(${x.toFixed(1)}px) rotate(${((x / 7) * 3 + spinDeg).toFixed(2)}deg)`;
      if (ball) ball.style.transform = `rotate(${((-x / 14) * 2.2).toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function stop(): void {
    cancelAnimationFrame(raf);
    source?.stop();
    source = null;
    playing = false;
    wrap!.removeAttribute('data-playing');
    release();
  }

  playBtn.addEventListener('click', () => (playing ? stop() : void start()));

  // -- cassette dock: one cassette per song wish; tap one to put it in the deck ----------
  const deckImg = wrap.querySelector<HTMLImageElement>('[data-tape-deck]')!;
  const cassettes = new Map<string, { song: Song; el: HTMLElement }>();
  let inserted: string | null = null;

  function resetDeck(): void {
    if (playing) stop();
    inserted = null;
    bytes = null;
    playBtn.disabled = true;
    playBtn.style.opacity = '.5';
    status.textContent = cassettes.size ? 'Kassette antippen' : '·';
  }

  async function insert(label: string): Promise<void> {
    const entry = cassettes.get(label);
    if (!entry || inserted === label) return;
    if (playing) stop();
    const previous = inserted ? cassettes.get(inserted) : null;
    inserted = label;
    deckImg.src = asset('tape-player-opened.svg');
    Object.assign(deckImg.style, OPEN_FIT);
    if (!reducedMotion()) {
      const g = ghostOf(entry.el);
      const to = playBtn.getBoundingClientRect();
      const slot = new DOMRect(to.left + to.width * 0.44 - 1, to.top + to.height * 0.55 - 1, 2, 2); // the opened deck's cassette window
      const [dx, dy] = centerDelta(slot, g.getBoundingClientRect());
      entry.el.style.visibility = 'hidden';
      await g.animate(
        [
          { transform: 'none' },
          { transform: `translate(${dx * 0.6}px,${dy * 0.6 - 30}px) rotate(-6deg)`, offset: 0.55 },
          { transform: `translate(${dx}px,${dy}px) scale(.42)`, opacity: 1, offset: 0.85 },
          { transform: `translate(${dx}px,${dy + 4}px) scale(.38)`, opacity: 0 }
        ],
        { duration: 750, easing: 'cubic-bezier(.45,0,.3,1)' }
      ).finished;
      g.remove();
    }
    entry.el.style.display = 'none';
    entry.el.style.visibility = '';
    if (previous) previous.el.style.display = ''; // the old cassette goes back on the shelf
    deckImg.src = asset('tape-player.svg');
    Object.assign(deckImg.style, CLOSED_FIT);
    if (inserted !== label) return; // another cassette was tapped meanwhile
    status.textContent = `${label} · sucht Hörprobe …`;
    // Plain-text wishes get one more search try here, in case Apple Music was down when they were typed.
    entry.song.track ??= await searchTracks(label).then((r) => r[0], () => undefined);
    if (inserted !== label) return;
    if (entry.song.track) loadTrack(entry.song.track);
    else {
      bytes = null;
      playBtn.disabled = true;
      playBtn.style.opacity = '.5';
      status.textContent = `${label} · keine Hörprobe gefunden`;
    }
  }

  function setSongs(songs: Song[], from?: DOMRect): void {
    if (!dock) return;
    const labels = new Set(songs.map((s) => s.label));
    cassettes.forEach(({ el }, label) => {
      if (labels.has(label)) return;
      el.remove();
      cassettes.delete(label);
      if (inserted === label) resetDeck();
    });
    songs.forEach((song, i) => {
      const known = cassettes.get(song.label);
      if (known) {
        known.song.track ??= song.track;
        return;
      }
      dock.insertAdjacentHTML('beforeend', cassetteHtml(song.label, [-4, 3, -2, 5, -3][i % 5]));
      const el = dock.lastElementChild as HTMLElement;
      el.addEventListener('click', () => void insert(song.label));
      cassettes.set(song.label, { song: { ...song }, el });
      const to = el.getBoundingClientRect();
      if (!from || !to.width || reducedMotion()) return; // dock hidden for this guest tier, or no motion wanted
      // Pop up at the song field, then fly up the page into the dock.
      const g = ghostOf(el);
      const [dx, dy] = centerDelta(from, to);
      el.style.visibility = 'hidden';
      g.animate(
        [
          { transform: `translate(${dx}px,${dy}px) scale(.2) rotate(-14deg)`, opacity: 0 },
          { transform: `translate(${dx}px,${dy - 40}px) scale(1.15) rotate(4deg)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${dx}px,${dy - 40}px) scale(1) rotate(-2deg)`, offset: 0.35 },
          { transform: 'none' }
        ],
        { duration: 1400, easing: 'cubic-bezier(.45,0,.25,1)' }
      ).finished.finally(() => {
        g.remove();
        el.style.visibility = '';
      });
    });
    if (!inserted) status.textContent = cassettes.size ? 'Kassette antippen' : '·';
    relayout();
  }

  return { setSongs };
}
