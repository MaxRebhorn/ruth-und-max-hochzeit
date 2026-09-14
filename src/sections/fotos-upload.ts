import type { AppContext } from '../types';
import { emit } from '../bus';
import { flowerDeco } from '../widgets/flower-deco';

export function mountFotosUpload(root: HTMLElement, ctx: AppContext): void {
  const t = ctx.content.fotos;
  const isOpen = Date.now() >= new Date(ctx.content.hero.date).getTime();

  root.innerHTML = `
    <section id="fotos" class="section">
      ${flowerDeco()}
      <h2 class="script-h2">${t.title}</h2>
      <div class="photobox-wrap">
        <button type="button" class="photobox" data-photobox-knock aria-label="Fotobox"></button>
        <p class="photobox-badge">${isOpen ? '' : t.lockedLabel}</p>
        <p class="photobox-hint" data-photobox-hint hidden>${t.lockedHint}</p>
      </div>
      <p class="script-lg">${t.opensLabel}</p>
      <p class="section-intro-small">${t.unlockedIntro}</p>
      <div class="goodbye">
        <p class="script-lg">Wir freuen uns auf euch!</p>
        <p class="goodbye-names">${ctx.content.hero.names} · 07.08.2027</p>
        <button type="button" class="link-btn" data-replay-envelope>${ctx.content.envelope.replayLabel}</button>
      </div>
    </section>
  `;

  const box = root.querySelector<HTMLElement>('[data-photobox-knock]')!;
  const hint = root.querySelector<HTMLElement>('[data-photobox-hint]')!;
  if (!isOpen) {
    box.addEventListener('click', () => {
      hint.hidden = false;
      box.classList.remove('is-knocked');
      void box.offsetWidth;
      box.classList.add('is-knocked');
    });
  }
  root.querySelector<HTMLElement>('[data-replay-envelope]')!.addEventListener('click', () => emit('envelope:replay'));
}
