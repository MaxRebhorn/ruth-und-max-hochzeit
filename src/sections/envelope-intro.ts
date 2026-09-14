import type { AppContext } from '../types';
import { on } from '../bus';
import { asset } from '../asset';

export function mountEnvelopeIntro(root: HTMLElement, ctx: AppContext): void {
  const t = ctx.content.envelope;
  root.innerHTML = `
    <div class="envelope-overlay">
      <div class="envelope-flap envelope-flap-l"></div>
      <div class="envelope-flap envelope-flap-r"></div>
      <button type="button" class="envelope-seal" aria-label="Siegel öffnen"></button>
      <p class="envelope-hint">${t.tapHint}</p>
    </div>
  `;

  const overlay = root.querySelector<HTMLElement>('.envelope-overlay')!;
  const flapL = root.querySelector<HTMLElement>('.envelope-flap-l')!;
  const flapR = root.querySelector<HTMLElement>('.envelope-flap-r')!;
  const seal = root.querySelector<HTMLElement>('.envelope-seal')!;
  const hint = root.querySelector<HTMLElement>('.envelope-hint')!;
  seal.style.setProperty('--seal-image', `url(${asset('siegel.jpg')})`);

  let opened = false;
  let timers: number[] = [];

  function open() {
    if (opened) return;
    opened = true;
    timers.push(window.setTimeout(() => flapL.classList.add('is-open'), 0));
    timers.push(window.setTimeout(() => flapR.classList.add('is-open'), 380));
    timers.push(window.setTimeout(() => seal.classList.add('is-hidden'), 0));
    timers.push(window.setTimeout(() => hint.classList.add('is-hidden'), 0));
    timers.push(window.setTimeout(() => overlay.classList.add('is-gone'), 1450));
  }

  function replay() {
    timers.forEach(clearTimeout);
    timers = [];
    opened = false;
    overlay.classList.remove('is-gone');
    flapL.classList.remove('is-open');
    flapR.classList.remove('is-open');
    seal.classList.remove('is-hidden');
    hint.classList.remove('is-hidden');
    window.scrollTo(0, 0);
  }

  seal.addEventListener('click', open);
  on('envelope:replay', replay);
}
