import type { AppContext } from '../types';

export function mountWunschliste(root: HTMLElement, ctx: AppContext): void {
  const t = ctx.content.wunschliste;
  root.innerHTML = `
    <section id="wunschliste" class="section">
      <h2 class="script-h2">${t.title}</h2>
      <p class="section-intro-small">${t.intro}</p>
      <div class="wish-columns">
        <div class="wish-box wish-box-no">
          <p class="script-md wish-box-title">${t.notWantedTitle}</p>
          <ul class="wish-list">${t.notWanted.map((item) => `<li>✕ ${item}</li>`).join('')}</ul>
        </div>
        <div class="wish-box wish-box-yes">
          <p class="script-md wish-box-title">${t.wantedTitle}</p>
          <p>${t.wanted}</p>
        </div>
      </div>
    </section>
  `;
}
