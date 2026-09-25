/**
 * MOCKUP: cassette + tape deck next to the dancing disco ball (Ablauf →
 * Afterparty). Search a song (iTunes Search API — CORS-open, 30 s previews),
 * a cassette pops up, gets "inserted" into the deck, and on play the bass
 * level (Web Audio AnalyserNode) drives how far the ball and the dancers sway.
 * Nothing is saved anywhere yet — see the note in the chat about wiring it to
 * the RSVP song wish.
 */

interface Track {
  title: string;
  artist: string;
  cover: string;
  preview: string;
}

const INK = 'rgba(91,42,16,.85)';
const RUST = '#a8562f';

const CSS = `
@keyframes tapePop{0%{transform:scale(.2) rotate(-14deg);opacity:0}60%{transform:scale(1.08) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(-2deg)}}
@keyframes reelSpin{to{transform:rotate(360deg)}}
[data-tape] input{width:100%;border:none;border-bottom:1.5px solid rgba(91,42,16,.45);background:transparent;padding:5px 2px;font:300 14px Karla,sans-serif;outline:none}
[data-tape] [data-hit]{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:none;border-bottom:1px dashed rgba(91,42,16,.2);padding:6px 2px;cursor:pointer;font:300 13px/1.3 Karla,sans-serif}
[data-tape] [data-hit]:hover{background:rgba(243,220,147,.35)}
[data-tape] [data-reel]{transform-origin:50% 50%}
[data-tape][data-playing] [data-reel]{animation:reelSpin 1.6s linear infinite}
`;

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function cassetteHtml(t: Track): string {
  const label = esc(t.title.slice(0, 26));
  const sub = esc(t.artist.slice(0, 30));
  return `<div data-cassette style="position:relative;width:150px;height:96px;background:#3b2a20;border-radius:7px;box-shadow:0 3px 8px rgba(0,0,0,.3);transform:rotate(-2deg);animation:tapePop .55s cubic-bezier(.2,.9,.3,1.2) both">
<div style="position:absolute;left:9px;right:9px;top:8px;height:44px;background:#f4ead2;border-radius:3px;padding:4px 7px;overflow:hidden">
<p style="margin:0;font:400 17px/1 Caveat,cursive;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</p>
<p style="margin:2px 0 0;font:300 10px/1.2 Karla,sans-serif;color:${INK};opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</p>
<div style="position:absolute;left:0;right:0;bottom:0;height:4px;background:${RUST};opacity:.8"></div>
</div>
<svg viewBox="0 0 150 96" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
<path d="M30 96 L40 72 H110 L120 96" fill="#2a1d15"/>
<g data-reel style="transform-box:fill-box"><circle cx="50" cy="62" r="9" fill="#f4ead2"/><path d="M50 55v14M43 62h14M45 57l10 10M55 57L45 67" stroke="#3b2a20" stroke-width="1.5"/></g>
<g data-reel style="transform-box:fill-box"><circle cx="100" cy="62" r="9" fill="#f4ead2"/><path d="M100 55v14M93 62h14M95 57l10 10M105 57L95 67" stroke="#3b2a20" stroke-width="1.5"/></g>
</svg></div>`;
}

export function renderTapePlayer(): string {
  return `<style>${CSS}</style>
<div data-tape="1" style="flex:1 1 100%;min-width:0;margin-top:6px;background:#fffdf8;border:1.5px solid rgba(91,42,16,.35);padding:14px 16px 16px;box-shadow:0 4px 14px rgba(91,42,16,.08)">
<p style="margin:0 0 8px;font:400 24px/1 Caveat,cursive"><span data-de="1">dein Lied für die Tanzfläche</span><span data-en="1" style="display:none">your song for the dancefloor</span></p>
<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
<div style="flex:1 1 200px;min-width:0">
<input data-tape-q type="text" placeholder="Lied oder Interpret suchen …" autocomplete="off">
<div data-tape-hits style="margin-top:6px"></div>
</div>
<div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:12px;margin:0 auto">
<div data-tape-stage style="width:154px;height:100px;display:flex;align-items:center;justify-content:center"></div>
<div style="width:188px;background:linear-gradient(#5a4436,#3b2a20);border-radius:9px;padding:12px 12px 10px;box-shadow:0 4px 10px rgba(0,0,0,.3)">
<div data-tape-slot style="height:104px;background:#1c130e;border-radius:5px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 3px 8px rgba(0,0,0,.6);overflow:hidden">
<span data-tape-empty style="font:300 11px Karla,sans-serif;color:#f4ead2;opacity:.45;letter-spacing:.1em">KASSETTE EINLEGEN</span></div>
<div style="display:flex;align-items:center;gap:10px;margin-top:10px">
<button data-tape-play type="button" disabled aria-label="Play" style="width:42px;height:34px;border-radius:5px;border:none;background:#e9dcbd;color:${INK};font:400 16px/1 Karla,sans-serif;cursor:pointer;opacity:.5">▶</button>
<span data-tape-status style="font:400 12px/1.2 Karla,sans-serif;color:#f4ead2;opacity:.75;min-width:0">—</span>
</div></div></div></div></div>`;
}

async function searchTracks(q: string): Promise<Track[]> {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: q, media: 'music', entity: 'song', limit: '6', country: 'de' })}`;
  const res = await fetch(url);
  const data = (await res.json()) as { results: { trackName: string; artistName: string; artworkUrl100: string; previewUrl?: string }[] };
  return data.results.filter((r) => r.previewUrl).map((r) => ({ title: r.trackName, artist: r.artistName, cover: r.artworkUrl100, preview: r.previewUrl! }));
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

export function setupTapePlayer(root: HTMLElement): void {
  const wrap = root.querySelector<HTMLElement>('[data-tape]');
  const ball = root.querySelector<HTMLElement>('[data-ball]');
  const dancers = root.querySelector<HTMLElement>('[data-dancers]');
  if (!wrap) return;
  const q = wrap.querySelector<HTMLInputElement>('[data-tape-q]')!;
  const hits = wrap.querySelector<HTMLElement>('[data-tape-hits]')!;
  const stage = wrap.querySelector<HTMLElement>('[data-tape-stage]')!;
  const slot = wrap.querySelector<HTMLElement>('[data-tape-slot]')!;
  const playBtn = wrap.querySelector<HTMLButtonElement>('[data-tape-play]')!;
  const status = wrap.querySelector<HTMLElement>('[data-tape-status]')!;
  const relayout = () => window.dispatchEvent(new Event('resize')); // the Ablauf line is measured from row heights

  let timer = 0;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    const term = q.value.trim();
    if (term.length < 2) {
      hits.innerHTML = '';
      return relayout();
    }
    timer = window.setTimeout(async () => {
      try {
        const tracks = await searchTracks(term);
        hits.innerHTML = tracks.length
          ? tracks.map((t, i) => `<button type="button" data-hit="${i}"><img src="${esc(t.cover)}" alt="" width="38" height="38" style="flex:none"><span><b style="font-weight:500">${esc(t.title)}</b><br>${esc(t.artist)}</span></button>`).join('')
          : `<p style="margin:4px 0;font:300 12px Karla,sans-serif;opacity:.6">nichts gefunden</p>`;
        hits.querySelectorAll<HTMLElement>('[data-hit]').forEach((b) => b.addEventListener('click', () => popCassette(tracks[Number(b.dataset.hit)])));
      } catch {
        hits.innerHTML = `<p style="margin:4px 0;font:300 12px Karla,sans-serif;opacity:.6">Suche gerade nicht erreichbar.</p>`;
      }
      relayout();
    }, 350);
  });

  // -- cassette pops up on the stage; a click sends it flying into the deck -------
  let staged: Track | null = null;
  function popCassette(t: Track): void {
    staged = t;
    hits.innerHTML = '';
    stage.innerHTML = `<button type="button" data-insert aria-label="Kassette einlegen" style="background:none;border:none;padding:0;cursor:pointer">${cassetteHtml(t)}</button>`;
    stage.querySelector('[data-insert]')!.addEventListener('click', insert);
    status.textContent = 'tippe die Kassette';
    relayout();
  }

  function insert(): void {
    const cass = stage.querySelector<HTMLElement>('[data-cassette]');
    if (!cass || !staged) return;
    const track = staged;
    staged = null;
    const from = cass.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    cass.style.animation = 'none';
    cass.style.transition = 'transform .7s cubic-bezier(.5,0,.3,1)';
    void cass.offsetWidth; // commit the start state first, otherwise the browser skips the transition (and its end event)
    cass.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(.9) rotate(0deg)`;
    cass.style.zIndex = '5';
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      stop();
      slot.innerHTML = '';
      cass.style.cssText = 'position:relative;width:150px;height:96px;background:#3b2a20;border-radius:7px;transform:scale(.9)';
      slot.appendChild(cass);
      stage.innerHTML = '';
      loadTrack(track);
    };
    cass.addEventListener('transitionend', land, { once: true });
    setTimeout(land, 900); // safety net (reduced-motion, background tab, …)
  }

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
    playBtn.textContent = '❚❚';
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
    playBtn.textContent = '▶';
    release();
  }

  playBtn.addEventListener('click', () => (playing ? stop() : void start()));
}
