import type { AppContext } from '../types';
import { asset } from '../asset';
import { mountPostcardAccordion } from '../widgets/postcard-accordion';
import { flowerDeco } from '../widgets/flower-deco';

export function mountVogtland(root: HTMLElement, ctx: AppContext): void {
  const t = ctx.content.vogtland;
  root.innerHTML = `
    <section id="vogtland" class="section section-wide">
      ${flowerDeco()}
      <h2 class="script-h2">${t.title}</h2>
      <p class="script-lg vogtland-subtitle">${t.subtitle}</p>
      <div class="postcards">
        ${t.entries
          .map(
            (e, i) => `
          <div class="postcard" data-post style="transform:rotate(${(i % 2 ? 1 : -1) * (1.4 + i * 0.4)}deg)">
            <div class="postcard-image"><img src="${asset(e.image)}" alt="${e.place}" loading="lazy" /></div>
            <p class="script-md postcard-title">${e.title}</p>
            <p class="postcard-place">${e.place}</p>
            <p class="postcard-distance">${e.distance}</p>
            <div class="postcard-detail"><p>${e.desc}</p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.mapQuery)}" target="_blank" rel="noreferrer">Route</a></div>
            <button type="button" class="postcard-toggle" data-post-toggle>mehr ›</button>
          </div>`
          )
          .join('')}
      </div>
    </section>
  `;
  mountPostcardAccordion(root);
}
