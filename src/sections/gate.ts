import type { AppContext } from '../types';
import { submitGateWord } from '../access';

export function mountGate(root: HTMLElement, ctx: AppContext, onUnlocked: () => void): void {
  const t = ctx.content.gate;
  root.innerHTML = `
    <div class="gate-overlay">
      <div class="gate-card">
        <p class="gate-date">${t.dateLabel}</p>
        <h2 class="script-xl">${ctx.content.hero.names}</h2>
        <p class="gate-intro">${t.intro}</p>
        <form class="gate-form">
          <input name="code" autocomplete="off" placeholder="${t.codePlaceholder}" class="text-input" />
          <button type="submit" class="btn-primary script-lg">${t.submitLabel}</button>
        </form>
        <p class="gate-status" role="status"></p>
        <p class="gate-secret" aria-hidden="true">R &amp; M</p>
      </div>
    </div>
  `;

  const status = root.querySelector<HTMLParagraphElement>('.gate-status')!;
  const form = root.querySelector<HTMLFormElement>('.gate-form')!;
  const secret = root.querySelector<HTMLParagraphElement>('.gate-secret')!;

  let secretHits = 0;
  secret.addEventListener('click', () => {
    secretHits += 1;
    if (secretHits >= 3) onUnlocked();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = String(new FormData(form).get('code') ?? '');
    const result = submitGateWord(code, t.notFoundError);
    if (result.ok) {
      onUnlocked();
      return;
    }
    status.textContent = result.error ?? '';
  });
}
