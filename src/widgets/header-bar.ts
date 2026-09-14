import type { Lang } from '../types';
import { setLang, getLang } from '../i18n';

export function mountHeaderBar(root: HTMLElement): HTMLElement {
  root.innerHTML = `
    <div class="header-bar">
      <div class="lang-switch">
        <button type="button" class="flag-btn flag-de" data-lang="de" aria-label="Deutsch"></button>
        <button type="button" class="flag-btn flag-en" data-lang="en" aria-label="English"></button>
        <button type="button" class="flag-btn flag-sv" data-lang="sv" aria-label="Svenska"></button>
      </div>
      <button type="button" class="hamburger" aria-label="Menü" data-nav-toggle>
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  function updateActive() {
    const lang = getLang();
    root.querySelectorAll<HTMLButtonElement>('.flag-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
  }

  root.querySelectorAll<HTMLButtonElement>('.flag-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang as Lang);
      updateActive();
    });
  });
  updateActive();

  return root.querySelector<HTMLElement>('[data-nav-toggle]')!;
}
