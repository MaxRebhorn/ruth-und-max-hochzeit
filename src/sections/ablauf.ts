import type { AppContext } from '../types';
import { getLevel } from '../access';
import { asset } from '../asset';

export function mountAblauf(root: HTMLElement, ctx: AppContext): void {
  const level = getLevel() ?? 0;
  const items = ctx.content.ablauf.filter((item) => level >= item.minLevel);
  root.innerHTML = `
    <section id="ablauf" class="section section-wide">
      <h2 class="script-h2">${ctx.content.nav.ablauf}</h2>
      <div class="ablauf-list">
        ${items
          .map(
            (item, i) => `
          <div class="ablauf-row">
            ${
              i === 0
                ? `<div class="ablauf-church"><img src="${asset('kirche.svg')}" alt="Stadtkirche Mylau" class="ablauf-church-img" data-doves-trigger /><div class="doves-layer" data-doves-layer></div></div>`
                : `<div class="ablauf-icon" aria-hidden="true">✦</div>`
            }
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
          </div>`
          )
          .join('')}
      </div>
    </section>
  `;

  const trigger = root.querySelector<HTMLElement>('[data-doves-trigger]');
  const layer = root.querySelector<HTMLElement>('[data-doves-layer]');
  if (trigger && layer) trigger.addEventListener('click', () => flyDoves(layer));
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
