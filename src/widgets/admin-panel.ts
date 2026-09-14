import { applyTier, getTier, isAdmin, resetGate, type TierName } from '../access';
import { on } from '../bus';

export function mountAdminPanel(root: HTMLElement): void {
  function render() {
    if (!isAdmin() || !getTier()) {
      root.innerHTML = '';
      return;
    }
    root.innerHTML = `
      <div class="admin-panel">
        <p class="admin-label">Vorschau</p>
        ${tierButton('trauung', 'nur Trauung')}
        ${tierButton('party', '+ Party')}
        ${tierButton('alles', 'ganzer Tag')}
        <button type="button" class="admin-reset">Begrüßung</button>
      </div>
    `;
    (['trauung', 'party', 'alles'] as TierName[]).forEach((name) => {
      root.querySelector<HTMLButtonElement>(`[data-tier-btn="${name}"]`)!.addEventListener('click', () => applyTier(name));
    });
    root.querySelector<HTMLButtonElement>('.admin-reset')!.addEventListener('click', () => resetGate());
  }

  function tierButton(name: TierName, label: string): string {
    const active = getTier() === name;
    return `<button type="button" data-tier-btn="${name}" class="admin-tier-btn${active ? ' is-active' : ''}">${label}</button>`;
  }

  render();
  on('level:changed', render);
}
