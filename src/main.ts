import './style.css';
import type { AppContext, Config } from './types';
import { loadI18n, initialLang, setLang, getLang } from './i18n';
import { initFromUrlOrCache, getTier } from './access';
import { on } from './bus';
import { mountGate } from './sections/gate';
import { mountEnvelopeIntro } from './sections/envelope-intro';
import { mountHero } from './sections/hero';
import { mountStory } from './sections/story';
import { mountAblauf } from './sections/ablauf';
import { mountAnfahrt } from './sections/anfahrt';
import { mountRsvp } from './sections/rsvp';
import { mountKuchenbuffet } from './sections/kuchenbuffet';
import { mountFaq } from './sections/faq';
import { mountWunschliste } from './sections/wunschliste';
import { mountVogtland } from './sections/vogtland';
import { mountFotosUpload } from './sections/fotos-upload';
import { mountNavMenu } from './sections/nav-menu';
import { mountHeaderBar } from './widgets/header-bar';
import { mountAdminPanel } from './widgets/admin-panel';

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;
  const config = (await fetch(`${import.meta.env.BASE_URL}config/config.json`).then((r) => r.json())) as Config;
  setLang(initialLang());
  const content = await loadI18n(getLang());

  const ctx: AppContext = { content, config, lang: getLang(), level: null };
  const hasTier = initFromUrlOrCache();

  const adminHost = document.createElement('div');
  document.body.appendChild(adminHost);
  mountAdminPanel(adminHost);

  function renderSite() {
    app.innerHTML = `
      <div id="header-host"></div>
      <div id="nav-host"></div>
      <div id="site"></div>
      <div id="envelope-host"></div>
    `;
    const toggle = mountHeaderBar(document.getElementById('header-host')!);
    mountNavMenu(document.getElementById('nav-host')!, ctx, toggle);

    const site = document.getElementById('site')!;
    const sections: Array<[string, (el: HTMLElement) => void]> = [
      ['home', (el) => mountHero(el, ctx)],
      ['geschichte', (el) => mountStory(el, ctx)],
      ['ablauf', (el) => mountAblauf(el, ctx)],
      ['anfahrt', (el) => mountAnfahrt(el, ctx)],
      ['anmeldung', (el) => mountRsvp(el, ctx)],
      ['kuchen', (el) => mountKuchenbuffet(el, ctx)],
      ['faq', (el) => mountFaq(el, ctx)],
      ['wunschliste', (el) => mountWunschliste(el, ctx)],
      ['fotos', (el) => mountFotosUpload(el, ctx)],
      ['vogtland', (el) => mountVogtland(el, ctx)]
    ];
    sections.forEach(([key, mount]) => {
      const el = document.createElement('div');
      el.dataset.sectionHost = key;
      site.appendChild(el);
      mount(el);
    });

    mountEnvelopeIntro(document.getElementById('envelope-host')!, ctx);
  }

  if (hasTier) {
    renderSite();
  } else {
    mountGate(app, ctx, renderSite);
  }

  on('level:changed', () => {
    if (getTier()) renderSite();
  });

  on('lang:changed', async () => {
    ctx.content = await loadI18n(getLang());
    ctx.lang = getLang();
    if (getTier()) renderSite();
    else mountGate(app, ctx, renderSite);
  });
}

boot();
