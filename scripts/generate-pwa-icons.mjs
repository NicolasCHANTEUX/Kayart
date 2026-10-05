import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.join('public', 'icon.svg');
const outputDirectory = path.join('public', 'icons');
const cornerRadiusRatio = 0.18;

await fs.mkdir(outputDirectory, { recursive: true });

for (const size of [192, 512]) {
  const radius = Math.round(size * cornerRadiusRatio);
  const artwork = await sharp(source, { density: 384 })
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`,
  );

  await sharp(artwork)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, `kayart-rounded-${size}.png`));
}
