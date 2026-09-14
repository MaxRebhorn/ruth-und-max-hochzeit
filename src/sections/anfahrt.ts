import type { AppContext } from '../types';

export function mountAnfahrt(root: HTMLElement, ctx: AppContext): void {
  const t = ctx.content.anfahrt;
  root.innerHTML = `
    <section id="anfahrt" class="section">
      <h2 class="script-h2">${t.title}</h2>
      <div class="anfahrt-map-placeholder">Karte / Route</div>
      <div class="anfahrt-venues">
        ${t.venues
          .map(
            (v) => `
          <div class="anfahrt-venue">
            <p class="anfahrt-venue-name">${v.name}</p>
            <p class="anfahrt-venue-address">${v.address}</p>
          </div>`
          )
          .join('')}
      </div>
    </section>
  `;
}
