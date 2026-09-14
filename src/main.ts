import './style.css';
import type { AppContext, Config } from './types';
import { loadI18n, initialLang, setLang } from './i18n';
import { initFromUrlOrCache, getLevel } from './access';
import { on } from './bus';
import { mountGate } from './sections/gate';
import { mountHero } from './sections/hero';

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;
  const config = (await fetch(`${import.meta.env.BASE_URL}config/config.json`).then((r) => r.json())) as Config;
  const lang = initialLang();
  setLang(lang);
  const content = await loadI18n(lang);

  const ctx: AppContext = { content, config, lang, level: null };
  const hasLevel = initFromUrlOrCache(config);
  ctx.level = getLevel();

  let stopHero: (() => void) | null = null;

  function renderSite() {
    stopHero?.();
    app.innerHTML = '<div id="site"></div>';
    const site = document.getElementById('site')!;
    stopHero = mountHero(site, ctx);
  }

  if (hasLevel) {
    renderSite();
  } else {
    mountGate(app, ctx, () => {
      ctx.level = getLevel();
      renderSite();
    });
  }

  on('lang:changed', async () => {
    ctx.content = await loadI18n((localStorage.getItem('rm-lang') as AppContext['lang']) ?? 'de');
    if (ctx.level !== null) renderSite();
  });
}

boot();
