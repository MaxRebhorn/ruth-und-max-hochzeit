import type { AppContext } from '../types';
import { mountPhotoFan } from '../widgets/photo-fan';

export function mountStory(root: HTMLElement, ctx: AppContext): void {
  const entries = ctx.content.story;
  root.innerHTML = `
    <section id="geschichte" class="section section-wide">
      <h2 class="script-h2">${ctx.content.nav.geschichte}</h2>
      <div class="timeline">
        ${entries.map((entry, i) => storyRow(entry, i)).join('')}
      </div>
    </section>
  `;
  root.querySelectorAll<HTMLElement>('.photo-fan').forEach((el, i) => {
    mountPhotoFan(el, i % 2 === 0 ? 'r' : 'l');
  });
}

function storyRow(entry: { year: string; text: string; photos: string[] }, i: number): string {
  const flip = i % 2 === 1;
  const photos = entry.photos.slice(0, 3);
  return `
    <div class="timeline-row${flip ? ' is-flip' : ''}">
      <div class="photo-fan">
        ${photos
          .slice()
          .reverse()
          .map(
            (id, revIndex) => {
              const leaf = photos.length - 1 - revIndex; // furthest photo painted first, leaf 0 (front) last
              return `<div class="photo-leaf" data-leaf="${leaf}"><div class="photo-placeholder">${id}</div>${
                leaf === 0 && photos.length > 1
                  ? '<button type="button" class="photo-fan-toggle" data-fan-toggle>+' + (photos.length - 1) + '</button>'
                  : ''
              }</div>`;
            }
          )
          .join('')}
      </div>
      <div class="timeline-text">
        <p class="timeline-year">${entry.year}</p>
        <p class="timeline-body">${entry.text}</p>
      </div>
    </div>
  `;
}
