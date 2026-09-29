/**
 * MOCKUP: cassette + tape deck next to the dancing disco ball (Ablauf →
 * Afterparty). Search a song (iTunes Search API — CORS-open, 30 s previews),
 * a cassette pops up, gets "inserted" into the deck, and on play the bass
 * level (Web Audio AnalyserNode) drives how far the ball and the dancers sway.
 * Nothing is saved anywhere yet — see the note in the chat about wiring it to
 * the RSVP song wish.
 */

export interface Track {
  title: string;
  artist: string;
  cover: string;
  preview: string;
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
`;

/** Small, decorative deck — the song search now lives in the RSVP form (searchTracks() above); this stays ready to play whatever gets wired to it from there later. */
export function renderTapePlayer(): string {
  return `<style>${CSS}</style>
<div data-tape="1" style="flex:0 0 auto;width:150px;display:flex;flex-direction:column;align-items:center;gap:4px;margin:110px 0 0">
<div data-tape-stage style="width:94px;height:62px;display:flex;align-items:center;justify-content:center"></div>
<button data-tape-play type="button" disabled aria-label="Play/Stop" style="width:150px;height:124px;position:relative;border:none;background:none;padding:0;cursor:pointer;opacity:.5">
<img data-tape-deck src="${asset('tape-player.svg')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
</button>
<span data-tape-status style="font:400 11px/1.2 Karla,sans-serif;color:${INK};opacity:.75;min-width:0;text-align:center">—</span>
</div>`;
}

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

/** Returns a `loadTrack` handle so a future caller (e.g. the RSVP-submitted song) can feed the deck a track — nothing calls it yet. */
export function setupTapePlayer(root: HTMLElement): { loadTrack: (t: Track) => void } | void {
  const wrap = root.querySelector<HTMLElement>('[data-tape]');
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

  return { loadTrack };
}
