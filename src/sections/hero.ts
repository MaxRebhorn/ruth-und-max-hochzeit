import type { AppContext } from '../types';
import { flowerDeco } from '../widgets/flower-deco';

export function mountHero(root: HTMLElement, ctx: AppContext): () => void {
  const t = ctx.content.hero;
  const labels = t.countdownLabels;
  const [firstName, secondName] = (t.names ?? 'Ruth & Max').split('&').map((s) => s.trim());
  root.innerHTML = `
    <section id="home" class="section section-wide hero">
      ${flowerDeco()}
      <p class="eyebrow">${t.eyebrow}</p>
      <div class="hero-names-backdrop">
        <span class="hero-name hero-name-1">${firstName}</span>
        <span class="hero-name hero-name-2">&amp; ${secondName}</span>
      </div>
      <p class="script-lg">${formatDate(t.date)}</p>
      <p class="hero-countdown-eyebrow">${t.countdownEyebrow}</p>
      <div class="countdown">
        <div><div class="cd-num" data-cd="d">0</div><div class="cd-label">${labels.days}</div></div>
        <div><div class="cd-num" data-cd="h">00</div><div class="cd-label">${labels.hours}</div></div>
        <div><div class="cd-num" data-cd="m">00</div><div class="cd-label">${labels.minutes}</div></div>
        <div><div class="cd-num" data-cd="s">00</div><div class="cd-label">${labels.seconds}</div></div>
      </div>
      <p class="scroll-hint">${t.scrollHint}</p>
    </section>
  `;

  const target = new Date(t.date).getTime();
  const el = {
    d: root.querySelector<HTMLElement>('[data-cd="d"]')!,
    h: root.querySelector<HTMLElement>('[data-cd="h"]')!,
    m: root.querySelector<HTMLElement>('[data-cd="m"]')!,
    s: root.querySelector<HTMLElement>('[data-cd="s"]')!
  };
  const pad = (n: number) => String(n).padStart(2, '0');
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    el.d.textContent = String(Math.floor(diff / 86400000));
    el.h.textContent = pad(Math.floor(diff / 3600000) % 24);
    el.m.textContent = pad(Math.floor(diff / 60000) % 60);
    el.s.textContent = pad(Math.floor(diff / 1000) % 60);
  };
  tick();
  const interval = setInterval(tick, 1000);
  return () => clearInterval(interval);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getDate())}. ${pad2(d.getMonth() + 1)}. ${d.getFullYear()}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
