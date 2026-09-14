/**
 * Stack of up to 3 photo placeholders that fan out on click, cycling
 * closed -> partial -> full -> closed (mirrors the mockup's fanVals()).
 */
export function mountPhotoFan(root: HTMLElement, dir: 'l' | 'r'): void {
  const leaves = Array.from(root.querySelectorAll<HTMLElement>('[data-leaf]'));
  const toggle = root.querySelector<HTMLButtonElement>('[data-fan-toggle]');
  if (!toggle || leaves.length <= 1) {
    toggle?.remove();
    return;
  }
  root.dataset.dir = dir;
  root.dataset.open = '0';
  let openState = 0;
  let collapseTimer: number | undefined;

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (openState === 2) {
      openState = 1;
      root.dataset.open = '1';
      clearTimeout(collapseTimer);
      collapseTimer = window.setTimeout(() => {
        openState = 0;
        root.dataset.open = '0';
      }, 190);
    } else {
      openState += 1;
      root.dataset.open = String(openState);
    }
  });
}
