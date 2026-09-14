import type { AppContext } from '../types';
import { getLevel } from '../access';

const LINKS: Array<{ id: string; navKey: string; minLevel?: number }> = [
  { id: 'home', navKey: 'home' },
  { id: 'geschichte', navKey: 'geschichte' },
  { id: 'ablauf', navKey: 'ablauf' },
  { id: 'anfahrt', navKey: 'anfahrt' },
  { id: 'vogtland', navKey: 'vogtland' },
  { id: 'anmeldung', navKey: 'anmeldung' },
  { id: 'kuchen', navKey: 'kuchen', minLevel: 2 },
  { id: 'faq', navKey: 'faq' },
  { id: 'wunschliste', navKey: 'wunschliste' },
  { id: 'fotos', navKey: 'fotos' }
];

export function mountNavMenu(root: HTMLElement, ctx: AppContext, toggleButton: HTMLElement): void {
  const level = getLevel() ?? 0;
  const nav = ctx.content.nav;

  function render(open: boolean) {
    if (!open) {
      root.innerHTML = '';
      return;
    }
    root.innerHTML = `
      <div class="nav-overlay">
        <div class="nav-panel">
          ${LINKS.filter((l) => l.minLevel === undefined || level >= l.minLevel)
            .map((l) => `<a href="#${l.id}" class="nav-link script-lg">${nav[l.navKey] ?? l.navKey}</a>`)
            .join('')}
          <p class="nav-close-hint">${nav.closeHint}</p>
        </div>
      </div>
    `;
    root.querySelector<HTMLElement>('.nav-overlay')!.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close();
    });
    root.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((a) => a.addEventListener('click', close));
  }

  let isOpen = false;
  function close() {
    isOpen = false;
    render(false);
  }
  toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    render(isOpen);
  });
}
