import type { AppContext } from '../types';
import { flowerDeco } from '../widgets/flower-deco';

export function mountFaq(root: HTMLElement, ctx: AppContext): void {
  root.innerHTML = `
    <section id="faq" class="section section-wide">
      ${flowerDeco()}
      <h2 class="script-h2">${ctx.content.faqTitle}</h2>
      <p class="section-eyebrow-small">FAQ</p>
      <div class="faq-list">
        ${ctx.content.faq
          .map(
            (item) => `
          <details class="faq-card">
            <summary class="faq-summary script-md">${item.q}<span class="faq-chev">›</span></summary>
            <p class="faq-answer">${item.a}</p>
          </details>`
          )
          .join('')}
      </div>
    </section>
  `;
}
