import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

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

function generateMonochromeBadgePNG(size, outputPath) {
  const width = size;
  const height = size;

  // Scanline data: height rows, each row has 1 filter byte + width * 4 RGBA bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  // We want to draw the Habuilt "H" symbol in white (255, 255, 255, alpha) with transparent background
  // Normalize coordinates 0 to 1
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const nx = x / width;

      let isInsideH = false;

      // H Left Bar: x in [0.22, 0.38], y in [0.22, 0.78]
      if (nx >= 0.22 && nx <= 0.38 && ny >= 0.22 && ny <= 0.78) {
        isInsideH = true;
      }
      // H Right Bar: x in [0.62, 0.78], y in [0.22, 0.78]
      if (nx >= 0.62 && nx <= 0.78 && ny >= 0.22 && ny <= 0.78) {
        isInsideH = true;
      }
      // H Crossbar: x in [0.38, 0.62], y in [0.44, 0.56]
      if (nx >= 0.38 && nx <= 0.62 && ny >= 0.44 && ny <= 0.56) {
        isInsideH = true;
      }
      // Accent Circle Dot top right: center at (0.80, 0.20), radius 0.07
      const dx = nx - 0.80;
      const dy = ny - 0.20;
      if (dx * dx + dy * dy <= 0.07 * 0.07) {
        isInsideH = true;
      }

      if (isInsideH) {
        rawData[pixelOffset] = 255;     // R
        rawData[pixelOffset + 1] = 255; // G
        rawData[pixelOffset + 2] = 255; // B
        rawData[pixelOffset + 3] = 255; // A (Full white alpha silhouette for Android status bar)
      } else {
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;   // Transparent (Alpha = 0)
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflateSync(rawData));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  writeFileSync(outputPath, pngBuffer);
  console.log(`Generated transparent badge: ${outputPath} (${width}x${height})`);
}

generateMonochromeBadgePNG(96, 'public/icons/badge-monochrome-96.png');
generateMonochromeBadgePNG(72, 'public/icons/badge-monochrome-72.png');
