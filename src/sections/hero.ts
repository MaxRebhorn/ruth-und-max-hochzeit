import type { AppContext } from '../types';

export function mountHero(root: HTMLElement, ctx: AppContext): () => void {
  const t = ctx.content.hero;
  const labels = t.countdownLabels;
  root.innerHTML = `
    <section id="home" class="section hero">
      <p class="eyebrow">${t.eyebrow}</p>
      <h1 class="script-huge">${t.names ?? 'Ruth & Max'}</h1>
      <p class="script-lg">${formatDate(t.date)}</p>
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
