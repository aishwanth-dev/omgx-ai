// Builds web-ready brand assets from the owner's logo (a:\OMGX-AI\logo.png, read-only source).
// Usage: node scripts/build-brand.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = process.env.LOGO_SRC || "../logo.png";
const DARK = { r: 5, g: 7, b: 15, alpha: 1 }; // --omgx-ink
mkdirSync("public/brand", { recursive: true });

const mark = (px) => sharp(SRC).trim().resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

// Transparent mark: 1x (256) and 2x (512) webp, plus a png fallback.
await mark(256).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile("public/brand/logo.webp");
await mark(512).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile("public/brand/logo@2x.webp");
await mark(512).png({ compressionLevel: 9 }).toFile("public/brand/logo.png");

// Mark on a dark rounded tile (favicon / app icons).
const tile = async (size, inner, radius) => {
  const logo = await mark(Math.round(size * inner)).png().toBuffer();
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="b" cx="0.1" cy="0" r="0.9"><stop offset="0" stop-color="#1f4fd8" stop-opacity="0.75"/><stop offset="1" stop-color="#1f4fd8" stop-opacity="0"/></radialGradient><radialGradient id="r" cx="0.95" cy="1" r="0.8"><stop offset="0" stop-color="#d4213d" stop-opacity="0.7"/><stop offset="1" stop-color="#d4213d" stop-opacity="0"/></radialGradient></defs><rect width="${size}" height="${size}" rx="${radius}" fill="rgb(5,7,15)"/><rect width="${size}" height="${size}" rx="${radius}" fill="url(#b)"/><rect width="${size}" height="${size}" rx="${radius}" fill="url(#r)"/></svg>`,
  );
  return sharp(bg).composite([{ input: logo, gravity: "center" }]).png({ compressionLevel: 9 });
};
await (await tile(256, 0.78, 56)).toFile("src/app/icon.png");
// Apple touch icon: opaque full-bleed square (iOS applies its own rounding).
{
  const logo = await mark(Math.round(180 * 0.78)).png().toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: DARK } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile("src/app/apple-icon.png");
}
// favicon.ico: a single 48x48 PNG-compressed entry.
{
  const png = await (await tile(48, 0.82, 11)).toBuffer();
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(1, 4);
  head[6] = 48;
  head[7] = 48;
  head.writeUInt16LE(1, 12);
  head.writeUInt16LE(32, 14);
  head.writeUInt32LE(png.length, 14 + 4);
  head.writeUInt32LE(22, 18);
  writeFileSync("src/app/favicon.ico", Buffer.concat([head, png]));
}

// Open Graph / Twitter card, 1200x630.
{
  const W = 1200;
  const H = 630;
  const logo = await mark(300).png().toBuffer();
  const text = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs><radialGradient id="b" cx="0.1" cy="0" r="0.75"><stop offset="0" stop-color="#1f4fd8" stop-opacity="0.8"/><stop offset="0.5" stop-color="#0b1a4a" stop-opacity="0.4"/><stop offset="1" stop-color="#0b1a4a" stop-opacity="0"/></radialGradient><radialGradient id="r" cx="0.95" cy="1" r="0.7"><stop offset="0" stop-color="#d4213d" stop-opacity="0.75"/><stop offset="0.5" stop-color="#4a0a14" stop-opacity="0.4"/><stop offset="1" stop-color="#4a0a14" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="rgb(5,7,15)"/>
      <rect width="${W}" height="${H}" fill="url(#b)"/>
      <rect width="${W}" height="${H}" fill="url(#r)"/>
      <text x="480" y="300" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#ffffff">OMGX <tspan fill-opacity="0.6" font-weight="500">AI</tspan></text>
      <text x="484" y="362" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="34" fill="#ffffff" fill-opacity="0.72">Think beyond. Engineer what's next.</text>
    </svg>`,
  );
  await sharp(text)
    .composite([{ input: logo, left: 130, top: 165 }])
    .png({ compressionLevel: 9 })
    .toFile("src/app/opengraph-image.png");
  await sharp("src/app/opengraph-image.png").toFile("src/app/twitter-image.png");
}
console.log("brand assets written");
