import type { AppContext } from '../types';
import { getLevel } from '../access';
import { asset } from '../asset';
import { flowerDeco } from '../widgets/flower-deco';

interface AblaufVisual {
  image: string;
  alt: string;
  doves?: boolean;
  extraImage?: string; // afterparty gets a second illustration (dancing couple) next to the discoball
}

const VISUALS: Record<string, AblaufVisual> = {
  'Trauung mit heiligem Abendmahl': { image: 'kirche.svg', alt: 'Stadtkirche Mylau', doves: true },
  'ankommen in Lauschgrün': { image: 'lauschgruener-hof.svg', alt: 'Lauschgrüner Hof' },
  'Kaffee & Kuchen': { image: 'torte.svg', alt: 'Kaffee & Kuchen' },
  Afterparty: { image: 'discoball.svg', alt: 'Afterparty', extraImage: 'party-us.svg' }
};

export function mountAblauf(root: HTMLElement, ctx: AppContext): void {
  const level = getLevel() ?? 0;
  const items = ctx.content.ablauf.filter((item) => level >= item.minLevel);

  root.innerHTML = `
    <section id="ablauf" class="section section-wide">
      ${flowerDeco()}
      <h2 class="script-h2">${ctx.content.nav.ablauf}</h2>
      <div class="ablauf-list">
        ${items.map((item, i) => ablaufRow(item, i)).join('')}
      </div>
    </section>
  `;

  const trigger = root.querySelector<HTMLElement>('[data-doves-trigger]');
  const layer = root.querySelector<HTMLElement>('[data-doves-layer]');
  if (trigger && layer) trigger.addEventListener('click', () => flyDoves(layer));
}

function ablaufRow(item: AppContext['content']['ablauf'][number], i: number): string {
  const flip = i % 2 === 1;
  const visual = VISUALS[item.title];
  return `
    <div class="ablauf-row${flip ? ' is-flip' : ''}">
      <div class="ablauf-visual">
        ${
          visual
            ? `<img src="${asset(visual.image)}" alt="${visual.alt}" class="ablauf-visual-img"${visual.doves ? ' data-doves-trigger' : ''} />`
            : ''
        }
        ${visual?.extraImage ? `<img src="${asset(visual.extraImage)}" alt="" class="ablauf-visual-extra" />` : ''}
        ${visual?.doves ? '<div class="doves-layer" data-doves-layer></div>' : ''}
      </div>
      <div class="ablauf-text">
        ${item.time ? `<p class="ablauf-time">${item.time}</p>` : ''}
        <p class="ablauf-title">${item.title}</p>
        ${item.place ? `<p class="ablauf-place">${item.place}</p>` : ''}
        ${
          item.mapQuery
            ? `<a class="ablauf-maps" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}" target="_blank" rel="noreferrer">Maps öffnen</a>`
            : ''
        }
      </div>
    </div>
  `;
}

let flockBusy = false;

function flyDoves(layer: HTMLElement): void {
  if (flockBusy) return;
  flockBusy = true;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const dove = document.createElement('span');
    dove.className = 'dove';
    dove.textContent = '🕊️';
    const dx = (Math.random() * 60 + 40) * (Math.random() < 0.5 ? -1 : 1);
    const dy = -(Math.random() * 160 + 80);
    dove.style.setProperty('--dx', `${dx}vw`);
    dove.style.setProperty('--dy', `${dy}px`);
    dove.style.animationDelay = `${i * 90}ms`;
    dove.addEventListener('click', (e) => {
      e.stopPropagation();
      dove.remove();
    });
    layer.appendChild(dove);
    dove.addEventListener('animationend', () => dove.remove());
  }
  setTimeout(() => (flockBusy = false), 1600);
}
