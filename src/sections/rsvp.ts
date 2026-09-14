import type { AppContext } from '../types';
import { getLevel } from '../access';
import { flowerDeco } from '../widgets/flower-deco';

export function mountRsvp(root: HTMLElement, ctx: AppContext): void {
  const t = ctx.content.forms.rsvp;
  const f = t.fields;
  const level = getLevel() ?? 0;

  root.innerHTML = `
    <section id="anmeldung" class="section">
      ${flowerDeco()}
      <h2 class="script-h2 accent">${t.title}</h2>
      <p class="section-intro script-lg">${t.intro}</p>
      <div class="card rsvp-card">
        <p class="rsvp-stamp">RSVP</p>
        <div class="rsvp-body" data-rsvp-body>
          <form class="stack-form" data-rsvp-form>
            <label class="field"><span class="field-label script-md">${f.name}</span><input name="name" class="text-input" placeholder="Ruth Beispiel" required /></label>
            <label class="field"><span class="field-label script-md">${f.count}</span><input name="count" type="number" min="1" max="12" class="text-input text-input-narrow" placeholder="2" /></label>
            <div class="field">
              <span class="field-label script-md">${f.partsLabel}</span>
              <div class="checkbox-list">
                <label class="checkbox-row"><input type="checkbox" name="part-trauung" checked disabled />${f.partTrauung}</label>
                ${level >= 1 ? `<label class="checkbox-row"><input type="checkbox" name="part-party" />${f.partParty}</label>` : ''}
                ${level >= 2 ? `<label class="checkbox-row"><input type="checkbox" name="part-feier" />${f.partFeier}</label>` : ''}
              </div>
            </div>
            ${level >= 2 ? `<label class="field"><span class="field-label script-md">Essen / Allergien</span><input name="allergies" class="text-input" placeholder="vegetarisch, keine Nüsse …" /></label>` : ''}
            <label class="field"><span class="field-label script-md">${f.song}</span><input name="song" class="text-input" placeholder="Song + Künstler" /></label>
            <label class="checkbox-row"><input type="checkbox" name="accommodation" />${f.accommodation}</label>
            <label class="field"><span class="field-label script-md">${f.message}</span><textarea name="message" rows="3" class="textarea"></textarea></label>
            <button type="submit" class="btn-primary script-lg">${t.submitLabel}</button>
            <p class="form-hint">${t.deadline}</p>
          </form>
          <div class="rsvp-sent" data-rsvp-sent hidden>
            <p class="script-lg">${t.sentTitle}</p>
            <p class="rsvp-sent-body">${t.sentBody}</p>
          </div>
        </div>
      </div>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('[data-rsvp-form]')!;
  const sentView = root.querySelector<HTMLElement>('[data-rsvp-sent]')!;
  const body = root.querySelector<HTMLElement>('[data-rsvp-body]')!;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    body.classList.add('is-sending');
    setTimeout(() => {
      form.hidden = true;
      sentView.hidden = false;
      body.classList.remove('is-sending');
    }, 420);
  });
}
