// One-off icon generator for the Phase 0 PWA manifest. Produces a simple
// "Indicator" monogram (amber L-mark on ink) at the sizes Lighthouse's
// installability + maskable-icon audits check for. Re-run after installing
// deps if you change the mark; replace entirely once real brand icons exist
// (FRONTEND_PLAN.md §6 Phase 3 covers the full iOS icon/splash set).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");

const INK = "#14171A";
const AMBER = "#FFB300";

function markSvg({ size, safeAreaRatio }) {
  const markSize = size * safeAreaRatio;
  const offset = (size - markSize) / 2;
  const strokeWidth = markSize * 0.12;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${INK}" />
      <g transform="translate(${offset}, ${offset})">
        <path d="M ${markSize * 0.3} ${markSize * 0.18}
                 L ${markSize * 0.3} ${markSize * 0.72}
                 L ${markSize * 0.74} ${markSize * 0.72}"
              fill="none" stroke="${AMBER}" stroke-width="${strokeWidth}"
              stroke-linecap="square" stroke-linejoin="miter" />
      </g>
    </svg>
  `;
}

async function generate(name, size, safeAreaRatio) {
  await sharp(Buffer.from(markSvg({ size, safeAreaRatio })))
    .png()
    .toFile(path.join(outDir, name));
  console.log(`wrote ${name}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await generate("icon-192.png", 192, 0.6);
  await generate("icon-512.png", 512, 0.6);
  // Maskable icons must keep all meaningful content inside the ~80% "safe zone".
  await generate("icon-512-maskable.png", 512, 0.5);
  await generate("apple-touch-icon.png", 180, 0.6);
}

main();
