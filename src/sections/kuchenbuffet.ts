import type { AppContext } from '../types';
import { getLevel } from '../access';
import { flowerDeco } from '../widgets/flower-deco';

interface Cake {
  who: string;
  what: string;
  slices: number;
  kind: string;
}

const CAKE_COLORS: Record<string, [string, string]> = {
  Kuchen: ['#ecd8b4', '#c07a44'],
  Torte: ['#f3e4cf', '#a8562f'],
  'Muffins / Kleingebäck': ['#f0dfc0', '#c98b4b'],
  Herzhaftes: ['#eadfc6', '#8d7a4e'],
  Getränk: ['#e3ecef', '#6f93a4']
};

const cakes: Cake[] = [
  { who: 'Oma Renate', what: 'Käsekuchen', slices: 16, kind: 'Kuchen' },
  { who: 'Familie Beispiel', what: 'Schokotorte', slices: 12, kind: 'Torte' }
];

export function mountKuchenbuffet(root: HTMLElement, ctx: AppContext): void {
  if ((getLevel() ?? 0) < 2) {
    root.innerHTML = '';
    return;
  }
  const t = ctx.content.forms.kuchen;
  const f = t.fields;

  function render() {
    root.innerHTML = `
      <section id="kuchen" class="section">
        ${flowerDeco()}
        <h2 class="script-h2">${t.title}</h2>
        <div class="card card-kuchen">
          <div data-kuchen-body>
            <p class="section-intro-small">${t.intro}</p>
            <form class="stack-form" data-kuchen-form>
              <label class="field"><span class="field-label script-md">${f.who}</span><input name="who" class="text-input" placeholder="Ruth Beispiel" required /></label>
              <label class="field"><span class="field-label script-md">${f.what}</span><input name="what" class="text-input" placeholder="Käsekuchen mit Mandarinen" required /></label>
              <div class="field-row">
                <label class="field"><span class="field-label script-md">${f.slices}</span><input name="slices" type="number" min="1" max="60" class="text-input" placeholder="12" /></label>
                <label class="field"><span class="field-label script-md">${f.kind}</span>
                  <select name="kind" class="text-input">${t.kinds.map((k) => `<option>${k}</option>`).join('')}</select>
                </label>
              </div>
              <div class="checkbox-list">
                <label class="checkbox-row"><input type="checkbox" name="cooled" />${f.cooled}</label>
                <label class="checkbox-row"><input type="checkbox" name="veganVeg" />${f.veganVeg}</label>
                <label class="checkbox-row"><input type="checkbox" name="nuts" />${f.nuts}</label>
                <label class="checkbox-row"><input type="checkbox" name="stand" />${f.stand}</label>
              </div>
              <button type="submit" class="btn-primary script-lg">${t.submitLabel}</button>
            </form>
            <div class="kuchen-sent" data-kuchen-sent hidden>
              <p class="script-lg">${t.sentTitle}</p>
              <p>${t.sentBody}</p>
            </div>
          </div>
        </div>
        <div class="cake-tower-card">
          <p class="script-md cake-tower-title">${t.towerTitle}</p>
          <p class="cake-tower-count">${cakeCountLabel()}</p>
          <div class="cake-tower" data-cake-tower>
            ${cakes.length ? cakes.slice().reverse().map(cakeLayer).join('') : `<p class="cake-tower-empty">${t.emptyLabel}</p>`}
          </div>
        </div>
      </section>
    `;

    const form = root.querySelector<HTMLFormElement>('[data-kuchen-form]')!;
    const sentView = root.querySelector<HTMLElement>('[data-kuchen-sent]')!;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      cakes.push({
        who: String(data.get('who') ?? ''),
        what: String(data.get('what') ?? '') || 'Überraschungskuchen',
        slices: Number(data.get('slices')) || 0,
        kind: String(data.get('kind') ?? 'Kuchen')
      });
      form.hidden = true;
      sentView.hidden = false;
      setTimeout(render, 900);
    });
  }

  function cakeCountLabel(): string {
    const n = cakes.length;
    const total = cakes.reduce((sum, c) => sum + c.slices, 0);
    if (n === 0) return 'noch keine Böden';
    return `${n} ${n === 1 ? 'Boden' : 'Böden'}${total ? ` · ca. ${total} Stücke` : ''}`;
  }

  function cakeLayer(c: Cake, i: number): string {
    const [sponge, filling] = CAKE_COLORS[c.kind] ?? CAKE_COLORS.Kuchen;
    const width = Math.max(52, 100 - i * (44 / Math.max(1, cakes.length - 1 || 1)));
    return `
      <div class="cake-layer" style="width:${width}%;background:linear-gradient(${sponge} 0 64%,${filling} 64% 78%,${sponge} 78% 100%)">
        <span class="cake-layer-name">${c.what}</span>
        <span class="cake-layer-meta">${[c.who, c.slices ? `${c.slices} Stücke` : ''].filter(Boolean).join(' · ')}</span>
      </div>
    `;
  }

  render();
}
