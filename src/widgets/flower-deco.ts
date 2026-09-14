import { asset } from '../asset';

/**
 * The repeating "growing flowers" illustration border used behind almost
 * every section in the mockup — 4 flowers up each side (f1..f6 cycling),
 * rotated to look like they're sprouting from the section's edges.
 */
export function flowerDeco(): string {
  const positions = [
    { side: 'left', top: 8, img: 'f1', width: 78, rotate: 86 },
    { side: 'left', top: 26, img: 'f2', width: 66, rotate: 95 },
    { side: 'left', top: 45, img: 'f3', width: 56, rotate: 101 },
    { side: 'left', top: 64, img: 'f4', width: 52, rotate: 90 },
    { side: 'right', top: 10, img: 'f5', width: 100, rotate: -83 },
    { side: 'right', top: 28, img: 'f6', width: 76, rotate: -77 },
    { side: 'right', top: 46, img: 'f1', width: 70, rotate: -86 },
    { side: 'right', top: 65, img: 'f2', width: 50, rotate: -95 }
  ];
  return `
    <div class="flower-deco" aria-hidden="true">
      ${positions
        .map(
          (p) => `
        <div class="flower-deco-anchor" style="${p.side}:0;top:${p.top}%">
          <img src="${asset(`flowers/v2/${p.img}.png`)}" alt="" class="flower-deco-item"
            style="width:${p.width}px;transform:translateX(${p.side === 'left' ? '-50%' : '50%'}) rotate(${p.rotate}deg)" />
        </div>`
        )
        .join('')}
    </div>
  `;
}
