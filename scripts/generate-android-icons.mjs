import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

/**
 * Creates a PNG buffer with the Habuilt brand logo
 * @param {number} size - Output width & height
 * @param {boolean} isForeground - If true, transparent bg for adaptive icon foreground
 * @param {boolean} isRound - If true, clips to circle
 */
function createHabuiltIconPNG(size, isForeground = false, isRound = false) {
  const width = size;
  const height = size;
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const nx = x / width;

      // Distance from center (0.5, 0.5)
      const cx = nx - 0.5;
      const cy = ny - 0.5;
      const distCenterSq = cx * cx + cy * cy;

      if (isRound && distCenterSq > 0.5 * 0.5) {
        // Outside circular icon
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Safe bounds scale:
      // For adaptive icon foreground (108dp canvas), icon must be centered within 66dp safe zone (scale = 0.61)
      const scale = isForeground ? 0.58 : 0.72;
      const lx = (nx - 0.5) / scale + 0.5;
      const ly = (ny - 0.5) / scale + 0.5;

      let isInsideH = false;
      let isInsideDot = false;

      // H Left Bar: lx in [0.26, 0.40], ly in [0.25, 0.75]
      if (lx >= 0.26 && lx <= 0.40 && ly >= 0.25 && ly <= 0.75) {
        isInsideH = true;
      }
      // H Right Bar: lx in [0.60, 0.74], ly in [0.25, 0.75]
      if (lx >= 0.60 && lx <= 0.74 && ly >= 0.25 && ly <= 0.75) {
        isInsideH = true;
      }
      // H Crossbar: lx in [0.40, 0.60], ly in [0.44, 0.56]
      if (lx >= 0.40 && lx <= 0.60 && ly >= 0.44 && ly <= 0.56) {
        isInsideH = true;
      }
      // Accent Circle Dot top right: center at (0.78, 0.20), radius 0.075
      const ddx = lx - 0.78;
      const ddy = ly - 0.20;
      if (ddx * ddx + ddy * ddy <= 0.075 * 0.075) {
        isInsideDot = true;
      }

      if (isInsideH) {
        // Linear gradient from Emerald #34D399 (52, 211, 153) to Cyan #22D3EE (34, 211, 238)
        const t = (lx + ly) / 2;
        const r = Math.round(52 * (1 - t) + 34 * t);
        const g = Math.round(211 * (1 - t) + 211 * t);
        const b = Math.round(153 * (1 - t) + 238 * t);
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = 255;
      } else if (isInsideDot) {
        // Bright emerald dot #34D399
        rawData[pixelOffset] = 52;
        rawData[pixelOffset + 1] = 211;
        rawData[pixelOffset + 2] = 153;
        rawData[pixelOffset + 3] = 255;
      } else if (isForeground) {
        // Transparent for adaptive icon foreground
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      } else {
        // Background squircle / card: Deep Obsidian gradient #090D16 to #0F172A with border
        const bgT = (nx + ny) / 2;
        const bgR = Math.round(9 * (1 - bgT) + 15 * bgT);
        const bgG = Math.round(13 * (1 - bgT) + 23 * bgT);
        const bgB = Math.round(22 * (1 - bgT) + 42 * bgT);
        rawData[pixelOffset] = bgR;
        rawData[pixelOffset + 1] = bgG;
        rawData[pixelOffset + 2] = bgB;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflateSync(rawData));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const densities = [
  { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

const resDir = 'android/app/src/main/res';

for (const d of densities) {
  const dir = join(resDir, d.name);
  mkdirSync(dir, { recursive: true });

  // Standard square/squircle icon
  const standard = createHabuiltIconPNG(d.size, false, false);
  writeFileSync(join(dir, 'ic_launcher.png'), standard);

  // Round icon
  const round = createHabuiltIconPNG(d.size, false, true);
  writeFileSync(join(dir, 'ic_launcher_round.png'), round);

  // Adaptive foreground
  const fg = createHabuiltIconPNG(d.fgSize, true, false);
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), fg);

  console.log(`✓ Generated icons for ${d.name}`);
}

console.log('🎉 All Android app icons generated successfully!');
