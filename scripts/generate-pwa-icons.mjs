import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.join('public', 'icon.svg');
const outputDirectory = path.join('public', 'icons');
const cornerRadiusRatio = 0.18;

await fs.mkdir(outputDirectory, { recursive: true });

async function renderRoundedIcon(size) {
  const radius = Math.round(size * cornerRadiusRatio);
  const artwork = await sharp(source, { density: 384 })
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`,
  );

  return sharp(artwork)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

for (const size of [192, 512]) {
  await fs.writeFile(
    path.join(outputDirectory, `kayart-rounded-${size}.png`),
    await renderRoundedIcon(size),
  );
}

// Chrome on Windows can use the document favicon when creating the desktop
// shortcut, even though the manifest has dedicated icons. Keep every favicon
// resolution rounded as well so both installation paths use the same artwork.
const faviconImages = await Promise.all(
  [16, 32, 48, 64, 128, 256].map(async size => ({ size, data: await renderRoundedIcon(size) })),
);
const faviconDirectory = Buffer.alloc(6 + faviconImages.length * 16);
faviconDirectory.writeUInt16LE(0, 0);
faviconDirectory.writeUInt16LE(1, 2);
faviconDirectory.writeUInt16LE(faviconImages.length, 4);

let faviconOffset = faviconDirectory.length;
for (const [index, image] of faviconImages.entries()) {
  const entryOffset = 6 + index * 16;
  faviconDirectory.writeUInt8(image.size === 256 ? 0 : image.size, entryOffset);
  faviconDirectory.writeUInt8(image.size === 256 ? 0 : image.size, entryOffset + 1);
  faviconDirectory.writeUInt8(0, entryOffset + 2);
  faviconDirectory.writeUInt8(0, entryOffset + 3);
  faviconDirectory.writeUInt16LE(1, entryOffset + 4);
  faviconDirectory.writeUInt16LE(32, entryOffset + 6);
  faviconDirectory.writeUInt32LE(image.data.length, entryOffset + 8);
  faviconDirectory.writeUInt32LE(faviconOffset, entryOffset + 12);
  faviconOffset += image.data.length;
}

await fs.writeFile(
  path.join('src', 'app', 'favicon.ico'),
  Buffer.concat([faviconDirectory, ...faviconImages.map(image => image.data)]),
);
