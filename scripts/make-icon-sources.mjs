// Renders the BlunderLab mark (src/components/layout/Logo.tsx) into the PNG sources that
// `capacitor-assets` turns into Android launcher icons and splash screens (local, via sharp).
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const TILE = '#191d24'; // --color-surface-2
const INK = '#07080b'; // --color-ink (app background)
const LINE = '#2a303a'; // --color-line
const ACCENT = '#6f95ff'; // --color-accent
const GLYPH =
  'M22 47h20v-3.5H22zM25.5 41h13l-1.6-11.5h3.3l-2.4-7h-2.6l-1.7-3.5h-4l-1.7 3.5h-2.6l-2.4 7h3.3z';
const svg = (size, body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${body}</svg>`);
const glyph = `<path d="${GLYPH}" fill="${ACCENT}"/><circle cx="32" cy="34" r="2.2" fill="${TILE}"/>`;

mkdirSync('resources', { recursive: true });
const png = (name, size, body) => sharp(svg(size, body)).png().toFile(`resources/${name}`);

await png('icon-only.png', 1024, `<rect width="64" height="64" fill="${TILE}"/>${glyph}`);
await png('icon-background.png', 1024, `<rect width="64" height="64" fill="${TILE}"/>`);
await png('icon-foreground.png', 1024, glyph);

// Splash: the rounded tile centred on the app background (viewBox widened so the tile is ~20% of the canvas).
const splash = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="-96 -96 256 256"><rect x="-96" y="-96" width="256" height="256" fill="${INK}"/>` +
    `<rect width="64" height="64" rx="18" fill="${TILE}" stroke="${LINE}"/>${glyph}</svg>`,
);
await sharp(splash).png().toFile('resources/splash.png');
await sharp(splash).png().toFile('resources/splash-dark.png');
