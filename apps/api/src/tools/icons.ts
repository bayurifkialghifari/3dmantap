import sharp from 'sharp';
import { resolve } from 'node:path';
const publicDir = resolve(import.meta.dir, '../../../web/public');
for (const size of [192, 512])
  await sharp(resolve(publicDir, 'icon.svg'))
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, 'icon-' + size + '.png'));
console.log('Generated install icons from the original SVG logo.');
