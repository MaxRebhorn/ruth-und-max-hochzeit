/**
 * Help button: a small round "?" at the bottom left. Tapping it opens a card with the three most common
 * questions in plain words; tapping a question types its answer out. If a guest stays in the RSVP section
 * for a while, the button wobbles once and says "Questions?", so people who get stuck find it.
 */
type Lang = 'de' | 'en' | 'sv';
type Text = Record<Lang, string>;

const UI = {
  label: { de: 'Hilfe', en: 'Help', sv: 'Hjälp' },
  title: { de: 'Kurz erklärt', en: 'Quick help', sv: 'Kort förklarat' },
  intro: {
    de: 'Jeder Haushalt hat eine eigene Einladung mit QR-Code. Darüber meldet ihr euch alle gemeinsam an.',
    en: 'Every household has its own invitation with a QR code. You use it to reply for all of you together.',
    sv: 'Varje hushåll har en egen inbjudan med QR-kod. Med den svarar ni för er alla tillsammans.'
  },
  nudge: { de: 'Fragen? Hier gibt’s Hilfe', en: 'Questions? Help is here', sv: 'Frågor? Här finns hjälp' },
  close: { de: 'Schließen', en: 'Close', sv: 'Stäng' }
} satisfies Record<string, Text>;

const QUESTIONS: { q: Text; a: Text; tier?: string }[] = [
  {
    q: { de: 'Wie melde ich uns an?', en: 'How do we reply?', sv: 'Hur svarar vi?' },
    a: {
      de: 'Scrollt nach unten zu „Anmeldung“. Eure Namen stehen dort schon. Schreibt bei jeder Person dazu, was sie isst oder nicht verträgt, zum Beispiel „vegetarisch“ oder „keine Nüsse“. Kreuzt an, wobei ihr dabei seid, gebt eine E-Mail-Adresse oder Telefonnummer an und tippt auf „abschicken“. Fertig! Bitte bis zum 01.05.2027.',
      en: 'Scroll down to “RSVP”. Your names are already there. For each person, note what they eat or can’t have, for example “vegetarian” or “no nuts”. Tick which parts you’re coming to, add an email address or phone number and tap “send it”. Done! Please reply by 1 May 2027.',
      sv: 'Scrolla ner till ”OSA”. Era namn står redan där. Skriv för varje person vad den äter eller inte tål, till exempel ”vegetarisk” eller ”inga nötter”. Kryssa i vilka delar ni kommer på, fyll i e-post eller telefonnummer och tryck på ”skicka”. Klart! Svara gärna senast 1 maj 2027.'
    }
  },
  {
    tier: 'alles',
    q: { de: 'Wie melde ich einen Kuchen an?', en: 'How do I sign up a cake?', sv: 'Hur anmäler jag en tårta?' },
    a: {
      de: 'Beim „Kuchenbuffet“ schreibt ihr, was ihr mitbringt und für ungefähr wie viele Stücke es reicht. Dann auf „Kuchen anmelden“ tippen. Euer Kuchen erscheint im Kuchenturm, so sehen alle, was schon kommt.',
      en: 'In the “cake table” section, write what you’re bringing and roughly how many slices it makes. Then tap “sign up my cake”. Your cake appears in the cake tower, so everyone can see what’s already coming.',
      sv: 'Under ”tårtbordet” skriver ni vad ni tar med och ungefär hur många bitar det räcker till. Tryck sedan på ”anmäl min tårta”. Er tårta syns i tårttornet, så ser alla vad som redan kommer.'
    }
  },
  {
    q: { de: 'Kann ich später noch etwas ändern?', en: 'Can I change something later?', sv: 'Kan jag ändra något senare?' },
    a: {
      de: 'Ja. Öffnet die Seite einfach wieder über den QR-Code und schickt die Anmeldung noch einmal ab. Wir nehmen immer die neueste Antwort. Kommt ihr nicht weiter? Schreibt uns unten bei „noch Fragen?“ oder meldet euch direkt bei uns.',
      en: 'Yes. Just open the page again with the QR code and send your reply once more. We always use the latest one. Stuck? Write to us under “questions?” further down, or just get in touch with us directly.',
      sv: 'Ja. Öppna sidan igen med QR-koden och skicka svaret en gång till. Vi använder alltid det senaste. Kommer ni inte vidare? Skriv till oss under ”frågor?” längre ner, eller hör av er direkt till oss.'
    }
  }
];

const NUDGE_AFTER_MS = 7000;
const NUDGE_SHOW_MS = 6000;

const lang = (): Lang => {
  const l = document.documentElement.lang;
  return l === 'en' || l === 'sv' ? l : 'de';
};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setupHelp(): void {
  const wrap = document.createElement('div');
  wrap.className = 'help';
  wrap.innerHTML = `<div class="help-bubble" aria-hidden="true"></div>
<div class="help-panel" role="dialog" aria-modal="false" hidden>
  <button type="button" class="help-close">×</button>
  <p class="help-title"></p>
  <p class="help-intro"></p>
  <div class="help-list"></div>
</div>
<button type="button" class="help-fab" aria-expanded="false">?</button>`;
  document.body.appendChild(wrap);

  const fab = wrap.querySelector<HTMLButtonElement>('.help-fab')!;
  const panel = wrap.querySelector<HTMLElement>('.help-panel')!;
  const bubble = wrap.querySelector<HTMLElement>('.help-bubble')!;
  const list = wrap.querySelector<HTMLElement>('.help-list')!;
  let typing = 0;

  /** Types the answer out letter by letter; a second tap (or reduced motion) shows it at once. */
  const typeInto = (el: HTMLElement, text: string) => {
    window.clearInterval(typing);
    if (reducedMotion()) return void (el.textContent = text);
    el.textContent = '';
    let i = 0;
    typing = window.setInterval(() => {
      i += 2;
      el.textContent = text.slice(0, i);
      if (i >= text.length) window.clearInterval(typing);
    }, 22);
  };

  const fill = () => {
    const l = lang();
    const tier = document.documentElement.dataset.guest;
    fab.setAttribute('aria-label', UI.label[l]);
    panel.setAttribute('aria-label', UI.title[l]);
    wrap.querySelector('.help-close')!.setAttribute('aria-label', UI.close[l]);
    wrap.querySelector('.help-title')!.textContent = UI.title[l];
    wrap.querySelector('.help-intro')!.textContent = UI.intro[l];
    list.innerHTML = '';
    QUESTIONS.filter((x) => !x.tier || x.tier === tier).forEach((x) => {
      const item = document.createElement('div');
      item.className = 'help-item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'help-q';
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = x.q[l];
      const ans = document.createElement('p');
      ans.className = 'help-a';
      ans.hidden = true;
      btn.addEventListener('click', () => {
        const wasOpen = btn.getAttribute('aria-expanded') === 'true';
        list.querySelectorAll<HTMLElement>('.help-q').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        list.querySelectorAll<HTMLElement>('.help-a').forEach((a) => (a.hidden = true));
        window.clearInterval(typing);
        if (wasOpen) return;
        btn.setAttribute('aria-expanded', 'true');
        ans.hidden = false;
        typeInto(ans, x.a[l]);
      });
      ans.addEventListener('click', () => {
        window.clearInterval(typing);
        ans.textContent = x.a[l];
      });
      item.append(btn, ans);
      list.appendChild(item);
    });
  };

  const setOpen = (open: boolean) => {
    if (open) {
      fill();
      hideNudge();
    } else window.clearInterval(typing);
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    wrap.classList.toggle('help-open', open);
  };

  fab.addEventListener('click', () => setOpen(panel.hidden));
  wrap.querySelector('.help-close')!.addEventListener('click', () => {
    setOpen(false);
    fab.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      fab.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !wrap.contains(e.target as Node)) setOpen(false);
  });

  // Nudge: once per visit, after the RSVP section has been on screen for a while.
  let nudged = false;
  let timer = 0;
  const hideNudge = () => {
    wrap.classList.remove('help-nudge');
  };
  const nudge = () => {
    if (nudged || !panel.hidden || document.documentElement.dataset.guest === 'none') return;
    nudged = true;
    bubble.textContent = UI.nudge[lang()];
    wrap.classList.add('help-nudge');
    window.setTimeout(hideNudge, NUDGE_SHOW_MS);
  };
  const rsvp = document.getElementById('anmeldung');
  if (rsvp && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (entry.isIntersecting) timer = window.setTimeout(nudge, NUDGE_AFTER_MS);
      },
      { rootMargin: '-40% 0px -40% 0px' } // the (tall) section covers the middle of the screen
    ).observe(rsvp);
  }
  bubble.addEventListener('click', () => setOpen(true));
}
