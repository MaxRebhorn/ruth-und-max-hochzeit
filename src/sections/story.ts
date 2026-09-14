import type { AppContext } from '../types';
import { mountPhotoFan } from '../widgets/photo-fan';
import { flowerDeco } from '../widgets/flower-deco';

const CONNECTOR_PATH =
  'M500 0C760 37 760 74 500 111C240 148 240 185 500 222C760 259 760 296 500 333C240 370 240 407 500 444C760 481 760 519 500 556C240 593 240 630 500 667C760 704 760 741 500 778C240 815 240 852 500 889C760 926 760 963 500 1000';

export function mountStory(root: HTMLElement, ctx: AppContext): void {
  const entries = ctx.content.story;
  root.innerHTML = `
    <section id="geschichte" class="section section-wide">
      ${flowerDeco()}
      <h2 class="script-h2">${ctx.content.nav.geschichte}</h2>
      <div class="timeline">
        <svg class="timeline-connector" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="${CONNECTOR_PATH}" fill="none" stroke="rgba(91,42,16,.38)" stroke-width="2.4" stroke-dasharray="7 9" />
        </svg>
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
      <span class="timeline-dot"></span>
      <div class="photo-fan">
        ${photos
          .slice()
          .reverse()
          .map((id, revIndex) => {
            const leaf = photos.length - 1 - revIndex;
            return `<div class="photo-leaf" data-leaf="${leaf}"><div class="photo-placeholder">${id}</div>${
              leaf === 0 && photos.length > 1
                ? '<button type="button" class="photo-fan-toggle" data-fan-toggle>+' + (photos.length - 1) + '</button>'
                : ''
            }</div>`;
          })
          .join('')}
      </div>
      <div class="timeline-text">
        <p class="timeline-year">${entry.year}</p>
        <p class="timeline-body">${entry.text}</p>
      </div>
    </div>
  `;
}
