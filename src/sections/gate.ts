import type { AppContext } from '../types';
import { submitGate, setAdmin } from '../access';
import { emit } from '../bus';

export function mountGate(root: HTMLElement, ctx: AppContext, onUnlocked: () => void): void {
  const t = ctx.content.gate;
  root.innerHTML = `
    <div class="gate-overlay">
      <div class="gate-card">
        <p class="gate-date">${ctx.content.hero.date.slice(0, 10).split('-').reverse().join('.')}</p>
        <h2 class="script-xl">${ctx.content.hero.names ?? 'Ruth & Max'}</h2>
        <p class="gate-intro">${t.intro}</p>
        <form class="gate-form">
          <input name="name" autocomplete="name" placeholder="${t.nameLabel}" class="text-input" />
          <input name="email" type="email" autocomplete="email" placeholder="${t.emailLabel}" class="text-input" />
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
    if (secretHits >= 3) {
      status.textContent = 'Admin-Vorschau aktiv — wähle eine Stufe.';
      setAdmin(true);
      emit('level:changed');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '');
    const email = String(data.get('email') ?? '');
    status.textContent = t.loadingLabel;
    const result = await submitGate(ctx.config, name, email);
    if (result.ok) {
      onUnlocked();
      return;
    }
    status.textContent = result.error === 'not_found' ? t.notFoundError : t.networkError;
  });
}
