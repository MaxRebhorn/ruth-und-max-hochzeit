/** Only one postcard detail open at a time, mirrors the mockup's postVals(). */
export function mountPostcardAccordion(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-post]'));
  cards.forEach((card) => {
    const toggle = card.querySelector<HTMLButtonElement>('[data-post-toggle]')!;
    toggle.addEventListener('click', () => {
      const wasActive = card.classList.contains('is-active');
      cards.forEach((c) => c.classList.remove('is-active'));
      if (!wasActive) card.classList.add('is-active');
    });
  });
}
